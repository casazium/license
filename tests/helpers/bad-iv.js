// tests/helpers/bad-iv.js
process.env.ENCRYPTION_KEY = 'a'.repeat(64); // Valid 32-byte key in hex
process.env.ENCRYPTION_IV = 'deadbeef'; // Invalid IV (too short)

try {
  const { encrypt } = await import('../../lib/crypto.js');
  encrypt('this will trigger IV validation');

  console.error('❌ Expected error for invalid ENCRYPTION_IV was not thrown');
  process.exit(1);
} catch (err) {
  if (/ENCRYPTION_IV must be 12 bytes/.test(err.message)) {
    console.log('✅ Caught expected ENCRYPTION_IV error');
    process.exit(0);
  } else {
    console.error('❌ Unexpected error:', err.message);
    process.exit(2);
  }
}
