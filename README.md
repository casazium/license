# Casazium License Server

[![Coverage Status](https://coveralls.io/repos/github/casazium/license/badge.svg)](https://coveralls.io/github/casazium/license)

A self-hostable Node.js service for managing encrypted license keys with expiration and support for tiered plans. Designed to be used with other Casazium services like `casazium-auth`, or any commercial software product requiring secure license enforcement.

## Features

- AES-256-GCM encryption for license keys
- License key generation and validation
- Key expiration handling
- Tiered license support (e.g., Free, Pro, Enterprise)
- Fastify-based backend
- Environment-specific config handling
- Designed for extensibility and embedding into other systems

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

### Environment Variables

- `ENCRYPTION_KEY` (required): hex-encoded 32-byte key used for AES-256-GCM
- `PORT` (optional): port Fastify listens on (default `3000`)
