// src/app.js
import Fastify from 'fastify';
import cors from '@fastify/cors';
import config from '../lib/config.js'; // ✅ make sure this path is correct

console.log('ENV FILE:', process.env.ENCRYPTION_KEY);
console.log('NODE_ENV:', process.env.NODE_ENV);

export async function buildApp() {
  const app = Fastify({ logger: config.NODE_ENV !== 'test' });

  // Register plugins
  await app.register(cors);

  // Health check
  app.get('/', async () => {
    return { message: 'License API is running' };
  });

  // Add routes here as you implement them
  // e.g., app.register(licenseRoutes);

  return app;
}
