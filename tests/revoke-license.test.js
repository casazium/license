// tests/revoke-license.test.js

import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import { buildApp } from '../src/app.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { api } from './helpers/api.js';

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
  try {
    await fs.unlink(testDbFile);
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
      url: api('/revoke-license'),
      payload: { key: 'active-key', revoked: true },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      key: 'active-key',
      status: 'revoked',
    });
  });

  test('unrevokes a revoked license successfully', async () => {
    const db = app.sqlite;
    db.prepare(
      `INSERT INTO license_keys (key, tier, product_id, issued_to, expires_at, status, revoked_at, limits) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`
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
      url: api('/revoke-license'),
      payload: { key: 'revoked-key', revoked: false },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      key: 'revoked-key',
      status: 'active',
    });
  });

  test('returns 404 for unknown license key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: api('/revoke-license'),
      payload: { key: 'nonexistent-key', revoked: true },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      error: 'License key not found',
    });
  });

  test('returns 409 for already revoked license', async () => {
    const db = app.sqlite;
    db.prepare(
      `INSERT INTO license_keys (key, tier, product_id, issued_to, expires_at, status, revoked_at, limits) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`
    ).run(
      'already-revoked',
      'pro',
      'casazium-auth',
      'chris@example.com',
      '2099-01-01T00:00:00Z',
      'revoked',
      '{}'
    );

    const res = await app.inject({
      method: 'POST',
      url: api('/revoke-license'),
      payload: { key: 'already-revoked', revoked: true },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({
      error: 'License already in desired state',
    });
  });

  test('returns 409 for already active license', async () => {
    const db = app.sqlite;
    db.prepare(
      `INSERT INTO license_keys (key, tier, product_id, issued_to, expires_at, status, limits) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'already-active',
      'pro',
      'casazium-auth',
      'dan@example.com',
      '2099-01-01T00:00:00Z',
      'active',
      '{}'
    );

    const res = await app.inject({
      method: 'POST',
      url: api('/revoke-license'),
      payload: { key: 'already-active', revoked: false },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({
      error: 'License already in desired state',
    });
  });

  test('returns 400 for missing key in payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: api('/revoke-license'),
      payload: { revoked: true },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      error: 'License key and revoked flag are required',
    });
  });

  test('returns 400 for missing revoked flag in payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: api('/revoke-license'),
      payload: { key: 'test-key' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      error: 'License key and revoked flag are required',
    });
  });
});
