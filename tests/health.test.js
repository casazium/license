import { describe, it, expect, beforeAll, afterAll } from 'vitest';
console.log('💡 Starting health.test.js');
import { buildApp } from '../src/app.js';

describe('GET / (Health Check)', () => {
  let app;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 200 and a health message with version', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/',
    });

    expect(res.statusCode).toBe(200);
    const body = await res.json();
    expect(body.message).toBe('License API is running');
    expect(body.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});
