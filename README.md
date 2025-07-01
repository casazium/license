# Casazium License Server

![Coverage](https://coveralls.io/repos/github/casazium/license/badge.svg?branch=main&nocache=1)

A lightweight, secure, and self-hostable license management API built with Fastify, SQLite, and Node.js.

Supports license key issuance, verification, tracking, expiration, and exporting signed + encrypted license files (.lic). Ideal for indie software developers and teams needing a simple but secure license backend.

---

## 🚀 Features

- ✅ Issue, revoke, list, and delete license keys
- 🔑 Signature-based verification using HMAC
- 🔐 Optional encryption of license files with AES-256-GCM
- 📁 Export license files as base64-encoded `.lic` files
- 🧪 Usage tracking and reporting
- 📦 Docker-ready and Coolify-compatible
- 🧰 Includes Node.js SDK with retry logic

---

## 📦 Quickstart (Docker)

```bash
git clone https://github.com/casazium/license.git
cd license

# Generate production .env file and data folder
node scripts/generate-env-production.js

# Build the image and run the service
docker compose up --build
```

The server will be available at [http://localhost:3001](http://localhost:3001)

---

## 🗝️ Issue a License

```bash
curl -X POST http://localhost:3001/issue-license \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "pro",
    "product_id": "my-software",
    "issued_to": "test@example.com",
    "expires_at": "2026-01-01T00:00:00Z",
    "limits": { "users": 10 }
  }'
```

---

## 🔎 Verify License Key

```bash
curl -X POST http://localhost:3001/verify-license \
  -H "Content-Type: application/json" \
  -d '{ "key": "your-license-key" }'
```

---

## 📤 Export Encrypted License File

```bash
curl http://localhost:3001/export-license/your-license-key/file
```

Response is base64-encoded `.lic` file.

---

## ✅ Verify Encrypted License File

```bash
curl -X POST http://localhost:3001/verify-license-file-base64 \
  -H "Content-Type: application/json" \
  -d '{ "license_file": "...base64..." }'
```

---

## 🔧 Environment Variables

Set these in `.env.production` or `.env`:

```ini
ENCRYPTION_KEY=...     # hex-encoded 32-byte key
LICENSE_SIGNING_SECRET=... # secret used to sign licenses
ADMIN_API_KEY=...      # required to issue/delete licenses
DATABASE_FILE=./data/prod.db
NODE_ENV=production
PORT=3001
```

Generate `.env.production` easily with:

```bash
node scripts/generate-env-production.js
```

---

## 📦 SDK Usage

```js
import { CasaziumLicenseClient } from './sdk/client.js';

const client = new CasaziumLicenseClient({
  baseUrl: 'http://localhost:3001',
  publicKey, // optional: for offline validation
});

await client.verifyKey('your-license-key');
await client.trackUsage('your-license-key', 'users', 1);
```

---

## 🧪 Test Suite

```bash
npm install
npm run test
npm run coverage
```

---

## 🔐 Security Model

- All licenses are **signed** with `LICENSE_SIGNING_SECRET`
- Exported `.lic` files are **encrypted** with `ENCRYPTION_KEY`
- Admin endpoints require `ADMIN_API_KEY`

---

## 🐳 Deployment

Deploy locally with Docker Compose or to [Coolify](https://coolify.io).

> Sample Dockerfile and Docker Compose setup included

---

## 📄 License

MIT © 2025 Casazium

---

Want help deploying or customizing? Open an issue or contact the author.
