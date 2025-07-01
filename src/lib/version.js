// src/lib/version.js
import fs from 'node:fs';
import path from 'node:path';

let version = process.env.SERVICE_VERSION;

if (!version) {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve('./package.json'), 'utf-8')
    );
    version = pkg.version || 'unknown';
  } catch {
    version = 'unknown';
  }
}

export const serviceVersion = version;
