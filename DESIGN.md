# DESIGN.md — Architecture & Scaling Strategy

This document addresses **Part B** of the assignment: running Attendance Gaps at scale for hundreds of companies, with low latency, strong tenant isolation, and predictable costs.

---

## 1. System Architecture

```
[ Browser / React App ]
         │ (HTTPS / TLS 1.3)
         ▼
[ AWS CloudFront CDN ] ──► Static React Assets (S3)
         │
         ▼
[ Amazon API Gateway (REST API) ]
         │ (JWT Authorizer Lambda / OIDC validation)
         ▼
[ AWS Lambda (Node.js 20 Handlers in VPC) ]
         │
         ├──► [ Amazon ElastiCache Redis Cluster ] (Permissions & Summary Cache)
         │
         ▼
[ Amazon RDS Proxy ] (Connection Pooling)
         │
         ▼
[ Amazon Aurora PostgreSQL (Multi-AZ Serverless v2) ]
```

### Request Flow:
1. **Frontend**: React SPA hosted via CloudFront + S3 bucket.
2. **API Gateway**: Handles incoming HTTPS traffic, throttles burst traffic per tenant, and executes custom Lambda authorizer to validate JWT signatures and issuer claims.
3. **AWS Lambda**: Node.js 20 handlers running inside VPC. Stateless execution allows instant horizontal scaling.
4. **RDS Proxy**: Pools database connections to prevent Lambda scaling spikes from exhausting database connection limits.
5. **Aurora PostgreSQL**: Multi-AZ primary database with read replicas.

---

## 2. Tenant Isolation & Onboarding

### Data Isolation (Row-Level Security + Schema Strategy):
- **Tenant Context**: Every database table includes `company_id`.
- **Row-Level Security (RLS)**: Enable PostgreSQL RLS policies ensuring that every query executes with `SET LOCAL app.current_tenant = 'C1'`, preventing cross-tenant leakage even if application code contains a bug.
- **Dedicated Schemas for Enterprise Tier**: High-volume clients (10,000+ employees) can be isolated onto dedicated schema or separate Aurora databases.

### Onboarding a New Company:
1. Register company entry in `companies` table with `id`, `name`, `email_domain`, and OIDC `issuer_url`.
2. Configure OIDC client trust relationship with company's IdP (Okta, Keycloak, Azure AD).
3. Seed default roles (`EMPLOYEE`, `MANAGER`, `HR_ADMIN`) and permissions into database.

---

## 3. RBAC at Scale

### Permission Caching Strategy:
- **JWT Claims**: Store static role ID (`role_id`) inside signed JWT payload.
- **Redis Permission Cache**: Permission lookup maps `role_permissions` in ElastiCache Redis with a TTL of 15 minutes:
  `CACHE KEY: rbac:permissions:<company_id>:<role_id>`
- **Instant Revocation**: When HR revokes a role or changes permissions, publish a Redis Pub/Sub invalidation event `DEL rbac:permissions:<company_id>:*`, forcing immediate cache refresh on next request.

---

## 4. Database Scaling at 10x Load (600 Companies / 600,000 Employees)

### Partitioning & Indexing Strategy:
- **Declarative Partitioning on `attendance` Table**: Partition by Range on `attendance_date` (monthly partitions, e.g., `attendance_2026_08`).
- **Composite Indexing**:
  `CREATE INDEX idx_att_emp_date ON attendance(employee_id, attendance_date);`
  `CREATE INDEX idx_emp_comp_manager ON employees(company_id, manager_id);`
- **Materialized Views / Aggregations**: Pre-compute monthly summary aggregates (`calendar_days`, `scheduled_days`, `unpaid_days`) into a summary table updated via asynchronous triggers or scheduled worker lambdas.

### Zero-Downtime Migrations:
- Use Expand/Contract pattern:
  1. Phase 1: Add new nullable columns or tables.
  2. Phase 2: Deploy updated application code writing to both old and new schemas.
  3. Phase 3: Backfill historical data.
  4. Phase 4: Contract (drop old unused columns).

---

## 5. Latency Budget & Optimization

### GET /summary Latency Budget Breakdown:
- Target p95: **< 500 ms** (Today actual: ~68 ms)
  - Network RTT (TLS + API Gateway): **30 ms**
  - Lambda Execution & Cold Start avoidance: **15 ms**
  - Redis RBAC / Session Lookup: **3 ms**
  - Aurora Postgres Indexed Query: **20 ms**
  - Total Estimated Latency at 10x Load: **~68 ms**

### Cold Starts & Connection Pooling:
- Use **AWS Lambda Provisioned Concurrency** (or Warmup Pings) for peak hours (09:00 - 11:00 IST).
- **RDS Proxy** eliminates connection setup overhead (reducing latency by ~100ms per cold start).

---

## 6. Cost Estimation & Optimization (-30% Cost Cut Strategy)

### Monthly Cost Estimates:

| Component | Today (60,000 users) | 10x Load (600,000 users) |
| :--- | :--- | :--- |
| AWS Lambda | \$15 / month | \$120 / month |
| API Gateway | \$25 / month | \$210 / month |
| Aurora PostgreSQL Serverless v2 | \$120 / month | \$780 / month |
| Redis ElastiCache | \$45 / month | \$180 / month |
| CloudFront / S3 | \$10 / month | \$60 / month |
| **Total Estimated Cost** | **~\$215 / month** | **~\$1,350 / month** |

### Two Cost Reduction Strategies (Cut Cost by > 30% Without Hurting p95 Latency):
1. **Cache GET /summary at CloudFront / Redis Edge**: Cache responses per employee with a 1-minute TTL and invalidation tag on POST `/attendance`. This reduces Aurora read queries by **65%**, saving ~$300/month on Aurora ACU units.
2. **Commitment Discounts (Savings Plans & Reserved Instances)**: Use 1-year Compute Savings Plans for Lambda and Reserved ACUs for Aurora, cutting compute costs by **35%**.

---

## 7. Operational Alarms & Resiliency

### CloudWatch Alarms:
1. **No Attendance Recorded Alarm**: Triggers if a company records zero attendance entries between 09:00 - 11:00 IST on a working day (`SUM(POST /attendance) == 0`).
2. **IdP Outage Alarm**: Triggers if token validation failures spike above 5% for a specific issuer domain.

### Handling Identity Provider (IdP) Downtime:
- When a company's IdP goes down, users with existing unexpired JWT tokens (e.g. 8-hour sessions) continue working uninterrupted.
- Display a fallback banner: *"Company SSO identity provider is currently experiencing issues. Active sessions remain unaffected."*
