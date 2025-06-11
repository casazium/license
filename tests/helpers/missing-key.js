// tests/helpers/missing-key.js
import { getKey } from '../../src/lib/crypto.js';

// Ensure ENCRYPTION_KEY is not set
delete process.env.ENCRYPTION_KEY;

try {
  // Explicitly call getKey to trigger validation
  getKey();

  console.error('Expected error for missing ENCRYPTION_KEY was not thrown');
  process.exit(1);
} catch (err) {
  if (/ENCRYPTION_KEY must be 32 bytes/.test(err.message)) {
    console.log('Caught expected ENCRYPTION_KEY error');
    process.exit(0);
  } else {
    console.error('❌ Unexpected error:', err.message);
    process.exit(2);
  }
}
