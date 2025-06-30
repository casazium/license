// scripts/check-docker-context.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Files we expect to be present
const expectedFiles = [
  'dist/index.obfuscated.js',
  'dist/index.obfuscated.js.map',
  'package.production.json',
];

// Report missing
const missing = expectedFiles.filter(
  (file) => !fs.existsSync(path.join(root, file))
);

if (missing.length > 0) {
  console.log('❌ Missing expected files:');
  missing.forEach((f) => console.log(`   - ${f}`));
  process.exit(1);
} else {
  console.log('✅ All expected files are present.');
  process.exit(0);
}
