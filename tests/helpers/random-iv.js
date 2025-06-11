// tests/helpers/random-iv.js
import { encrypt } from '../../src/lib/crypto.js';

const PLAINTEXT = 'this is a test';

if (process.env.ENCRYPTION_IV) {
  console.error('❌ ENCRYPTION_IV should not be set for this test.');
  process.exit(1);
}

const encrypted1 = encrypt(PLAINTEXT);
const encrypted2 = encrypt(PLAINTEXT);

if (encrypted1 === encrypted2) {
  console.error('❌ Ciphertexts are identical. IV is not random.');
  process.exit(2);
}

console.log('✅ Random IV test passed');
process.exit(0);
