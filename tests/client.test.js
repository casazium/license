import { describe, test, expect } from 'vitest';
import nock from 'nock';
import { CasaziumLicenseClient } from '../sdk/client.js';
import crypto from 'node:crypto';

const baseUrl = 'http://127.0.0.1:3001/v1';

describe('CasaziumLicenseClient', () => {
  const client = new CasaziumLicenseClient({ baseUrl, retries: 2 });

  test('verifyKey succeeds', async () => {
    nock(baseUrl)
      .post('/verify-license', (body) => body.key === 'mock-key')
      .reply(200, { valid: true });

    const result = await client.verifyKey('mock-key');
    expect(result.valid).toBe(true);
  });

  test('verifyKey fails with status 403', async () => {
    nock(baseUrl)
      .post('/verify-license', (body) => body.key === 'bad-key')
      .reply(403, { error: 'Forbidden' });

    await expect(client.verifyKey('bad-key')).rejects.toThrow(
      /verifyKey failed with 403/
    );
  });

  test('trackUsage succeeds', async () => {
    nock(baseUrl)
      .post(
        '/track-usage',
        (body) =>
          body.key === 'mock-key' &&
          body.metric === 'api_calls_per_day' &&
          body.increment === 1
      )
      .reply(200, { ok: true });

    const result = await client.trackUsage('mock-key', 'api_calls_per_day', 1);
    expect(result.ok).toBe(true);
  });

  test('trackUsage fails with status 400', async () => {
    nock(baseUrl).post('/track-usage').reply(400, { error: 'Invalid usage' });

    await expect(
      client.trackUsage('mock-key', 'api_calls_per_day', 1)
    ).rejects.toThrow(/trackUsage failed with 400/);
  });

  test('getUsageReport succeeds', async () => {
    nock(baseUrl)
      .post('/usage-report', (body) => body.key === 'mock-key')
      .reply(200, { users: 5 });

    const result = await client.getUsageReport('mock-key');
    expect(result.users).toBe(5);
  });

  test('getUsageReport fails with status 404', async () => {
    nock(baseUrl).post('/usage-report').reply(404, { error: 'Not found' });

    await expect(client.getUsageReport('missing-key')).rejects.toThrow(
      /getUsageReport failed with 404/
    );
  });

  test('revoke succeeds', async () => {
    nock(baseUrl)
      .post('/revoke-license', { key: 'mock-key' })
      .reply(200, { revoked: true });

    const result = await client.revoke('mock-key');
    expect(result.revoked).toBe(true);
  });

  test('revoke fails with status 400', async () => {
    nock(baseUrl).post('/revoke-license').reply(400, { error: 'Invalid' });

    await expect(client.revoke('bad-key')).rejects.toThrow(
      /revoke failed with 400/
    );
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
