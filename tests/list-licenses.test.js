// test/list-licenses.test.js

import { describe, test, beforeAll, expect } from 'vitest';
import { buildApp } from '../src/app.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { api } from './helpers/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbFile = path.resolve(__dirname, `test-list-${process.pid}.db`);
const ADMIN_KEY = 'test-admin-secret';

let app;

beforeAll(async () => {

  process.env.DB_FILE = testDbFile;
  process.env.SKIP_DOTENV = true;
  process.env.ADMIN_API_KEY = ADMIN_KEY;
  app = await buildApp();

  const db2 = app.sqlite;
  const insert = db2.prepare(
    `INSERT INTO license_keys (key, tier, product_id, issued_to, expires_at, status, usage_limit, usage_count, limits) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (let i = 0; i < 10; i++) {
    insert.run(
      `key-${i}`,
      'pro',
      'casazium-auth',
      `user${i}@example.com`,
      '2099-01-01T00:00:00Z',
      i % 2 === 0 ? 'active' : 'revoked',
      100,
      i * 5,
      '{}'
    );
  }
});

afterAll(async () => {
  await app?.close?.();
//  if (!testDbFile) return;
  try {
    await fs.unlink(testDbFile);
    // console.log(`Deleted test DB: ${filePath}`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Failed to delete test DB: ${err.message}`);
    }
  }
});

describe('GET /list-licenses', () => {
  test('returns licenses with valid admin key', async () => {
    const res = await app.inject({
      method: 'GET',
      url: api('/list-licenses'),
      headers: { Authorization: `Bearer ${ADMIN_KEY}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().licenses).toHaveLength(10);
  });

  test('supports status filter', async () => {
    const res = await app.inject({
      method: 'GET',
      url: api('/list-licenses?status=active'),
      headers: { Authorization: `Bearer ${ADMIN_KEY}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().licenses.every((l) => l.status === 'active')).toBe(true);
  });

  test('supports pagination', async () => {
    const res = await app.inject({
      method: 'GET',
      url: api('/list-licenses?limit=3&offset=2'),
      headers: { Authorization: `Bearer ${ADMIN_KEY}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().licenses).toHaveLength(3);
  });

  test('returns 403 without valid admin key', async () => {
    const res = await app.inject({
      method: 'GET',
      url: api('/list-licenses'),
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: 'Unauthorized' });
  });
});
