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
import verifyLicenseFileBase64Route from './routes/verify-license-file-base64.js';
import { serviceVersion } from './lib/version.js';

import dotenv from 'dotenv';
import exportLicenseFileRoute from './routes/export-license-file.js';
import listActivationsRoute from './routes/list-activations.js';
import validateLicenseRoute from './routes/validate-license.js';
import adminStatsRoute from './routes/admin-status.js';
import recentActivationsRoute from './routes/recent-activations.js';

dotenv.config();

export async function buildApp() {
  const app = Fastify({ logger: config.NODE_ENV !== 'test' });

  // Register plugins
  await app.register(cors, {
    origin: true, // or use 'http://localhost:5173' for stricter security
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  console.log(process.env.DB_FILE);
  const db = new Database(process.env.DB_FILE || './dev.db');
  db.pragma('foreign_keys = ON');

  // ✅ Compatible path resolution for CommonJS or esbuild output
  const schemaPath = path.resolve('src/db/schema.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf-8');
  db.exec(schemaSql);

  app.decorate('sqlite', db);

  // Health check
  app.get('/', async () => {
    return {
      message: 'License API is running',
      version: serviceVersion,
    };
  });

  // Routes
  await app.register(
    async function (fastify) {
      await issueLicenseRoute(fastify);
      await verifyLicenseRoute(fastify);
      await exportLicenseFileRoute(fastify);
      await exportLicenseRoute(fastify);
      await verifyLicenseFileRoute(fastify);
      await revokeLicenseRoute(fastify);
      await listLicensesRoute(fastify);
      await deleteLicenseRoute(fastify);
      await trackUsageRoute(fastify);
      await usageReportRoute(fastify);
      await activateLicenseRoute(fastify);
      await verifyLicenseFileBase64Route(fastify);
      await listActivationsRoute(fastify);
      await validateLicenseRoute(fastify);
      await adminStatsRoute(fastify);
      await recentActivationsRoute(fastify);
    },
    { prefix: '/v1' },
  );

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
