const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/server');
const { seedDatabase } = require('../src/db/seed');

describe('Token Validation & Security Tests', () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  test('refuses token from wrong issuer', async () => {
    const wrongIssuerToken = jwt.sign(
      { sub: 'hari@alder.example', email: 'hari@alder.example', iss: 'http://malicious-issuer.com', aud: 'attendance-gaps-app' },
      process.env.JWT_SECRET || 'attendance-gaps-secret-key-2026'
    );

    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${wrongIssuerToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Issuer mismatch');
  });

  test('refuses token meant for another app (aud mismatch)', async () => {
    const wrongAudToken = jwt.sign(
      { sub: 'hari@alder.example', email: 'hari@alder.example', iss: 'http://localhost:4000/auth/c1', aud: 'other-app' },
      process.env.JWT_SECRET || 'attendance-gaps-secret-key-2026'
    );

    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${wrongAudToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('audience mismatch');
  });

  test('refuses expired token', async () => {
    const expiredToken = jwt.sign(
      { sub: 'hari@alder.example', email: 'hari@alder.example', iss: 'http://localhost:4000/auth/c1', aud: 'attendance-gaps-app' },
      process.env.JWT_SECRET || 'attendance-gaps-secret-key-2026',
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });

  test('refuses token for employee who has left (Kiran E08 left 2026-07-20)', async () => {
    const leaverToken = jwt.sign(
      { sub: 'kiran@alder.example', email: 'kiran@alder.example', iss: 'http://localhost:4000/auth/c1', aud: 'attendance-gaps-app' },
      process.env.JWT_SECRET || 'attendance-gaps-secret-key-2026'
    );

    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${leaverToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Employee has left');
  });
});
