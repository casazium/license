// test/verify-license-file.test.js

import { describe, test, beforeAll, expect } from 'vitest';
import { buildApp } from '../src/app.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { signLicense } from '../src/lib/license-signature.js';
import { fileURLToPath } from 'node:url';
import { api } from './helpers/api.js';
import { api } from './helpers/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbFile = path.resolve(__dirname, `test-verify-${process.pid}.db`);

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

describe('POST /verify-license-file', () => {
  test('returns valid: true for correctly signed and active license', async () => {
    const validLicense = {
      key: 'valid-key',
      tier: 'pro',
      product_id: 'casazium-auth',
      issued_to: 'alice@example.com',
      expires_at: '2099-01-01T00:00:00Z',
      limits: { users: 10 },
    };
    const db = app.sqlite;
    db.prepare(
      `INSERT INTO license_keys (key, tier, product_id, issued_to, expires_at, status, limits) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      validLicense.key,
      validLicense.tier,
      validLicense.product_id,
      validLicense.issued_to,
      validLicense.expires_at,
      'active',
      JSON.stringify(validLicense.limits)
    );

    validLicense.sig = signLicense(validLicense, 'test-secret');

    const res = await app.inject({
      method: 'POST',
      url: api('/verify-license-file'),
      payload: validLicense,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ valid: true, reason: null });
  });

  test('returns 403 for expired license', async () => {
    const expired = {
      key: 'expired-key',
      tier: 'pro',
      product_id: 'casazium-auth',
      issued_to: 'bob@example.com',
      expires_at: '2000-01-01T00:00:00Z',
      limits: {},
    };
    const db = app.sqlite;
    db.prepare(
      `INSERT INTO license_keys (key, tier, product_id, issued_to, expires_at, status, limits) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      expired.key,
      expired.tier,
      expired.product_id,
      expired.issued_to,
      expired.expires_at,
      'active',
      JSON.stringify(expired.limits)
    );

    expired.sig = signLicense(expired, 'test-secret');

    const res = await app.inject({
      method: 'POST',
      url: api('/verify-license-file'),
      payload: expired,
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ valid: false, reason: 'Expired' });
  });

  test('returns 403 for revoked license', async () => {
    const revoked = {
      key: 'revoked-key',
      tier: 'free',
      product_id: 'casazium-auth',
      issued_to: 'charlie@example.com',
      expires_at: '2099-01-01T00:00:00Z',
      limits: {},
    };
    const db = app.sqlite;
    db.prepare(
      `INSERT INTO license_keys (key, tier, product_id, issued_to, expires_at, status, limits) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      revoked.key,
      revoked.tier,
      revoked.product_id,
      revoked.issued_to,
      revoked.expires_at,
      'revoked',
      JSON.stringify(revoked.limits)
    );

    revoked.sig = signLicense(revoked, 'test-secret');

    const res = await app.inject({
      method: 'POST',
      url: api('/verify-license-file'),
      payload: revoked,
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({
      valid: false,
      reason: 'Revoked or not found',
    });
  });

  test('returns 403 for invalid signature', async () => {
    const tampered = {
      key: 'tampered-key',
      tier: 'pro',
      product_id: 'casazium-auth',
      issued_to: 'eve@example.com',
      expires_at: '2099-01-01T00:00:00Z',
      limits: {},
      sig: 'bad-signature',
    };
    const db = app.sqlite;
    db.prepare(
      `INSERT INTO license_keys (key, tier, product_id, issued_to, expires_at, status, limits) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      tampered.key,
      tampered.tier,
      tampered.product_id,
      tampered.issued_to,
      tampered.expires_at,
      'active',
      JSON.stringify(tampered.limits)
    );

    const res = await app.inject({
      method: 'POST',
      url: api('/verify-license-file'),
      payload: tampered,
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ valid: false, reason: 'Invalid signature' });
  });
});
