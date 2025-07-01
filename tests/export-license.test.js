// test/export-license.test.js

import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import { buildApp } from '../src/app.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { signLicense } from '../src/lib/license-signature.js';
import { api } from './helpers/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbFile = path.resolve(__dirname, `test-export-${process.pid}.db`);

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
  process.env.LICENSE_SIGNING_SECRET = 'test-secret';
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

describe('GET /export-license/:key', () => {
  test('exports a signed license for a valid key', async () => {
    const db = app.sqlite;
    db.prepare(
      `INSERT INTO license_keys (key, tier, product_id, issued_to, expires_at, limits) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      'valid-key',
      'pro',
      'casazium-auth',
      'alice@example.com',
      '2099-01-01T00:00:00Z',
      '{"max_users": 10}'
    );

    const res = await app.inject({
      method: 'GET',
      url: api('/export-license/valid-key'),
    });

    expect(res.statusCode).toBe(200);

    const body = res.json();
    const { sig, ...licenseWithoutSig } = body;
    const expectedSig = signLicense(licenseWithoutSig, 'test-secret');

    expect(body.key).toBe('valid-key');
    expect(body.tier).toBe('pro');
    expect(body.sig).toBe(expectedSig);
  });

  test('returns 404 for unknown license key', async () => {
    const res = await app.inject({
      method: 'GET',
      url: api('/export-license/unknown-key'),
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      error: 'License key not found',
    });
  });

  test('returns 500 if signing secret is missing', async () => {
    delete process.env.LICENSE_SIGNING_SECRET;

    const db = app.sqlite;
    db.prepare(
      `INSERT INTO license_keys (key, tier, product_id, issued_to, expires_at, limits) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      'missing-secret-key',
      'basic',
      'casazium-core',
      'bob@example.com',
      '2099-01-01T00:00:00Z',
      '{}'
    );

    const res = await app.inject({
      method: 'GET',
      url: api('/export-license/missing-secret-key'),
    });

    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      error: 'Signing secret not configured',
    });

    process.env.LICENSE_SIGNING_SECRET = 'test-secret'; // restore
  });
});
