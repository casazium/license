// lib/crypto.js
import crypto from 'node:crypto';

const ALGO = 'aes-256-gcm';

function getKey() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) throw new Error('ENCRYPTION_KEY must be 32 bytes');
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes');
  return key;
}

function getIV() {
  const hex = process.env.ENCRYPTION_IV;
  if (!hex) return null;
  const iv = Buffer.from(hex, 'hex');
  if (iv.length !== 12) throw new Error('ENCRYPTION_IV must be 12 bytes');
  return iv;
}

const encrypt = (plaintext) => {
  const key = getKey();
  const iv = getIV() ?? crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
};

const decrypt = (encryptedBase64) => {
  try {
    const key = getKey();
    const data = Buffer.from(encryptedBase64, 'base64');
    const iv = data.slice(0, 12);
    const authTag = data.slice(12, 28);
    const encrypted = data.slice(28);

    const decipher = crypto.createDecipheriv(ALGO, key, iv, {
      authTagLength: 16, // bytes (128 bits)
    });
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted, null, 'utf8') + decipher.final('utf8');
  } catch (err) {
    throw new Error('Unable to decrypt license string');
  }
};

export { encrypt, decrypt, getKey, getIV };
