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
    const script = path.join('tests', 'helpers', 'bad-key.js');
    const result = await execa('node', [script], { reject: false });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toMatch(/ENCRYPTION_KEY must be 32 bytes/);
  });

  it('should throw if ENCRYPTION_IV is defined but invalid', async () => {
    const script = path.join('tests', 'helpers', 'bad-iv.js');
    const result = await execa('node', [script], { reject: false });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toMatch(/ENCRYPTION_IV must be 12 bytes/);
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
});
