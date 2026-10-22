import { Router } from 'express';
import { getHistory } from '../services/thingspeak.service.js';
import { thresholds } from '../services/classification.service.js';
import { requireAuthorizedDevice } from '../middleware/device.middleware.js';

const alertsRouter = Router();

alertsRouter.get('/', requireAuthorizedDevice, async (request, response, next) => {
  try {
    const feeds = await getHistory('24h', request.device);
    const alerts = [];

    for (const feed of feeds) {
      const { tds_ppm: tds, temperature_c: temperature, water_quality: score } = feed;
      const time = feed.recorded_at;

      if (tds >= thresholds.tdsUnsafe) {
        alerts.push({
          severity: 'unsafe',
          message: `TDS critical: ${tds} ppm (limit ${thresholds.tdsUnsafe} ppm)`,
          created_at: time
        });
      } else if (tds >= thresholds.tdsWarning) {
        alerts.push({
          severity: 'warning',
          message: `TDS elevated: ${tds} ppm (warning at ${thresholds.tdsWarning} ppm)`,
          created_at: time
        });
      }

      if (temperature >= thresholds.temperatureUnsafe) {
        alerts.push({
          severity: 'unsafe',
          message: `Temperature critical: ${temperature}°C (limit ${thresholds.temperatureUnsafe}°C)`,
          created_at: time
        });
      } else if (temperature >= thresholds.temperatureWarning) {
        alerts.push({
          severity: 'warning',
          message: `Temperature elevated: ${temperature}°C (warning at ${thresholds.temperatureWarning}°C)`,
          created_at: time
        });
      }

      if (score <= thresholds.waterQualityUnsafe) {
        alerts.push({
          severity: 'unsafe',
          message: `Water quality critical: score ${score}/100`,
          created_at: time
        });
      } else if (score <= thresholds.waterQualityWarning) {
        alerts.push({
          severity: 'warning',
          message: `Water quality low: score ${score}/100`,
          created_at: time
        });
      }
    }

    alerts.sort((first, second) =>
      second.created_at.localeCompare(first.created_at)
    );

    response.json({
      status: 'ok',
      data: {
        total_unread: alerts.length > 10 ? 10 : alerts.length,
        alerts: alerts.slice(0, 10)
      }
    });
  } catch (error) {
    next(error);
  }
});

export default alertsRouter;
