// sdk/client.js
import { fetchWithRetry } from './lib/http.js';
import { createVerify } from 'node:crypto';

export class CasaziumLicenseClient {
  constructor({
    baseUrl,
    publicKey,
    adminToken,
    retries = 3,
    fetch = globalThis.fetch,
  }) {
    this.baseUrl = baseUrl;
    this.publicKey = publicKey;
    this.adminToken = adminToken;
    this.retries = retries;
    this.fetch = fetch;
  }

  async verifyKey(key) {
    const res = await fetchWithRetry(
      `${this.baseUrl}/verify-license`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      },
      this.retries,
      this.fetch
    );

    if (!res.ok) {
      // res.status is still available here
      throw new Error(`verifyKey failed with ${res.status}`);
    }

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
      this.retries,
      this.fetch
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
      this.retries,
      this.fetch
    );
    if (!res.ok) throw new Error(`getUsageReport failed with ${res.status}`);
    return res.json();
  }

  async listLicenses({ product_id, status, page = 1, limit = 20 } = {}) {
    const url = new URL('/list-licenses', this.baseUrl);
    if (product_id) url.searchParams.set('product_id', product_id);
    if (status) url.searchParams.set('status', status);
    url.searchParams.set('page', page);
    url.searchParams.set('limit', limit);

    const headers = this.adminToken
      ? { Authorization: `Bearer ${this.adminToken}` }
      : {};

    const res = await fetchWithRetry(
      url.toString(),
      { headers },
      this.retries,
      this.fetch
    );
    if (!res.ok) throw new Error(`listLicenses failed with ${res.status}`);
    return res.json();
  }

  async activate(key, instanceId) {
    const res = await fetchWithRetry(
      `${this.baseUrl}/activate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, instance_id: instanceId }),
      },
      this.retries,
      this.fetch
    );
    if (!res.ok) {
      let message = `activate failed with ${res.status}`;
      try {
        const body = await res.json();
        if (body?.error) message += `: ${body.error}`;
      } catch (_) {}
      throw new Error(message);
    }
    return res.json();
  }

  async revoke(key) {
    const res = await fetchWithRetry(
      `${this.baseUrl}/revoke-license`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      },
      this.retries,
      this.fetch
    );
    if (!res.ok) throw new Error(`revoke failed with ${res.status}`);
    return res.json();
  }

  async exportLicense(key) {
    const res = await fetchWithRetry(
      `${this.baseUrl}/export-license/${encodeURIComponent(key)}`,
      { method: 'GET' },
      this.retries,
      this.fetch
    );
    if (!res.ok) throw new Error(`exportLicense failed with ${res.status}`);

    const data = await res.json();
    if (!data.signature) {
      throw new Error('Invalid license: missing signature');
    }

    return data;
  }

  verifySignedFile({ license, signature }) {
    if (!this.publicKey) throw new Error('publicKey is required');

    const verifier = createVerify('SHA256');
    verifier.update(JSON.stringify(license));
    verifier.end();

    return verifier.verify(this.publicKey, signature, 'base64');
  }
}
