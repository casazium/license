import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../lib/crypto.js';

describe('Crypto Module (AES-256-GCM)', () => {
  const plaintext = 'Hello, world!';

  it('should encrypt and decrypt text successfully', () => {
    const encrypted = encrypt(plaintext);
    expect(typeof encrypted).toBe('string');
    expect(encrypted).not.toBe(plaintext);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should throw if ciphertext is corrupted', () => {
    const encrypted = encrypt(plaintext);
    const tampered = encrypted.slice(0, -1) + 'A'; // change the last char

    expect(() => decrypt(tampered)).toThrow();
  });

  it('should produce different ciphertexts for the same plaintext', () => {
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);
    expect(encrypted1).not.toBe(encrypted2); // different IVs mean different ciphertexts
  });
});
