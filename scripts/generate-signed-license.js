// scripts/generate-signed-license.js
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

const license = {
  key: 'your-test-license-key',
  tier: 'pro',
  issued_to: 'test@example.com',
  expires_at: '2026-01-01T00:00:00Z',
};

const privateKeyPath = 'test/data/private-key.pem';
const outputPath = 'test/data/signed-license.json';

try {
  const privateKey = await fs.readFile(privateKeyPath, 'utf-8');

  const sign = crypto.createSign('SHA256');
  sign.update(JSON.stringify(license));
  sign.end();

  const signature = sign.sign(privateKey).toString('base64');

  await fs.writeFile(
    outputPath,
    JSON.stringify({ license, signature }, null, 2)
  );
  console.log('✅ signed-license.json created.');
} catch (err) {
  console.error('❌ Failed to create signed license:', err);
  process.exit(1);
}
