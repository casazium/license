import nock from 'nock';

/**
 * Issues a test license via HTTP and mocks the server response using nock.
 *
 * @param {Object} options
 * @param {string} options.baseUrl - Base API URL including version prefix (e.g. 'http://localhost:3001/v1')
 * @returns {Promise<string>} The issued license key
 */
export async function issueTestLicense({
  baseUrl = 'http://127.0.0.1:3001/v1/v1',
} = {}) {
  const key = 'mock-key';
  const url = new URL('/issue-license', baseUrl);

  // Set up mock server response for this URL
  nock(url.origin).post(url.pathname).reply(200, { key });

  const res = await fetch(url.href, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: 'casazium-auth',
      tier: 'pro',
      issued_to: 'sdk-test@example.com',
      expires_at: '2026-01-01T00:00:00Z',
      limits: { api_calls_per_day: 1000 },
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Failed to issue test license: ${msg}`);
  }

  const { key: returnedKey } = await res.json();
  return returnedKey;
}
