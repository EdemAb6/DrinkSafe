import { pool } from '../db/pool.js';

export async function upsertReading(deviceId, reading) {
  const query = `
    INSERT INTO readings (
      device_id,
      external_id,
      tds_ppm,
      temperature_c,
      water_quality,
      recorded_at
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (device_id, external_id)
    DO UPDATE SET
      tds_ppm = EXCLUDED.tds_ppm,
      temperature_c = EXCLUDED.temperature_c,
      water_quality = EXCLUDED.water_quality,
      recorded_at = EXCLUDED.recorded_at
    RETURNING id, device_id, external_id, recorded_at
  `;

  const values = [
    deviceId,
    reading.external_id,
    reading.tds_ppm,
    reading.temperature_c,
    reading.water_quality,
    reading.recorded_at
  ];
  const result = await pool.query(query, values);

  return result.rows[0];
}

export async function listReadingsForDevice(deviceId, { from, to } = {}) {
  const filters = ['device_id = $1'];
  const values = [deviceId];

  if (from) {
    values.push(from);
    filters.push(`recorded_at >= $${values.length}`);
  }
  if (to) {
    values.push(to);
    filters.push(`recorded_at <= $${values.length}`);
  }

  const result = await pool.query(
    `SELECT external_id, tds_ppm, temperature_c, water_quality, recorded_at
     FROM readings
     WHERE ${filters.join(' AND ')}
     ORDER BY recorded_at ASC`,
    values
  );

  return result.rows;
}
