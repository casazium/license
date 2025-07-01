// test/usage-report.test.js

import { describe, test, beforeAll, expect } from 'vitest';
import { buildApp } from '../src/app.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { api } from './helpers/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbFile = path.resolve(
  __dirname,
  `test-usage-report-${process.pid}.db`
);

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
    'report-key',
    'pro',
    'casazium-auth',
    'user@example.com',
    '2099-01-01T00:00:00Z',
    'active',
    JSON.stringify({ requests: 100 }),
    JSON.stringify({ requests: 25 })
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

describe('POST /usage-report', () => {
  test('returns usage report for valid license', async () => {
    const res = await app.inject({
      method: 'POST',
      url: api('/usage-report'),
      payload: { key: 'report-key' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      valid: true,
      status: 'active',
      expires_at: '2099-01-01T00:00:00Z',
      metrics: [
        {
          metric: 'requests',
          used: 25,
          limit: 100,
          remaining: 75,
          exceeded: false,
        },
      ],
    });
  });

  test('returns 404 for unknown key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: api('/usage-report'),
      payload: { key: 'missing-key' },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'License key not found' });
  });

  test('returns 400 for missing key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: api('/usage-report'),
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'License key is required' });
  });
});
