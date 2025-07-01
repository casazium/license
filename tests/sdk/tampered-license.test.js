import { describe, it, expect } from 'vitest';
import { verifyLicense } from '../../sdk/verify.js';

describe('Tampered License', () => {
  it('fails verification on bad signature', () => {
    const license = {
      key: 'test',
      tier: 'basic',
      expires_at: null,
      signature: 'bad-signature',
    };

    expect(() => verifyLicense(license, 'correct-secret')).toThrow(
      /Invalid license signature/
    );
  });
});