// src/app.js
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import config from '../src/lib/config.js'; // ✅ make sure this path is correct
import issueLicenseRoute from './routes/issue-license.js';
import verifyLicenseRoute from './routes/verify-license.js';

//console.log('ENV FILE:', process.env.ENCRYPTION_KEY);
//console.log('NODE_ENV:', process.env.NODE_ENV);

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

  // Add routes here as you implement them
  // e.g., app.register(licenseRoutes);
  await issueLicenseRoute(app);
  await verifyLicenseRoute(app);

  return app;
}
