import express from 'express';
import healthRouter from './routes/health.routes.js';
import alertsRouter from './routes/alerts.routes.js';
import { readingsRouter } from './routes/readings.routes.js';
import authRouter from './routes/auth.routes.js';
import devicesRouter from './routes/devices.routes.js';
import { requireAuth } from './middleware/auth.middleware.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env } from './config/env.js';

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(cors({
  origin: env.corsOrigin,
  credentials: true
}));

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/devices', requireAuth, devicesRouter);
app.use('/api', requireAuth, readingsRouter);
app.use('/api/readings', requireAuth, readingsRouter);
app.use('/api/alerts', requireAuth, alertsRouter);
app.use('/api/alerts.php', requireAuth, alertsRouter);

app.use((_request, response) => {
  response.status(404).json({
    status: 'error',
    message: 'Route not found.'
  });
});

app.use((error, _request, response, _next) => {
  console.error(error);

  response.status(error.statusCode ?? 500).json({
    status: 'error',
    message: error.statusCode ? error.message : 'Internal server error.'
  });
});

export default app;
