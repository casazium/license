import { describe, test, expect, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';
import { api } from './helpers/api.js';

describe('POST /activate-license', () => {
  let app;

  beforeEach(async () => {
    app = await buildApp();
    const db = app.sqlite;
    db.prepare('DELETE FROM license_keys').run();
    db.prepare('DELETE FROM activations').run();
  });

  test('successfully activates a new instance', async () => {
    const db = app.sqlite;
    db.prepare(
      `INSERT INTO license_keys (key, product_id, tier, issued_to, expires_at, max_activations)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      'abc123',
      'casazium-auth',
      'pro',
      'alice@example.com',
      '2099-01-01T00:00:00Z',
      3
    );

    const res = await app.inject({
      method: 'POST',
      url: api('/activate-license'),
      payload: { key: 'abc123', instance_id: 'host1' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ activated: true });
  });

  test('returns alreadyActivated for duplicate activation', async () => {
    const db = app.sqlite;
    db.prepare(
      `INSERT INTO license_keys (key, product_id, tier, issued_to, expires_at, max_activations)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      'abc123',
      'casazium-auth',
      'pro',
      'alice@example.com',
      '2099-01-01T00:00:00Z',
      3
    );

    db.prepare(`INSERT INTO activations (key, instance_id) VALUES (?, ?)`).run(
      'abc123',
      'host1'
    );

    const res = await app.inject({
      method: 'POST',
      url: api('/activate-license'),
      payload: { key: 'abc123', instance_id: 'host1' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ activated: true, alreadyActivated: true });
  });

  test('returns 403 when max activations is exceeded', async () => {
    const db = app.sqlite;
    db.prepare(
      `INSERT INTO license_keys (key, product_id, tier, issued_to, expires_at, max_activations)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      'abc123',
      'casazium-auth',
      'pro',
      'alice@example.com',
      '2099-01-01T00:00:00Z',
      1
    );

    db.prepare(`INSERT INTO activations (key, instance_id) VALUES (?, ?)`).run(
      'abc123',
      'host1'
    );

    const res = await app.inject({
      method: 'POST',
      url: api('/activate-license'),
      payload: { key: 'abc123', instance_id: 'host2' },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({
      error: 'Activation limit exceeded for this license key',
    });
  });

  test('returns 403 when license is revoked', async () => {
    const db = app.sqlite;
    db.prepare(
      `INSERT INTO license_keys (
      key, product_id, tier, issued_to, expires_at, max_activations, revoked_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'revokedkey',
      'casazium-auth',
      'pro',
      'alice@example.com',
      '2099-01-01T00:00:00Z',
      3,
      new Date().toISOString() // <-- This triggers the route’s revoked check
    );

    const res = await app.inject({
      method: 'POST',
      url: api('/activate-license'),
      payload: { key: 'revokedkey', instance_id: 'host1' },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: 'License has been revoked' });
  });

  test('returns 403 when license is expired', async () => {
    const db = app.sqlite;
    db.prepare(
      `INSERT INTO license_keys (key, product_id, tier, issued_to, expires_at, max_activations)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      'expiredkey',
      'casazium-auth',
      'pro',
      'alice@example.com',
      '2000-01-01T00:00:00Z',
      3
    );

    const res = await app.inject({
      method: 'POST',
      url: api('/activate-license'),
      payload: { key: 'expiredkey', instance_id: 'host1' },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: 'License has expired' });
  });

  test('returns 404 for unknown key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: api('/activate-license'),
      payload: { key: 'nosuchkey', instance_id: 'host1' },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'License key not found' });
  });

  test('returns 400 for missing fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: api('/activate-license'),
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Missing required fields' });
  });
});
