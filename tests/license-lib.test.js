import { describe, test, expect } from 'vitest';
import { generateLicense, parseLicense } from '../src/lib/license.js';

// Needed to make encryption deterministic in tests
process.env.ENCRYPTION_KEY =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 hex chars = 32 bytes

describe('license.js', () => {
  test('generateLicense returns encrypted string', () => {
    const encrypted = generateLicense({
      subject: 'test@example.com',
      plan: 'pro',
      expiresAt: new Date('2099-01-01T00:00:00Z'),
      features: { users: 5 },
    });

    expect(typeof encrypted).toBe('string');
    expect(encrypted.length).toBeGreaterThan(10); // Should be non-trivial
  });

  test('parseLicense returns valid license object', () => {
    const original = {
      subject: 'bob@example.com',
      plan: 'free',
      expiresAt: new Date('2030-12-31T23:59:59Z'),
      features: { max_users: 3 },
    };

    const encrypted = generateLicense(original);
    const parsed = parseLicense(encrypted);

    expect(parsed.subject).toBe(original.subject);
    expect(parsed.plan).toBe(original.plan);
    expect(parsed.features).toEqual(original.features);
    expect(typeof parsed.id).toBe('string');
    expect(parsed.issued_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(parsed.expires_at).toBe(original.expiresAt.toISOString());
  });

  test('throws on malformed encrypted input', () => {
    expect(() => {
      parseLicense('not-really-encrypted');
    }).toThrow(/unable to decrypt license string/i); // updated to match wrapped error
  });
});
