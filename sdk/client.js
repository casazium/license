// sdk/client.js
import { fetchWithRetry } from './lib/http.js';
import { createVerify } from 'node:crypto';

export class CasaziumLicenseClient {
  constructor({ baseUrl, publicKey, retries = 3 }) {
    this.baseUrl = baseUrl;
    this.publicKey = publicKey;
    this.retries = retries;
  }

  async verifyKey(key) {
    const res = await fetchWithRetry(
      `${this.baseUrl}/verify-license`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      },
      this.retries
    );
    if (!res.ok) throw new Error(`verifyKey failed with ${res.status}`);
    return res.json();
  }

  async trackUsage(key, metric, increment = 1) {
    const res = await fetchWithRetry(
      `${this.baseUrl}/track-usage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, metric, increment }),
      },
      this.retries
    );
    if (!res.ok) throw new Error(`trackUsage failed with ${res.status}`);
    return res.json();
  }

  async getUsageReport(key) {
    const res = await fetchWithRetry(
      `${this.baseUrl}/usage-report`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      },
      this.retries
    );
    if (!res.ok) throw new Error(`getUsageReport failed with ${res.status}`);
    return res.json();
  }

  verifySignedFile({ license, signature }) {
    if (!this.publicKey) throw new Error('publicKey is required');

    const verifier = createVerify('SHA256');
    verifier.update(JSON.stringify(license));
    verifier.end();

    return verifier.verify(this.publicKey, signature, 'base64');
  }
}
