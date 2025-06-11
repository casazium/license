// test/license.routes.test.js

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';
import { buildApp } from '../src/app.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbFile = path.resolve(__dirname, `test-${process.pid}.db`);

let app;

beforeAll(async () => {
  // Setup test DB from schema
  const schema = await fs.readFile(
    path.resolve(__dirname, '../src/db/schema.sql'),
    'utf-8'
  );
  const db = new Database(testDbFile);
  db.exec(schema);
  db.close();

  process.env.DATABASE_FILE = testDbFile;
  app = await buildApp();
});

afterAll(async () => {
  await fs.unlink(testDbFile).catch(() => {});
});

describe('POST /issue-license', () => {
  test('returns 200 and a license key with valid input', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/issue-license',
      payload: {
        tier: 'pro',
        product_id: 'casazium-auth',
        issued_to: 'test@example.com',
        expires_at: '2026-01-01T00:00:00Z',
        limits: { users: 10 },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = await res.json();
    expect(body.key).toMatch(/[0-9a-f\-]{36}/);
    expect(body.status).toBe('issued');
  });

  test('returns 400 for missing fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/issue-license',
      payload: { product_id: 'casazium-auth' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/required fields/);
  });
});

describe('POST /verify-license', () => {
  let key;

  beforeEach(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/issue-license',
      payload: {
        tier: 'pro',
        product_id: 'casazium-auth',
        issued_to: 'test@example.com',
        expires_at: '2099-01-01T00:00:00Z',
        limits: { users: 5 },
      },
    });
    key = (await res.json()).key;
  });

  test('returns valid: true for active, unexpired license', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/verify-license',
      payload: { key },
    });

    expect(res.statusCode).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.limits.users).toBe(5);
  });

  test('returns 404 for unknown key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/verify-license',
      payload: { key: 'non-existent-key' },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().valid).toBe(false);
  });
});
