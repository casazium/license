# Casazium License Client

Node.js SDK for verifying and tracking license keys with a Casazium License Server.

## Installation

```bash
npm install casazium-license-client
```

## Usage

```js
import { CasaziumLicenseClient } from 'casazium-license-client';

const client = new CasaziumLicenseClient({
  baseUrl: 'https://your-license-server.com',
  publicKey: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----',
});

const result = await client.verifyKey('your-license-key');
console.log(result);
```

## CLI

```bash
npx casazium-license verify --key YOUR_KEY
npx casazium-license track --key YOUR_KEY --metric api_calls_per_day --increment 1
```

## License

MIT
