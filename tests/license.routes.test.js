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
import { api } from './helpers/api.js';

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
  if (app) {
    await app.close();
  }
  await fs.unlink(testDbFile).catch(() => {});
});

describe('POST /issue-license', () => {
  test('returns 200 and a license key with valid input', async () => {
    const res = await app.inject({
      method: 'POST',
      url: api('/issue-license'),
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
      url: api('/issue-license'),
      payload: { product_id: 'casazium-auth' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/required fields/);
  });

  test('returns 400 for unknown limit key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: api('/issue-license'),
      payload: {
        tier: 'pro',
        product_id: 'casazium-auth',
        issued_to: 'test@example.com',
        expires_at: '2026-01-01T00:00:00Z',
        limits: { foo: 123 },
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/Unknown limit key/);
  });

  test('returns 400 for malformed features list', async () => {
    const res = await app.inject({
      method: 'POST',
      url: api('/issue-license'),
      payload: {
        tier: 'pro',
        product_id: 'casazium-auth',
        issued_to: 'test@example.com',
        expires_at: '2026-01-01T00:00:00Z',
        limits: { features: 5 },
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/features must be an array/);
  });
});

describe('POST /verify-license', () => {
  let key;

  beforeEach(async () => {
    const res = await app.inject({
      method: 'POST',
      url: api('/issue-license'),
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
      url: api('/verify-license'),
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
      url: api('/verify-license'),
      payload: { key: 'non-existent-key' },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().valid).toBe(false);
  });

  test('returns 403 for expired license', async () => {
    const expiredRes = await app.inject({
      method: 'POST',
      url: api('/issue-license'),
      payload: {
        tier: 'free',
        product_id: 'casazium-auth',
        issued_to: 'expired@example.com',
        expires_at: '2000-01-01T00:00:00Z',
      },
    });
    const expiredKey = (await expiredRes.json()).key;

    const res = await app.inject({
      method: 'POST',
      url: api('/verify-license'),
      payload: { key: expiredKey },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().valid).toBe(false);
    expect(res.json().error).toMatch(/expired/);
  });

  test('returns 403 for revoked license', async () => {
    const db = app.sqlite;
    db.prepare('UPDATE license_keys SET status = ? WHERE key = ?').run(
      'revoked',
      key
    );

    const res = await app.inject({
      method: 'POST',
      url: api('/verify-license'),
      payload: { key },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().valid).toBe(false);
    expect(res.json().error).toMatch(/not active/);
  });

  test('returns 400 for missing key in payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: api('/verify-license'),
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/License key is required/);
  });
});
