// lib/config.js
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from .env, .env.test, etc.
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config(); // fallback to default behavior
}

function requireEnv(key) {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  ENCRYPTION_KEY: requireEnv('ENCRYPTION_KEY'),
};

export default config;
