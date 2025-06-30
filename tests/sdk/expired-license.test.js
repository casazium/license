import { describe, it, expect } from 'vitest'
import { verifyLicense } from '../../sdk/verify.js'
import { createHmac } from 'node:crypto'

describe('Expired License', () => {
  it('fails if license is expired', () => {
    const secret = 'test-secret'
    const license = {
      key: 'test',
      tier: 'pro',
      expires_at: new Date(Date.now() - 1000).toISOString()
    }

    const signature = createHmac('sha256', secret)
      .update(JSON.stringify(license))
      .digest('base64')

    const signedLicense = { ...license, signature }

    expect(() => verifyLicense(signedLicense, secret)).toThrow(/expired/i)
  })
})