// sdk/index.js
import crypto from 'node:crypto';

export class CasaziumLicenseClient {
  /**
   * @param {Object} options
   * @param {string} options.baseUrl - Base URL of the Casazium License server
   * @param {string} [options.apiKey] - Optional API key for authentication
   * @param {string} [options.publicKey] - PEM-encoded public key for verifying license files
   */
  constructor({ baseUrl, apiKey, publicKey } = {}) {
    if (!baseUrl) throw new Error('baseUrl is required');
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.publicKey = publicKey;
  }

  async verifyKey(key) {
    const res = await fetch(`${this.baseUrl}/verify-license`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ key }),
    });
    if (!res.ok) throw new Error(`verifyKey failed with ${res.status}`);
    return res.json();
  }

  async trackUsage(key, metric, increment = 1) {
    const res = await fetch(`${this.baseUrl}/track-usage`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ key, metric, increment }),
    });
    if (!res.ok) throw new Error(`trackUsage failed with ${res.status}`);
    return res.json();
  }

  async getUsageReport(key) {
    const res = await fetch(`${this.baseUrl}/usage-report`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ key }),
    });
    if (!res.ok) throw new Error(`getUsageReport failed with ${res.status}`);
    return res.json();
  }

  verifySignedFile({ license, signature }) {
    if (!this.publicKey)
      throw new Error('Public key not set for verifying license file');

    const verify = crypto.createVerify('SHA256');
    verify.update(JSON.stringify(license));
    verify.end();

    const sigBuffer = Buffer.from(signature, 'base64');
    return verify.verify(this.publicKey, sigBuffer);
  }

  _headers() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
    return headers;
  }
}
