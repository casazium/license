// scripts/verify-lic.js
import fs from 'node:fs/promises';
import path from 'node:path';
import { decrypt } from '../src/lib/crypto.js';
import { verifyLicenseSignature } from '../src/lib/license-signature.js';

const LIC_PATH = process.argv[2];
const SECRET = process.env.LICENSE_SIGNING_SECRET;

if (!LIC_PATH || !SECRET) {
  console.error('Usage: node scripts/verify-lic.js <file.lic>');
  console.error('Make sure LICENSE_SIGNING_SECRET is set.');
  process.exit(1);
}

try {
  const absPath = path.resolve(LIC_PATH);
  const encryptedBase64 = await fs.readFile(absPath, 'utf8');
  const decryptedJson = decrypt(encryptedBase64);
  const license = JSON.parse(decryptedJson);

  const valid = verifyLicenseSignature(license, SECRET);
  if (!valid) {
    throw new Error('Invalid license signature');
  }

  console.log('✅ License is valid');
  console.log(JSON.stringify(license, null, 2));
} catch (err) {
  console.error('❌ License verification failed:');
  console.error(err.message);
  process.exit(1);
}
