-- src/db/schema.sql
CREATE TABLE IF NOT EXISTS license_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  tier TEXT,
  expires_at DATETIME,
  issued_to TEXT
);

