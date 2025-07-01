import { describe, it, expect } from 'vitest';
const baseUrl = 'http://127.0.0.1:3001/v1';

import { CasaziumLicenseClient } from '../../sdk/client.js';

describe('Invalid Server Response', () => {
  it('throws on malformed response', async () => {
    const client = new CasaziumLicenseClient({
      baseUrl: 'http://127.0.0.1:3001/v1',
      fetch: async () => ({
        ok: true,
        json: async () => ({ key: 'x' }), // missing signature
      }),
    });

    await expect(client.exportLicense('key')).rejects.toThrow(
      /missing.*signature/i
    );
  });
});