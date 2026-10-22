import 'dotenv/config';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const thingspeakTimeoutMs = Number.parseInt(
  process.env.TS_TIMEOUT_MS ?? '5000',
  10
);
const persistenceEnabled = process.env.PERSIST_READINGS === 'true';
const jwtSecret = process.env.JWT_SECRET ?? '';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

if (!Number.isInteger(thingspeakTimeoutMs) || thingspeakTimeoutMs < 1) {
  throw new Error('TS_TIMEOUT_MS must be a positive integer.');
}

if (persistenceEnabled && !process.env.DATABASE_URL) {
  const databaseFields = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
  ];

  if (databaseFields.some((field) => !process.env[field])) {
    throw new Error(
      'Database persistence requires DATABASE_URL or all DB_* variables.'
    );
  }
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port,
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  thingspeakChannelId: process.env.TS_CHANNEL_ID ?? '',
  thingspeakReadKey: process.env.TS_READ_KEY ?? '',
  thingspeakTimeoutMs,
  persistenceEnabled,
  databaseUrl: process.env.DATABASE_URL ?? '',
  databaseHost: process.env.DB_HOST ?? 'localhost',
  databasePort: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
  databaseName: process.env.DB_NAME ?? 'drinksafe',
  databaseUser: process.env.DB_USER ?? 'postgres',
  databasePassword: process.env.DB_PASSWORD ?? '',
  databaseSsl: process.env.DB_SSL === 'true',
  persistenceDeviceId: process.env.PERSISTENCE_DEVICE_ID ?? '',
  jwtSecret,
  authCookieName: process.env.AUTH_COOKIE_NAME ?? 'drinksafe_token',
  authCookieMaxAgeMs: Number.parseInt(
    process.env.AUTH_COOKIE_MAX_AGE_MS ?? '86400000',
    10
  )
});
