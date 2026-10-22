import { pool } from '../db/pool.js';

export async function listDevicesForUser(userId) {
  const result = await pool.query(
    `SELECT id, name, thingspeak_channel_id, created_at
     FROM devices
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId]
  );
  return result.rows;
}

export async function findDeviceForUser(userId, deviceId) {
  const result = await pool.query(
    `SELECT id, name, thingspeak_channel_id, created_at
     FROM devices
     WHERE id = $1 AND user_id = $2`,
    [deviceId, userId]
  );
  return result.rows[0] ?? null;
}

export async function createDevice(userId, name, thingspeakChannelId) {
  const result = await pool.query(
    `INSERT INTO devices (user_id, name, thingspeak_channel_id)
     VALUES ($1, $2, $3)
     RETURNING id, name, thingspeak_channel_id, created_at`,
    [userId, name, thingspeakChannelId]
  );
  return result.rows[0];
}
