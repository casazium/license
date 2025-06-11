# Casazium License v0.2.0

Casazium License v0.2.0 is a major upgrade with complete license lifecycle management and fine-grained usage enforcement. It is now suitable for real-world licensing of software products with tiered plans, per-feature restrictions, and secure offline validation.

---

## ✅ Features

### 🔐 License Lifecycle
- `POST /issue-license` – generate new license keys
- `POST /verify-license` – validate license status
- `POST /verify-license-file` – validate cryptographically signed license files
- `POST /revoke-license` – mark licenses as revoked
- `POST /delete-license` – remove licenses permanently

### 📊 Usage Enforcement
- `POST /track-usage` – increment named usage metrics (e.g., requests, users, activations)
- `POST /usage-report` – return limits, usage, and remaining quota per metric

### 🔎 License Management
- `POST /list-license` – filter and paginate license keys by product, status, etc.

---

## 🧪 Test Coverage
- All features tested with Vitest
- SQLite in-memory or file-based isolation per test run
- 80%+ test coverage, including edge and error paths

---

## 📦 System Requirements
- Node.js v18+
- SQLite 3 (via better-sqlite3)

---

## 🚧 Migration Notes
- Schema includes `limits` and `usage` as JSON fields
- You may need to migrate legacy license data if upgrading from v0.1.x

---

## 🔜 Planned for v0.3.0
- Client SDK (Node.js + browser bundle)
- Admin UI for issuing and managing keys
- Rate-limiting and abuse prevention
- Signed license issuance via API

---

Released under the MIT License. Feedback and contributions welcome!
