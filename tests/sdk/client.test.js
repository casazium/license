// tests/sdk/client.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { CasaziumLicenseClient } from '../../sdk/client.js';
import { issueTestLicense } from './helpers.js';

const BASE_URL = 'http://127.0.0.1:3001';

describe('CasaziumLicenseClient', () => {
  let client;
  let publicKey;
  let signedLicense;
  let TEST_KEY;

  beforeAll(async () => {
    client = new CasaziumLicenseClient({ baseUrl: BASE_URL });
    publicKey = await fs.readFile(
      path.resolve('test/data/public-key.pem'),
      'utf-8'
    );
    signedLicense = JSON.parse(
      await fs.readFile(path.resolve('test/data/signed-license.json'), 'utf-8')
    );
    TEST_KEY = await issueTestLicense();
  });

  it('verifies a license key', async () => {
    const res = await client.verifyKey(TEST_KEY);
    expect(res.valid).toBe(true);
  });

  it('tracks usage metric', async () => {
    const res = await client.trackUsage(TEST_KEY, 'api_calls_per_day', 1);
    expect(res).toHaveProperty('ok', true);
  });

  it('returns usage report', async () => {
    const res = await client.getUsageReport(TEST_KEY);
    expect(res).toHaveProperty('metrics');
  });

  it('verifies signed license file', () => {
    const verifier = new CasaziumLicenseClient({
      baseUrl: BASE_URL,
      publicKey,
    });
    const result = verifier.verifySignedFile({
      license: signedLicense.license,
      signature: signedLicense.signature,
    });
    expect(result).toBe(true);
  });
});
