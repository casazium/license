/**
 * Encryption Module (AES-256-GCM)
 *
 * - Uses random IV by default (secure)
 * - Supports fixed IV via ENCRYPTION_IV (for testing only — NEVER use in production)
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex'); // 32-byte key
const STATIC_IV = null;

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error(
    'ENCRYPTION_KEY must be 32 bytes (256 bits) in hexadecimal format'
  );
}

if (STATIC_IV && STATIC_IV.length !== 12) {
  throw new Error(
    `ENCRYPTION_IV must be 12 bytes (96 bits) in hexadecimal format: ${STATIC_IV.toString(
      'hex'
    )}`
  );
}

// 🔍 Log IV mode
console.log(
  STATIC_IV
    ? '⚠️ Using static IV from ENCRYPTION_IV (testing mode only)'
    : '🔐 Using random IVs for AES-256-GCM encryption (production-safe)'
);

export function encrypt(text) {
  const iv = STATIC_IV || randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const output = STATIC_IV
    ? Buffer.concat([tag, encrypted])
    : Buffer.concat([iv, tag, encrypted]);

  return output.toString('base64');
}

export function decrypt(encryptedBase64) {
  const data = Buffer.from(encryptedBase64, 'base64');

  let iv, tag, encrypted;

  if (STATIC_IV) {
    iv = STATIC_IV;
    tag = data.subarray(0, 16);
    encrypted = data.subarray(16);
  } else {
    iv = data.subarray(0, 12);
    tag = data.subarray(12, 28);
    encrypted = data.subarray(28);
  }

  const decipher = createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
