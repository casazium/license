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

      // Don't consume body — just return response (client will handle .json() or .text())
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return res;
      }

      // Retry on 5xx errors
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const backoff = delay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, backoff));
      attempt++;
    }
  }
}
