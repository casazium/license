// index.js
import { buildApp } from './src/app.js';
import config from './lib/config.js';

const start = async () => {
  try {
    const app = await buildApp();
    await app.listen({ port: config.PORT, host: '0.0.0.0' });

    console.log(`🚀 Server listening on http://localhost:${config.PORT}`);
  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
};

start();
