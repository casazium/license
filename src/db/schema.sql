-- src/db/schema.sql
CREATE TABLE IF NOT EXISTS license_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  product_id TEXT NOT NULL,             -- identifies the software/product this key is for
  tier TEXT NOT NULL,                   -- e.g., 'free', 'pro', 'enterprise'
  status TEXT NOT NULL DEFAULT 'active',-- e.g., 'active', 'revoked', etc.
  issued_to TEXT NOT NULL,              -- user, org, or customer identifier
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  usage_limit INTEGER,                  -- optional: max activations, requests, etc.
  usage_count INTEGER DEFAULT 0,        -- how much has been used so far
  limits TEXT                           -- optional: JSON-encoded object for custom limits
);
