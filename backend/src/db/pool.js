import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

const poolConfig = env.databaseUrl
  ? {
      connectionString: env.databaseUrl,
      ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined
    }
  : {
      host: env.databaseHost,
      port: env.databasePort,
      database: env.databaseName,
      user: env.databaseUser,
      password: env.databasePassword,
      ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined
    };

export const pool = new Pool(poolConfig);

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error.', error);
});
