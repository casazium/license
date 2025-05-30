process.env.ENCRYPTION_KEY =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // valid key
process.env.ENCRYPTION_IV = 'short'; // invalid: not 12 bytes

import('../../lib/crypto.js')
  .then(() => {
    console.error('ENCRYPTION_IV must be 12 bytes');
    process.exit(1);
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
