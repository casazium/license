// lib/crypto.js
import crypto from 'node:crypto';

const ALGO = 'aes-256-gcm';

// Validate and load the encryption key
const KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  : null;

if (!KEY || KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 bytes');
}

const encrypt = (plaintext) => {
  let iv;

  if (process.env.ENCRYPTION_IV) {
    iv = Buffer.from(process.env.ENCRYPTION_IV, 'hex');
    if (iv.length !== 12) {
      throw new Error('ENCRYPTION_IV must be 12 bytes');
    }
  } else {
    iv = crypto.randomBytes(12);
  }

  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Format: IV (12 bytes) + AuthTag (16 bytes) + Ciphertext
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
};

const decrypt = (encryptedBase64) => {
  const data = Buffer.from(encryptedBase64, 'base64');
  const iv = data.slice(0, 12);
  const authTag = data.slice(12, 28);
  const encrypted = data.slice(28);

  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted, null, 'utf8') + decipher.final('utf8');
};

export { encrypt, decrypt };
