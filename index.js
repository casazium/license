// index.js
import { buildApp } from './src/app.js';
import config from './src/lib/config.js';

const start = async () => {
  try {
    const app = await buildApp();
    await app.listen({ port: config.PORT, host: '127.0.0.1' });

    console.log(`🚀 Server listening on http://127.0.0.1:${config.PORT}`);
  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
};

start();
