import { describe, it, expect } from 'vitest';
const baseUrl = 'http://127.0.0.1:3001/v1';

import { CasaziumLicenseClient } from '../../sdk/client.js';

describe('Activation Limit', () => {
  it('throws when max activations exceeded', async () => {
    const client = new CasaziumLicenseClient({
      baseUrl: 'https://fake.test',
      fetch: async (url, options) => {
        const body = JSON.parse(options.body);
        if (body.instance_id === 'A' || body.instance_id === 'B') {
          return { ok: true, json: async () => ({ success: true }) };
        } else {
          return {
            ok: false,
            status: 403,
            json: async () => ({ error: 'too many activations' }),
          };
        }
      },
    });

    await client.activate('key', 'A');
    await client.activate('key', 'B');

    await expect(client.activate('key', 'C')).rejects.toThrow(
      /too many activations/
    );
  });
});