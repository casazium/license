// test/revoke-license.test.js

import { describe, test, beforeAll, expect } from 'vitest';
import { buildApp } from '../src/app.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbFile = path.resolve(__dirname, `test-revoke-${process.pid}.db`);

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

describe('POST /revoke-license', () => {
  test('revokes an active license successfully', async () => {
    const db = app.sqlite;
    db.prepare(
      `INSERT INTO license_keys (key, tier, product_id, issued_to, expires_at, status, limits) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'active-key',
      'pro',
      'casazium-auth',
      'alice@example.com',
      '2099-01-01T00:00:00Z',
      'active',
      '{}'
    );

    const res = await app.inject({
      method: 'POST',
      url: '/revoke-license',
      payload: { key: 'active-key', reason: 'fraud detected' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      key: 'active-key',
      status: 'revoked',
      reason: 'fraud detected',
    });
  });

  test('returns 404 for unknown license key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/revoke-license',
      payload: { key: 'nonexistent-key' },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      error: 'License key not found or already revoked',
    });
  });

  test('returns 404 for already revoked license', async () => {
    const db = app.sqlite;
    db.prepare(
      `INSERT INTO license_keys (key, tier, product_id, issued_to, expires_at, status, limits) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'revoked-key',
      'pro',
      'casazium-auth',
      'bob@example.com',
      '2099-01-01T00:00:00Z',
      'revoked',
      '{}'
    );

    const res = await app.inject({
      method: 'POST',
      url: '/revoke-license',
      payload: { key: 'revoked-key' },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      error: 'License key not found or already revoked',
    });
  });

  test('returns 400 for missing key in payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/revoke-license',
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'License key is required' });
  });
});
