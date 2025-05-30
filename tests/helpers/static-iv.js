process.env.ENCRYPTION_KEY =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.ENCRYPTION_IV = '000102030405060708090a0b'; // 12 bytes hex

import('../../lib/crypto.js')
  .then(({ encrypt }) => {
    const encrypted1 = encrypt('static test');
    const encrypted2 = encrypt('static test');

    if (encrypted1 === encrypted2) {
      console.log('Static IV test passed');
      process.exit(0);
    } else {
      console.error('Static IV test failed');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('Unexpected error:', err.message);
    process.exit(1);
  });
