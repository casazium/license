// test/delete-license.test.js

import { describe, test, beforeAll, expect } from 'vitest';
import { buildApp } from '../src/app.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbFile = path.resolve(__dirname, `test-delete-${process.pid}.db`);
const ADMIN_KEY = 'test-admin-secret';

let app;

beforeAll(async () => {
  const schema = await fs.readFile(
    path.resolve(__dirname, '../src/db/schema.sql'),
    'utf-8'
  );
  const db = new Database(testDbFile);
  db.exec(schema);
  db.close();

  process.env.DATABASE_FILE = testDbFile;
  process.env.ADMIN_API_KEY = ADMIN_KEY;
  app = await buildApp();

  const db2 = app.sqlite;
  db2
    .prepare(
      `INSERT INTO license_keys (key, tier, product_id, issued_to, expires_at, status, limits) VALUES (?, ?, ?, ?, ?, ?, ?);`
    )
    .run(
      'to-delete',
      'pro',
      'casazium-auth',
      'bob@example.com',
      '2099-01-01T00:00:00Z',
      'active',
      '{}'
    );
});

describe('DELETE /delete-license', () => {
  test('successfully deletes an existing license', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/delete-license',
      headers: { Authorization: `Bearer ${ADMIN_KEY}` },
      payload: { key: 'to-delete' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ key: 'to-delete', deleted: true });
  });

  test('returns 404 for nonexistent key', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/delete-license',
      headers: { Authorization: `Bearer ${ADMIN_KEY}` },
      payload: { key: 'does-not-exist' },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'License key not found' });
  });

  test('returns 403 without valid admin key', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/delete-license',
      payload: { key: 'to-delete' },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: 'Unauthorized' });
  });

  test('returns 400 for missing key in request body', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/delete-license',
      headers: { Authorization: `Bearer ${ADMIN_KEY}` },
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'License key is required' });
  });
});
