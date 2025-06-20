# Casazium License Server

[![Coverage Status](https://coveralls.io/repos/github/casazium/license/badge.svg?branch=main)](https://coveralls.io/github/casazium/license?branch=main)

A self-hostable Node.js service for managing encrypted license keys with expiration and support for tiered plans. Designed to be used with other Casazium services like `casazium-auth`, or any commercial software product requiring secure license enforcement.

## Features

- AES-256-GCM encryption for license keys
- License key generation and validation
- Key expiration and revocation handling
- Tiered license support (e.g., Free, Pro, Enterprise)
- Fastify-based backend with SQLite
- Configurable usage limits and quota tracking
- Activation enforcement to prevent license sharing
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

### 💻 Activation Management

- `POST /activate-license` – track and enforce instance-based activations
  - Limits the number of unique instance activations per license
  - Prevents overuse or sharing of single-use license keys
  - Rejects revoked or expired licenses

### 🔎 License Management

- `POST /list-licenses` – filter and paginate license keys by product, status, etc.
- `GET /export-license/:key` – retrieve signed license payload for offline use

---

## 🧪 Test Coverage

- All features tested with Vitest
- SQLite in-memory or file-based isolation per test run
- 90%+ test coverage, including edge and error paths

---

## 📦 System Requirements

- Node.js v18+
- SQLite 3 (via better-sqlite3)

### Environment Variables

- `ENCRYPTION_KEY` (required): hex-encoded 32-byte key used for AES-256-GCM
- `JWT_SECRET` (required): secret used to sign license exports
- `PORT` (optional): port Fastify listens on (default `3000`)
