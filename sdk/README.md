# @casazium/license-sdk

A lightweight JavaScript SDK for interacting with the [Casazium License Server](https://github.com/rcasazza/casazium-license).  
Supports online activation, key verification, license file validation, and optional offline enforcement via system fingerprinting.

---

## ✨ Features

- 🔐 Activate licenses on a specific server or device
- ✅ Verify license keys and encrypted license files
- 🖥️ Lock licenses to system fingerprints (`machineId`)
- 📁 Offline license file validation with HMAC signatures
- 🧪 Fully tested and production-ready

---

## 📦 Installation

```bash
npm install @casazium/license-sdk
```

---

## 🚀 Usage

### 1. Instantiate the Client

```js
import { CasaziumLicenseClient } from '@casazium/license-sdk';

const client = new CasaziumLicenseClient({
  baseUrl: 'https://your-license-server.com/v1',
});
```

---

### 2. Activate a License

```js
import { getFingerprint } from '@casazium/license-sdk/fingerprint.js';

const key = 'your-license-key';
const instance_id = getFingerprint();

await client.activate(key, instance_id);
```

---

### 3. Verify a License Key

```js
const result = await client.verifyKey('your-license-key');

if (result.valid) {
  console.log('License is valid!');
}
```

---

### 4. Verify a Signed License File

```js
import fs from 'node:fs/promises';

const license = JSON.parse(await fs.readFile('license.lic.json', 'utf8'));
const signature = license.sig;

const isValid = client.verifySignedFile({ license, signature });

if (isValid) {
  console.log('Signed license file is valid');
}
```

---

## 🧠 Fingerprinting (for License Locking)

```js
import { getFingerprint } from '@casazium/license-sdk/fingerprint.js';

const fingerprint = getFingerprint(); // consistent per machine
```

> Uses `node-machine-id` to generate a unique machine identifier.  
> Safe for Linux, macOS, Windows, containers, and most VMs.

---

## 📁 Offline Usage Idea

You can store the following on disk:

```json
{
  "license": { ... },
  "signature": "..."
}
```

Then verify it at runtime with:

```js
import { CasaziumLicenseClient } from '@casazium/license-sdk';

const client = new CasaziumLicenseClient({ publicKey }); // Required

client.verifySignedFile({ license, signature }); // true or false
```

---

## 🧪 Run Tests

```bash
npm install
npm test
```

---

## 🛠 CLI (Optional)

If using the included CLI:

```bash
npx casazium-license verify --file ./license.lic.json
```

---

## 📄 License

MIT © 2025 [Bob Casazza](https://github.com/rcasazza)
