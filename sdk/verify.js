// sdk/verify.js
import { createHmac } from 'node:crypto';

export function verifyLicense(license, secret) {
  const { signature, ...payload } = license;
  const payloadString = JSON.stringify(payload);
  const expected = createHmac('sha256', secret)
    .update(payloadString)
    .digest('base64');

  if (signature !== expected) {
    throw new Error('Invalid license signature');
  }

  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    throw new Error('License has expired');
  }

  return true;
}
