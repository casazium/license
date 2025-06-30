// esbuild.config.mjs
import { build } from 'esbuild';

build({
  entryPoints: ['src/app.js'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/index.js',
  sourcemap: true,
  external: [
    'fastify',
    '@fastify/cors',
    'better-sqlite3',
    'dotenv',
    'node:fs',
    'node:fs/promises',
    'node:path',
    'node:url',
    'node:crypto',
    'node:events',
    'avvio',
  ],
}).catch(() => process.exit(1));
