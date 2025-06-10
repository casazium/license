// lib/license.js
import { encrypt, decrypt } from './crypto.js';
import { randomUUID } from 'node:crypto';

/**
 * Generate a license object and return the encrypted string.
 * @param {Object} options
 * @param {string} options.subject - License owner (email, user ID, etc)
 * @param {string} options.plan - License plan name
 * @param {Date} options.expiresAt - Expiration date
 * @param {Object} [options.features] - Optional feature flags
 * @returns {string} Encrypted license string
 */
export function generateLicense({ subject, plan, expiresAt, features = {} }) {
  const license = {
    id: randomUUID(),
    subject,
    issued_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    plan,
    features,
  };

  return encrypt(JSON.stringify(license));
}

/**
 * Decrypt and parse a license string.
 * @param {string} encrypted - Encrypted license string
 * @returns {Object} Decrypted license object
 */
export function parseLicense(encrypted) {
  const json = decrypt(encrypted);
  return JSON.parse(json);
}
