// src/lib/license-signature.js

import crypto from 'node:crypto';

/**
 * Create a signature for a license payload
 * @param {object} license - License object (excluding `sig`)
 * @param {string} secret - Signing secret
 * @returns {string} HMAC SHA-256 hex signature
 */
export function signLicense(license, secret) {
  const unsigned = { ...license };
  delete unsigned.sig;
  const json = JSON.stringify(unsigned);
  return crypto.createHmac('sha256', secret).update(json).digest('hex');
}

/**
 * Verify a license object’s signature
 * @param {object} licenseWithSig - License object including `sig`
 * @param {string} secret - Signing secret
 * @returns {boolean} true if signature is valid
 */
export function verifyLicenseSignature(licenseWithSig, secret) {
  try {
    const { sig, ...rest } = licenseWithSig;
    const expectedSig = signLicense(rest, secret);
    return crypto.timingSafeEqual(
      Buffer.from(sig, 'hex'),
      Buffer.from(expectedSig, 'hex')
    );
  } catch {
    return false;
  }
}
