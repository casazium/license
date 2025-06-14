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

  app.addHook('onClose', async () => {
    db.close();
  });

  return app;
}

// The server is started by index.js to avoid double initialization during
// module imports. This file only exports the buildApp function.
