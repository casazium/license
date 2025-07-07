// tests/export-license-file.test.js

import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import { buildApp } from '../src/app.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { api } from './helpers/api.js';
import {
  LICENSE_ENCRYPTION_KEY,
  LICENSE_SIGNING_SECRET,
} from '../src/lib/config.js';
import { decryptLicenseFile, verifyLicenseSignature } from '../sdk/verify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbFile = path.resolve(
  __dirname,
  `test-export-license-${process.pid}.db`
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

describe('POST /export-license-file', () => {
  test('exports and decrypts a valid license file', async () => {
    const db = app.sqlite;

    db.prepare(
      `
      INSERT INTO license_keys 
        (key, tier, product_id, issued_to, issued_at, expires_at, status, usage_limit, usage_count) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      'test-key-abc',
      'pro',
      'casazium-auth',
      'test@example.com',
      '2025-01-01T00:00:00Z',
      '2030-01-01T00:00:00Z',
      'active',
      10,
      1
    );

    const res = await app.inject({
      method: 'POST',
      url: api('/export-license-file'),
      payload: { key: 'test-key-abc' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);

    const { license } = res.json();
    expect(license).toBeDefined();

    const decoded = await decryptLicenseFile(license, LICENSE_ENCRYPTION_KEY);
    const verified = verifyLicenseSignature(decoded, LICENSE_SIGNING_SECRET);

    expect(verified).toBe(true);
    expect(decoded.key).toBe('test-key-abc');
    expect(decoded.product_id).toBe('casazium-auth');
  });

  test('returns 404 for nonexistent key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: api('/export-license-file'),
      payload: { key: 'no-such-key' },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      error: 'License key not found',
    });
  });

  test('returns 400 for missing key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: api('/export-license-file'),
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      error: 'License key is required',
    });
  });
});
