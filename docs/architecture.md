# DrinkSafe IoT architecture

## Current production-compatible path

The implemented sensor path is:

```text
ESP32 or Wokwi
    -> ThingSpeak channel
    -> Node.js/Express API
    -> PostgreSQL (optional persistence)
    -> React/Vite dashboard
```

The ESP32 does not currently send directly to the Node.js server. It publishes
the existing fields to ThingSpeak:

| ThingSpeak field | Meaning | Unit |
|---|---|---|
| `field1` | TDS | ppm |
| `field2` | Water temperature | °C |
| `field3` | Water-quality score | /100 |

The Node service reads ThingSpeak using the server-side `TS_CHANNEL_ID` and
`TS_READ_KEY` environment variables. The read key is never placed in the
frontend or firmware.

The dashboard calls the authenticated Node API:

```text
GET /api/latest
GET /api/history?range=1h|6h|24h
GET /api/alerts
GET /api/readings/export.csv?deviceId=<owned-device-id>
```

When `PERSIST_READINGS=true`, fetched feeds are upserted into PostgreSQL using
the ThingSpeak `entry_id` as `external_id`. The unique key
`(device_id, external_id)` prevents duplicate rows caused by polling.

## Wokwi or physical ESP32 through ThingSpeak

This is the recommended first deployment path because it requires no new
backend firmware protocol:

1. Read the TDS and DS18B20 sensors on the ESP32.
2. Calculate the water-quality score using the same documented sensor logic.
3. Send the values to ThingSpeak at a controlled interval.
4. Create a DrinkSafe device with the matching ThingSpeak channel ID.
5. Configure the backend `TS_CHANNEL_ID` and `TS_READ_KEY`.
6. Enable PostgreSQL persistence after confirming the dashboard works.

Keep the ThingSpeak write key only in the ESP32/Wokwi secret configuration.
Keep the ThingSpeak read key only on the backend. Never commit either key.

ThingSpeak is useful as an ingestion gateway because it provides buffering,
charts, and a stable public IoT API while the student project is developed.
Its limitations are external API rate limits, dependence on a third party, and
less control over immediate device authentication.

## Future direct ESP32 ingestion

Direct ingestion is not implemented yet. When it is added, use a separate
device-ingestion endpoint rather than reusing browser login cookies:

```text
POST /api/ingest/readings
Authorization: Bearer <device-ingestion-token>
Content-Type: application/json
```

Example payload:

```json
{
  "external_id": "esp32-001-2026-10-22T16:00:00.000Z",
  "tds_ppm": 245.5,
  "temperature_c": 23.4,
  "water_quality": 87,
  "recorded_at": "2026-10-22T16:00:00.000Z"
}
```

The implementation should:

1. Authenticate a device-specific credential, not a user password.
2. Resolve the device from that credential.
3. Validate numeric ranges and timestamp format.
4. Apply an idempotency constraint on `(device_id, external_id)`.
5. Store the reading in PostgreSQL.
6. Return `201` for a new reading and a safe idempotent response for a
   repeated external ID.
7. Rate-limit requests per device.
8. Record rejected requests without logging tokens or sensor secrets.

The ESP32 should use TLS, a request timeout, bounded retries with backoff, and
a small offline queue. It should not retry indefinitely or send credentials in
the URL.

## Migration sequence for direct ingestion

1. Keep ThingSpeak ingestion working as a fallback.
2. Add the backend ingestion endpoint and tests.
3. Add a device-token table and token rotation/revocation.
4. Test a second Wokwi sketch against a development deployment.
5. Compare direct readings with ThingSpeak readings.
6. Connect a physical ESP32.
7. Disable ThingSpeak only after observing reliable direct ingestion.

This avoids making the first physical-hardware demonstration depend on an
untested network protocol.
