process.env.ENCRYPTION_KEY = 'deadbeef';

import('../../lib/crypto.js')
  .then(() => {
    console.error('Expected failure due to invalid ENCRYPTION_KEY');
    process.exit(1);
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
