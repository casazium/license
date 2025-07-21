import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
console.log('💡 Starting health.test.js');
import { buildApp } from '../src/app.js';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbFile = path.resolve(__dirname, `test-health-${process.pid}.db`);

describe('GET / (Health Check)', () => {
  let app;

  beforeAll(async () => {
    process.env.DB_FILE = testDbFile;
    app = await buildApp();
    await app.ready();
  });


  afterAll(async () => {
    await app?.close?.();
    try {
      await fs.unlink(testDbFile);
      // console.log(`Deleted test DB: ${filePath}`);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(`Failed to delete test DB: ${err.message}`);
      }
    }
  });

  it('should return 200 and a health message with version', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/',
    });

    expect(res.statusCode).toBe(200);
    const body = await res.json();
    expect(body.message).toBe('License API is running');
    expect(body.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});
