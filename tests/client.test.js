import { describe, test, expect } from 'vitest';
import nock from 'nock';
import { CasaziumLicenseClient } from '../sdk/client.js';
import crypto from 'node:crypto';

const baseUrl = 'http://localhost:3001';

describe('CasaziumLicenseClient', () => {
  const client = new CasaziumLicenseClient({ baseUrl, retries: 2 });

  test('verifyKey succeeds', async () => {
    nock(baseUrl)
      .post('/verify-license', JSON.stringify({ key: 'key123' }))
      .reply(200, { valid: true });

    const result = await client.verifyKey('key123');
    expect(result.valid).toBe(true);
  });

  test('verifyKey fails with status error', async () => {
    const scope = nock(baseUrl)
      .post('/verify-license') // don't match body
      .reply(403, { error: 'Forbidden' });

    await expect(client.verifyKey('key123')).rejects.toThrow(
      /verifyKey failed with 403/
    );

    expect(scope.isDone()).toBe(true); // verify it was used
  });

  test('trackUsage succeeds', async () => {
    nock(baseUrl)
      .post(
        '/track-usage',
        JSON.stringify({ key: 'key123', metric: 'events', increment: 2 })
      )
      .reply(200, { ok: true });

    const result = await client.trackUsage('key123', 'events', 2);
    expect(result.ok).toBe(true);
  });

  test('getUsageReport succeeds', async () => {
    nock(baseUrl)
      .post('/usage-report', JSON.stringify({ key: 'key123' }))
      .reply(200, { users: 5 });

    const result = await client.getUsageReport('key123');
    expect(result.users).toBe(5);
  });

  test('listLicenses with query params', async () => {
    nock(baseUrl)
      .get(
        (uri) =>
          uri.includes('/list-licenses') && uri.includes('product_id=auth')
      )
      .reply(200, { licenses: [1, 2] });

    const result = await client.listLicenses({ product_id: 'auth' });
    expect(result.licenses).toHaveLength(2);
  });

  test('activate succeeds', async () => {
    nock(baseUrl)
      .post(
        '/activate',
        JSON.stringify({ key: 'key123', instance_id: 'instance-abc' })
      )
      .reply(200, { activated: true });

    const result = await client.activate('key123', 'instance-abc');
    expect(result.activated).toBe(true);
  });

  test('revoke succeeds', async () => {
    nock(baseUrl)
      .post('/revoke-license', JSON.stringify({ key: 'key123' }))
      .reply(200, { revoked: true });

    const result = await client.revoke('key123');
    expect(result.revoked).toBe(true);
  });

  test('verifySignedFile throws without publicKey', () => {
    const bareClient = new CasaziumLicenseClient({ baseUrl });
    expect(() =>
      bareClient.verifySignedFile({ license: {}, signature: 'abc' })
    ).toThrow(/publicKey is required/);
  });

  test('verifySignedFile succeeds with real key pair', () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });

    const license = { key: 'abc', plan: 'pro' };
    const signer = crypto.createSign('SHA256');
    signer.update(JSON.stringify(license));
    signer.end();
    const signature = signer.sign(privateKey, 'base64');

    const sigClient = new CasaziumLicenseClient({ baseUrl, publicKey });
    const isValid = sigClient.verifySignedFile({ license, signature });
    expect(isValid).toBe(true);
  });
});
