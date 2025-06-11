// src/lib/validateLicenseLimits.js

/**
 * Allowed keys for license limits in Casazium License.
 * All limits must be integers >= 0, except `features`, which must be an array of strings.
 */
export const ALLOWED_LIMIT_KEYS = new Set([
  'users',
  'seats',
  'admins',
  'projects',
  'environments',
  'tenants',
  'api_calls_per_day',
  'rate_limit_rps',
  'concurrent_sessions',
  'features',
]);

/**
 * Validate the `limits` object of a license.
 * @param {any} limits - Parsed JSON object to validate.
 * @returns {{ valid: boolean; error?: string }}
 */
export function validateLicenseLimits(limits) {
  if (typeof limits !== 'object' || limits === null || Array.isArray(limits)) {
    return { valid: false, error: 'Limits must be a JSON object' };
  }

  for (const key of Object.keys(limits)) {
    if (!ALLOWED_LIMIT_KEYS.has(key)) {
      return { valid: false, error: `Unknown limit key: ${key}` };
    }

    const value = limits[key];

    if (key === 'features') {
      if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) {
        return { valid: false, error: 'features must be an array of strings' };
      }
    } else {
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        return { valid: false, error: `Invalid value for limit "${key}"` };
      }
    }
  }

  return { valid: true };
}
