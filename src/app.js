// src/app.js
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import config from '../src/lib/config.js';
import issueLicenseRoute from './routes/issue-license.js';
import verifyLicenseRoute from './routes/verify-license.js';
import exportLicenseRoute from './routes/export-license.js';
import verifyLicenseFileRoute from './routes/verify-license-file.js';
import revokeLicenseRoute from './routes/revoke-license.js';
import listLicensesRoute from './routes/list-licenses.js';
import deleteLicenseRoute from './routes/delete-license.js';
import trackUsageRoute from './routes/track-usage.js';
import usageReportRoute from './routes/usage-report.js';
import activateLicenseRoute from './routes/activate-license.js';

import dotenv from 'dotenv';
dotenv.config();

export async function buildApp() {
  const app = Fastify({ logger: config.NODE_ENV !== 'test' });

  // Register plugins
  await app.register(cors);

  const db = new Database(process.env.DATABASE_FILE || './dev.db');
  db.pragma('foreign_keys = ON');

  const schemaPath = path.resolve('./src/db/schema.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf-8');
  db.exec(schemaSql);

  app.decorate('sqlite', db);

  // Health check
  app.get('/', async () => {
    return { message: 'License API is running' };
  });

  // Routes
  await issueLicenseRoute(app);
  await verifyLicenseRoute(app);
  await exportLicenseRoute(app);
  await verifyLicenseFileRoute(app);
  await revokeLicenseRoute(app);
  await listLicensesRoute(app);
  await deleteLicenseRoute(app);
  await trackUsageRoute(app);
  await usageReportRoute(app);
  await activateLicenseRoute(app);

  app.addHook('onClose', async () => {
    db.close();
  });

  return app;
}

// ✅ Start the server if not in test mode, or if in CI (GitHub Actions)
if (process.env.NODE_ENV !== 'test' || process.env.CI === 'true') {
  const PORT = process.env.PORT || 3001;
  const start = async () => {
    const app = await buildApp();
    try {
      await app.listen({ port: PORT, host: '0.0.0.0' });
      app.log.info(`License API listening on port ${PORT}`);
    } catch (err) {
      app.log.error(err);
      // ❗ Prevent process.exit in CI so tests can continue/fail gracefully
      if (process.env.CI !== 'true') {
        process.exit(1);
      }
    }
  };
  start();
}
