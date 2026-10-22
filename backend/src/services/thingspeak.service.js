import { env } from '../config/env.js';
import {
  persistReadingIfEnabled,
  persistReadingsIfEnabled
} from './persistence.service.js';

const rangeMinutes = Object.freeze({
  '1h': 60,
  '6h': 360,
  '24h': 1440
});

class ThingSpeakError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = 'ThingSpeakError';
    this.statusCode = statusCode;
  }
}

function requireConfiguration(channelId = env.thingspeakChannelId) {
  if (!channelId || !env.thingspeakReadKey) {
    throw new ThingSpeakError(
      'ThingSpeak is not configured. Set TS_CHANNEL_ID and TS_READ_KEY.',
      503
    );
  }
}

async function fetchThingSpeak(path, channelId) {
  requireConfiguration(channelId);

  let response;
  try {
    response = await fetch(
      `https://api.thingspeak.com/channels/${encodeURIComponent(channelId)}${path}`,
      { signal: AbortSignal.timeout(env.thingspeakTimeoutMs) }
    );
  } catch (error) {
    throw new ThingSpeakError(`ThingSpeak request failed: ${error.message}`);
  }

  if (!response.ok) {
    throw new ThingSpeakError(
      `ThingSpeak returned HTTP ${response.status}.`
    );
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ThingSpeakError(`ThingSpeak returned invalid JSON: ${error.message}`);
  }
}

function toReading(feed) {
  return {
    external_id: String(feed.entry_id),
    tds_ppm: Number(feed.field1 ?? 0),
    temperature_c: Number(feed.field2 ?? 0),
    water_quality: Number(feed.field3 ?? 0),
    recorded_at: feed.created_at
  };
}

export async function getLatestReading(device) {
  const channelId = device?.thingspeak_channel_id ?? env.thingspeakChannelId;
  const data = await fetchThingSpeak(
    `/feeds/last.json?api_key=${encodeURIComponent(env.thingspeakReadKey)}`,
    channelId
  );

  if (
    !data ||
    data.field1 === undefined ||
    data.field1 === null ||
    !data.created_at
  ) {
    return null;
  }

  const reading = toReading(data);
  if (device) reading.device_id = device.id;
  await persistReadingIfEnabled(reading);
  return reading;
}

export async function getHistory(range, device) {
  const channelId = device?.thingspeak_channel_id ?? env.thingspeakChannelId;
  const minutes = rangeMinutes[range] ?? rangeMinutes['1h'];
  const data = await fetchThingSpeak(
    `/feeds.json?api_key=${encodeURIComponent(env.thingspeakReadKey)}&minutes=${minutes}`,
    channelId
  );

  if (!data || !Array.isArray(data.feeds)) {
    return [];
  }

  const readings = data.feeds.map(toReading);
  if (device) readings.forEach((reading) => { reading.device_id = device.id; });
  await persistReadingsIfEnabled(readings);
  return readings;
}

export { ThingSpeakError, rangeMinutes };
