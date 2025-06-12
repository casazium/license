// test/track-usage.test.js

import { describe, test, beforeAll, expect } from 'vitest';
import { buildApp } from '../src/app.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbFile = path.resolve(__dirname, `test-usage-${process.pid}.db`);

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
  app = await buildApp();

  const db2 = app.sqlite;
  const insert = db2.prepare(`
    INSERT INTO license_keys (key, tier, product_id, issued_to, expires_at, status, limits, usage)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  insert.run(
    'active-key',
    'pro',
    'casazium-auth',
    'user@example.com',
    '2099-01-01T00:00:00Z',
    'active',
    JSON.stringify({ requests: 10 }),
    JSON.stringify({ requests: 5 })
  );
  insert.run(
    'revoked-key',
    'pro',
    'casazium-auth',
    'user@example.com',
    '2099-01-01T00:00:00Z',
    'revoked',
    JSON.stringify({ requests: 10 }),
    JSON.stringify({ requests: 5 })
  );
  insert.run(
    'expired-key',
    'pro',
    'casazium-auth',
    'user@example.com',
    '2000-01-01T00:00:00Z',
    'active',
    JSON.stringify({ requests: 10 }),
    JSON.stringify({ requests: 5 })
  );
});

afterAll(async () => {
  await app?.close?.();
  if (!testDbFile) return;
  try {
    await fs.unlink(testDbFile);
    // console.log(`Deleted test DB: ${filePath}`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Failed to delete test DB: ${err.message}`);
    }
  }
});

describe('POST /track-usage (extended)', () => {
  test('increments usage for a named metric', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/track-usage',
      payload: { key: 'active-key', metric: 'requests', increment: 2 },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, metric: 'requests', usage: 7 });
  });

  test('returns 403 if named limit exceeded', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/track-usage',
      payload: { key: 'active-key', metric: 'requests', increment: 10 },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({
      error: 'Usage limit exceeded for metric: requests',
    });
  });

  test('returns 403 if metric not allowlisted', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/track-usage',
      payload: { key: 'active-key', metric: 'activations', increment: 1 },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: 'Metric not allowed: activations' });
  });

  test('returns 403 for revoked license', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/track-usage',
      payload: { key: 'revoked-key', metric: 'requests', increment: 1 },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: 'License is not active' });
  });

  test('returns 403 for expired license', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/track-usage',
      payload: { key: 'expired-key', metric: 'requests', increment: 1 },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: 'License is expired' });
  });

  test('returns 404 for nonexistent key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/track-usage',
      payload: { key: 'missing-key', metric: 'requests', increment: 1 },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'License key not found' });
  });

  test('returns 400 for invalid input', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/track-usage',
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Invalid input' });
  });
});
