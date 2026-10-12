const request = require('supertest');
const app = require('../src/server');
const { seedDatabase } = require('../src/db/seed');
const { generateTestToken } = require('../src/auth/jwtVerifier');

describe('RBAC & Cross-Tenant Access Control Tests', () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  test('EMPLOYEE (Asha E01) sees only her own row', async () => {
    const token = generateTestToken('asha@alder.example', 'http://localhost:4000/auth/c1');
    const res = await request(app)
      .get('/api/summary?month=2026-08')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].employeeId).toBe('E01');
  });

  test('MANAGER (Maya M01) sees self and direct reports', async () => {
    const token = generateTestToken('maya@alder.example', 'http://localhost:4000/auth/c1');
    const res = await request(app)
      .get('/api/summary?month=2026-08')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const empIds = res.body.map(r => r.employeeId);
    expect(empIds).toContain('M01'); // Self
    expect(empIds).toContain('E01'); // Direct report
    expect(empIds).toContain('E02'); // Direct report
    expect(empIds).not.toContain('B01'); // Cross-company
  });

  test('HR_ADMIN (Hari H01) sees everyone in company C1', async () => {
    const token = generateTestToken('hari@alder.example', 'http://localhost:4000/auth/c1');
    const res = await request(app)
      .get('/api/summary?month=2026-08')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(6);
    const companyIds = res.body.map(r => r.companyId);
    expect(companyIds).not.toContain('C2');
  });

  test('PAYROLL_VIEWER can see employees but cannot record attendance (returns 403)', async () => {
    const token = generateTestToken('ivan@birch.example', 'http://localhost:4000/auth/c2');
    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: 'B02', date: '2026-08-01', status: 'P' });

    expect(res.status).toBe(403);
  });

  test('Trying to record for someone outside read permission set returns 404', async () => {
    const token = generateTestToken('maya@alder.example', 'http://localhost:4000/auth/c1');
    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: 'E03', date: '2026-08-01', status: 'P' });

    expect(res.status).toBe(404);
  });

  test('User cannot query or record for employee in another company (returns 404)', async () => {
    const token = generateTestToken('hari@alder.example', 'http://localhost:4000/auth/c1');
    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: 'B01', date: '2026-08-01', status: 'P' });

    expect(res.status).toBe(404);
  });
});
