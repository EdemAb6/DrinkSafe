import { env } from '../config/env.js';
import { upsertReading } from '../repositories/reading.repository.js';

export async function persistReadingIfEnabled(reading) {
  if (!env.persistenceEnabled) {
    return null;
  }

  const deviceId = reading.device_id ?? env.persistenceDeviceId;
  if (!deviceId) {
    throw new Error(
      'PERSISTENCE_DEVICE_ID is required when PERSIST_READINGS=true.'
    );
  }

  return upsertReading(deviceId, reading);
}

export async function persistReadingsIfEnabled(readings) {
  if (!env.persistenceEnabled) {
    return [];
  }

  return Promise.all(readings.map(persistReadingIfEnabled));
}
