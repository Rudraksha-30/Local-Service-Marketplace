/**
 * Regression test for a real bug: the auth rate limiter used to cover GET /api/auth/me,
 * which the client calls on every page load, so normal browsing got users locked out.
 * Now only login and register are limited. No database needed: the limiter runs before any controller.
 */
process.env.NODE_ENV = 'test'; // keeps request logging quiet while the app is created
process.env.JWT_SECRET = 'test-secret-test-secret';
process.env.AUTH_RATE_LIMIT = '3';

const request = require('supertest');
const app = require('../src/app');

describe('auth rate limiting', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'development'; // the limiter is skipped while NODE_ENV is "test"
  });
  afterAll(() => {
    process.env.NODE_ENV = 'test';
  });

  test('GET /api/auth/me is never rate limited, however often it is called', async () => {
    for (let i = 0; i < 10; i += 1) {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401); // "not signed in", never 429
    }
  });

  test('register is limited after the allowed number of attempts', async () => {
    const statuses = [];
    for (let i = 0; i < 5; i += 1) {
      statuses.push((await request(app).post('/api/auth/register').send({})).status);
    }
    expect(statuses.slice(0, 3)).toEqual([400, 400, 400]); // rejected by validation, but counted
    expect(statuses.slice(3)).toEqual([429, 429]);
  });

  test('repeated failed logins are limited too', async () => {
    const statuses = [];
    for (let i = 0; i < 5; i += 1) {
      statuses.push((await request(app).post('/api/auth/login').send({})).status);
    }
    expect(statuses.slice(0, 3)).toEqual([400, 400, 400]);
    expect(statuses.slice(3)).toEqual([429, 429]);
  });
});
