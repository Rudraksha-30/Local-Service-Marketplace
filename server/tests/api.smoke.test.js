/**
 * API smoke tests that need NO database: they exercise routing, input validation
 * (NFR-7) and authentication guards (NFR-6), all of which reject the request
 * before any database call happens.
 *
 * Full integration tests (register -> book -> complete -> review against a real
 * MongoDB) are planned for Sprint 2.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../src/app');

describe('API smoke tests', () => {
  test('GET /api/health responds ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('unknown routes return a JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  test('register rejects a bad email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'not-an-email', password: 'longenough', role: 'customer' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'email')).toBe(true);
  });

  test('register rejects a short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'a@b.com', password: 'short', role: 'customer' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
  });

  test('register cannot create an admin account', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'a@b.com', password: 'longenough', role: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'role')).toBe(true);
  });

  test('protected routes require a token', async () => {
    for (const path of ['/api/auth/me', '/api/bookings']) {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
    }
  });

  test('a garbage token is rejected', async () => {
    const res = await request(app).get('/api/bookings').set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(401);
  });

  test('creating a booking without a token is rejected', async () => {
    const res = await request(app).post('/api/bookings').send({});
    expect(res.status).toBe(401);
  });
});
