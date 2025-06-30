import { describe, it, expect, vi } from 'vitest'
import { CasaziumLicenseClient } from '../../sdk/client.js'

describe('Retry Logic', () => {
  it('retries on fetch failure', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ key: 'abc', signature: 'valid' })
      })

    const client = new CasaziumLicenseClient({ fetch: mockFetch })
    const result = await client.verifyKey('abc')
    expect(result.key).toBe('abc')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})