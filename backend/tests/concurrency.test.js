const request = require('supertest');
const app = require('../src/server');
const { seedDatabase } = require('../src/db/seed');
const { generateTestToken } = require('../src/auth/jwtVerifier');

describe('Concurrency & Race Condition Tests', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  test('two identical POST /attendance requests in parallel produce exactly one 201 and one 409', async () => {
    const token = generateTestToken('hari@alder.example', 'http://localhost:4000/auth/c1');
    const payload = {
      employeeId: 'E06',
      date: '2026-08-03',
      status: 'P'
    };

    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${token}`)
        .send(payload),
      request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
    ]);

    const statuses = [res1.status, res2.status].sort();

    expect(statuses).toEqual([201, 409]);
  });
});
