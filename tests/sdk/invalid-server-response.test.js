import { describe, it, expect } from 'vitest'
import { CasaziumLicenseClient } from '../../sdk/client.js'

describe('Invalid Server Response', () => {
  it('throws on malformed response', async () => {
    const client = new CasaziumLicenseClient({
      fetch: async () => ({
        ok: true,
        json: async () => ({ key: 'x' }) // missing signature
      })
    })

    await expect(client.exportLicense('key')).rejects.toThrow(/signature/i)
  })
})