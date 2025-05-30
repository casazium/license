process.env.ENCRYPTION_KEY = 'shortkey'; // Too short
delete process.env.ENCRYPTION_IV;

try {
  const { encrypt } = await import('../../lib/crypto.js');
  encrypt('test'); // Force execution and validation
  console.error('❌ Expected error for invalid ENCRYPTION_KEY was not thrown');
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
