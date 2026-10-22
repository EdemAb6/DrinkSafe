import { Router } from 'express';
import {
  classifyTemperature,
  classifyTds,
  classifyWaterQuality,
  overallStatus
} from '../services/classification.service.js';
import {
  getHistory,
  getLatestReading,
  rangeMinutes
} from '../services/thingspeak.service.js';
import { requireAuthorizedDevice } from '../middleware/device.middleware.js';
import { listReadingsForDevice } from '../repositories/reading.repository.js';
import { readingsToCsv } from '../services/csv.service.js';

const readingsRouter = Router();
const allowedRanges = Object.keys(rangeMinutes);

const latestHandler = async (_request, response, next) => {
  try {
    const entry = await getLatestReading(_request.device);

    if (!entry) {
      response.status(404).json({
        status: 'error',
        message: 'No readings available from ThingSpeak.'
      });
      return;
    }

    const tdsStatus = classifyTds(entry.tds_ppm);
    const temperatureStatus = classifyTemperature(entry.temperature_c);
    const waterQualityStatus = classifyWaterQuality(entry.water_quality);

    response.json({
      status: 'ok',
      data: {
        tds_ppm: entry.tds_ppm,
        temperature_c: entry.temperature_c,
        water_quality: entry.water_quality,
        recorded_at: entry.recorded_at,
        tds_status: tdsStatus,
        temp_status: temperatureStatus,
        wq_status: waterQualityStatus,
        overall: overallStatus(tdsStatus, temperatureStatus, waterQualityStatus)
      }
    });
  } catch (error) {
    next(error);
  }
};

const historyHandler = async (request, response, next) => {
  const range = request.query.range ?? '1h';

  if (typeof range !== 'string' || !allowedRanges.includes(range)) {
    response.status(400).json({
      status: 'error',
      message: 'Invalid range. Use: 1h, 6h, or 24h.'
    });
    return;
  }

  try {
    const feeds = await getHistory(range, request.device);
    const points = feeds.map((feed) => ({
      label: feed.recorded_at.slice(11, 16),
      tds_ppm: feed.tds_ppm,
      temperature_c: feed.temperature_c,
      water_quality: feed.water_quality,
      tds_status: classifyTds(feed.tds_ppm),
      temp_status: classifyTemperature(feed.temperature_c),
      wq_status: classifyWaterQuality(feed.water_quality)
    }));

    response.json({
      status: 'ok',
      data: { range, points }
    });
  } catch (error) {
    next(error);
  }
};

const exportHandler = async (request, response, next) => {
  const { from, to } = request.query;
  const filters = {};

  for (const [name, value] of [['from', from], ['to', to]]) {
    if (value !== undefined) {
      if (
        typeof value !== 'string' ||
        Number.isNaN(Date.parse(value))
      ) {
        response.status(400).json({
          status: 'error',
          message: `${name} must be a valid ISO date.`
        });
        return;
      }
      filters[name] = new Date(value).toISOString();
    }
  }

  if (filters.from && filters.to && filters.from > filters.to) {
    response.status(400).json({
      status: 'error',
      message: 'from must be earlier than or equal to to.'
    });
    return;
  }

  try {
    const readings = await listReadingsForDevice(request.device.id, filters);
    if (!readings.length) {
      response.status(404).json({
        status: 'error',
        message: 'No historical readings found for this device and date range.'
      });
      return;
    }

    response
      .status(200)
      .type('text/csv')
      .attachment(`drinksafe-${request.device.id}-readings.csv`)
      .send(readingsToCsv(readings));
  } catch (error) {
    next(error);
  }
};

readingsRouter.get(['/latest', '/latest.php'], requireAuthorizedDevice, latestHandler);
readingsRouter.get(['/history', '/history.php'], requireAuthorizedDevice, historyHandler);
readingsRouter.get('/export.csv', requireAuthorizedDevice, exportHandler);

export { readingsRouter };
