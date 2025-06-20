# Casazium License SDK

The Casazium License SDK provides a lightweight, fully tested JavaScript client for integrating with the [Casazium License](../README.md) server. It supports verifying license keys, tracking usage, reporting metrics, managing activations, and verifying signed license files.

---

## 📦 Installation

```bash
npm install casazium-license-sdk
```

> If you're using this from within this repo, import directly from `./client.js`.

---

## 🚀 Quick Start

```js
import { CasaziumLicenseClient } from './client.js';

const client = new CasaziumLicenseClient({
  baseUrl: 'http://localhost:3001',
  publicKey: fs.readFileSync('public.pem', 'utf8'), // Optional, for signature checks
});
```

---

## 🔧 API Methods

### `verifyKey(key: string)`

Verifies a license key with the server.

```js
const result = await client.verifyKey('abc123');
// → { valid: true, tier: 'pro', ... }
```

---

### `trackUsage(key: string, metric: string, increment = 1)`

Increments a usage counter (e.g., API calls, seats, features).

```js
await client.trackUsage('abc123', 'api_calls_per_day', 1);
```

---

### `getUsageReport(key: string)`

Fetches a usage summary for the given license.

```js
const report = await client.getUsageReport('abc123');
```

---

### `activate(key: string, instanceId: string)`

Registers a device or host with the license key.

```js
await client.activate('abc123', 'host-001');
```

---

### `revoke(key: string)`

Revokes a license key.

```js
await client.revoke('abc123');
```

---

### `listLicenses(filters: object = {})`

Fetches all licenses available to an admin token.

```js
const licenses = await client.listLicenses({
  product_id: 'casazium-auth',
  status: 'active',
});
```

> Requires `adminToken` to be passed in the client constructor.

---

### `verifySignedFile({ license, signature, publicKey })`

Verifies a signed license JSON object using a public key.

```js
const valid = client.verifySignedFile({
  license,
  signature,
  publicKey: fs.readFileSync('public.pem', 'utf8'),
});
```

---

## 🛠️ CLI (Optional)

The CLI in `sdk/cli.js` provides access to all the client features:

```bash
node sdk/cli.js verify --key abc123
node sdk/cli.js track --key abc123 --metric api_calls_per_day --increment 1
node sdk/cli.js report --key abc123
node sdk/cli.js activate --key abc123 --instance-id host1
node sdk/cli.js revoke --key abc123
node sdk/cli.js list --admin-token YOUR_TOKEN
node sdk/cli.js sign --license ./license.json --private-key ./private.pem
node sdk/cli.js verify-file --license ./license.json --signature ABC --public-key ./public.pem
```

---

## ✅ Tests

All SDK features are covered by `client.test.js` using [Vitest](https://vitest.dev). To run tests:

```bash
npm test
```

---

## 🔐 Requirements

- Node.js v18+
- Casazium License server running and accessible at `baseUrl`
- Optional: public/private key pair for signing and verifying license files

---

## 📄 License

MIT License
