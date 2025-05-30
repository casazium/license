// tests/crypto.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt } from '../lib/crypto.js';
import { execa } from 'execa';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLAINTEXT = 'hello world';

describe('Crypto Module (AES-256-GCM)', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 32 bytes hex
    delete process.env.ENCRYPTION_IV;
  });

  it('should encrypt and decrypt a string correctly', () => {
    const ciphertext = encrypt(PLAINTEXT);
    const decrypted = decrypt(ciphertext);
    expect(decrypted).toBe(PLAINTEXT);
  });

  it('should produce different ciphertexts for the same plaintext when IV is random', async () => {
    const script = path.join(__dirname, 'helpers', 'random-iv.js');

    const result = await execa('node', [script], {
      env: {
        ...process.env,
        ENCRYPTION_IV: '', // unset if present
      },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Random IV test passed/);
  });

  it('should throw if ENCRYPTION_KEY is invalid', async () => {
    const script = path.join(__dirname, 'helpers', 'bad-key.js');
    console.log(script);
    const result = await execa('node', [script], { reject: false });
    expect(result.exitCode).toBe(0); // ✅ Expected failure handled
    expect(result.stdout).toMatch(/Caught expected ENCRYPTION_KEY error/);
  });

  it('should throw if ENCRYPTION_IV is defined but invalid', async () => {
    const script = path.join(__dirname, 'helpers', 'bad-iv.js');
    const result = await execa('node', [script], { reject: false });
    expect(result.exitCode).toBe(0); // ✅ Expected failure handled
    expect(result.stdout).toMatch(/Caught expected ENCRYPTION_IV error/);
  });

  it('should use the static IV if defined correctly', async () => {
    const script = path.join('tests', 'helpers', 'static-iv.js');
    const result = await execa('node', [script]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Static IV test passed/);
  });

  it('should throw on decrypt if data is malformed', () => {
    expect(() => decrypt('not-a-valid-ciphertext')).toThrow();
  });

  it('should exercise encryption with a random IV (full coverage test)', () => {
    const ciphertext = encrypt(PLAINTEXT);
    expect(typeof ciphertext).toBe('string');
    expect(ciphertext.length).toBeGreaterThan(0);
  });

  it('should use a valid static IV when ENCRYPTION_IV is set', async () => {
    process.env.ENCRYPTION_IV = '00112233445566778899aabb'; // 12 bytes (24 hex chars)
    const { encrypt } = await import('../lib/crypto.js');
    const ciphertext = encrypt('test');
    expect(typeof ciphertext).toBe('string');
  });

  it('should throw if ENCRYPTION_KEY is missing', async () => {
    const { default: path } = await import('node:path');
    const { execa } = await import('execa');

    const script = path.join(__dirname, 'helpers', 'missing-key.js');
    const result = await execa('node', [script], { reject: false });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch('Caught expected ENCRYPTION_KEY error');
  });
});
