import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () => {
  console.log(`DrinkSafe backend listening on http://localhost:${env.port}`);
});

const shutdown = (signal) => {
  console.log(`${signal} received. Shutting down.`);

  server.close((error) => {
    if (error) {
      console.error('Failed to close the HTTP server cleanly.', error);
      process.exitCode = 1;
    }

    process.exit();
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
