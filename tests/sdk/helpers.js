// tests/sdk/helpers.js

import nock from 'nock';

export async function issueTestLicense() {
  const key = 'mock-key';

  nock('http://127.0.0.1:3001').post('/issue-license').reply(200, { key });

  const res = await fetch('http://127.0.0.1:3001/issue-license', {
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

  const data = await res.json();
  return data.key;
}
