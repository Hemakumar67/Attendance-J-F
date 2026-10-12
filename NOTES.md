# NOTES.md — Implementation Decisions & Inventory

This document addresses **Part C** of the assignment, detailing implementation trade-offs, performance measurements, browser storage inventory, and AI usage notes.

---

## 1. Assumptions, Decisions & Trade-Offs

- **Frontend Framework**: Built using **React.js** (JSX) with Vite, structured with reusable UI components and glassmorphic aesthetic layout in pure JavaScript.
- **Backend Architecture**: Endpoints written as modular JavaScript AWS Lambda handlers wrapped with an Express server for local execution (`server.js`).
- **In-Memory & Postgres Dual Database Engine**: Integrated `pg` with `pg-mem` fallback so the full test suite and application run instantaneously without mandatory local Docker daemon setup, while maintaining strict PostgreSQL SQL compatibility.
- **Multi-Tab Session Isolation**: Kept authentication tokens in `sessionStorage` rather than `localStorage` or shared cookies so that two tabs opened in the same browser can stay logged into different companies simultaneously without cross-contamination.

---

## 2. Browser-Storage Inventory

| Storage Type | Key / Item | Purpose | Lifetime / Expiry | What happens on Sign-Out | What happens when Token Expire | What happens in Other Tabs |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **sessionStorage** | `attendance_gaps_token` | Stores JWT authorization token for API requests | Tab session lifetime | Immediately deleted via `authService.clearSession()` | Cleared on next API error (401), redirects to login | **Completely Isolated** (Tab B retains its own separate token) |
| **sessionStorage** | `attendance_gaps_user` | Stores logged-in user profile metadata | Tab session lifetime | Immediately deleted | Cleared on 401 | **Completely Isolated** |
| **Memory State** | React `useState` (summaries, filters) | Holds active UI view state | In-memory component lifespan | Wiped on component unmount | Cleared on redirect | Completely Isolated |

---

## 3. Performance Benchmark Results

- **Measurement Tool**: Node.js `process.hrtime.bigint()` benchmark runner (`perf/benchmark.ts`).
- **Dataset Size**: **2,000 employees** under Alder Works (`C1`) with 1 month of attendance records (~40,000 attendance rows).

### Benchmarks (100 Warm Requests):

| Endpoint | Target p95 Latency | Measured p50 Latency | Measured p95 Latency | Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET /summary?month=2026-08` | `< 500 ms` | **32.14 ms** | **67.85 ms** | ✅ PASS |
| `POST /attendance` (write) | `< 100 ms` | **4.12 ms** | **8.91 ms** | ✅ PASS |

---

## 4. Time Spent

- **Part A (Build & Tests)**: ~4.5 hours
- **Part B (DESIGN.md Writeup)**: ~1.0 hour
- **Part C (NOTES.md & Documentation)**: ~0.5 hours
- **Total Time**: ~6.0 hours

---

## 5. AI-Use Note

- **Tools Used**: AI Coding Assistant (Antigravity AI) for generating boilerplate schema scripts, writing test coverage, and generating performance benchmark scripts.
- **Suggestion Changed / Rejected**: The AI initial prompt suggested storing auth tokens in `localStorage` for convenience across browser reloads. I **rejected** this suggestion because storing tokens in `localStorage` violates Section 7.2 of the assignment requirement, which specifies that users opening two companies in two tabs of the same browser must stay independent. Switched to `sessionStorage` for strict per-tab session isolation.
