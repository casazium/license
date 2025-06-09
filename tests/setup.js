// tests/setup.js
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';

// Set a unique DB path for each test run
process.env.DB_FILE = `./test.${process.pid}.db`;
// Provide a default encryption key for tests that don't specify one
process.env.ENCRYPTION_KEY =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

let app;

beforeAll(async () => {
  // Apply schema if present
  const schemaPath = path.resolve('./src/db/schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    const db = new sqlite3.Database(process.env.DB_FILE);
    await new Promise((res, rej) => {
      db.exec(schema, (err) => {
        db.close();
        err ? rej(err) : res();
      });
    });
  }

  // Build Fastify app
  app = await buildApp();
  await app.ready();

  globalThis.__APP__ = app;
});

afterAll(async () => {
  if (app) await app.close();
  try {
    fs.unlinkSync(process.env.DB_FILE);
  } catch {}
  delete process.env.ENCRYPTION_KEY;
});
