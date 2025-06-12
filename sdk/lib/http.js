// sdk/lib/http.js

export async function fetchWithRetry(
  url,
  options = {},
  maxRetries = 3,
  delay = 100
) {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 400 || res.status >= 500) {
        return res;
      }
      // 4xx: do not retry
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const backoff = delay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, backoff));
      attempt++;
    }
  }
}
