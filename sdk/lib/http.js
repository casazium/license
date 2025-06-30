// sdk/lib/http.js

import fetch from 'node-fetch';

// sdk/lib/http.js

export async function fetchWithRetry(
  url,
  options,
  maxRetries = 3,
  fetchFn = globalThis.fetch
) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const res = await fetchFn(url, options);
      if (res.ok || res.status < 500) return res;
    } catch (err) {
      if (attempt === maxRetries) throw err;
    }
    attempt++;
    await new Promise((r) => setTimeout(r, 100 * attempt));
  }
}
