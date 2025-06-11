-- src/db/schema.sql

CREATE TABLE IF NOT EXISTS license_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  product_id TEXT NOT NULL,
  tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  issued_to TEXT NOT NULL,
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  limits JSON DEFAULT '{}',
  usage JSON DEFAULT '{}',
  revoked_at DATETIME
);
