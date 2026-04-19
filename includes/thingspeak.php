<?php
// =============================================================
//  DrinkSafe — ThingSpeak Integration
//  Fetches live sensor data from ThingSpeak and returns it
//  in the same format the dashboard already expects.
// =============================================================

require_once __DIR__ . '/../config/db.php';

// -----------------------------------------------------------
//  Fetch the latest single entry from ThingSpeak
// -----------------------------------------------------------
function thingspeak_latest(): array|null {
    $url = sprintf(
        'https://api.thingspeak.com/channels/%s/feeds/last.json?api_key=%s',
        TS_CHANNEL_ID,
        TS_READ_KEY
    );

    $raw = @file_get_contents($url);
    if (!$raw) return null;

    $data = json_decode($raw, true);
    if (!$data || !isset($data['field1'])) return null;

    return [
        'tds_ppm'       => (float) $data['field1'],
        'temperature_c' => (float) $data['field2'],
        'water_quality' => (float) $data['field3'],
        'recorded_at'   =>         $data['created_at'],
    ];
}

// -----------------------------------------------------------
//  Fetch historical entries from ThingSpeak
// -----------------------------------------------------------
function thingspeak_history(string $range): array {
    $minutes = ['1h' => 60, '6h' => 360, '24h' => 1440][$range] ?? 60;

    $url = sprintf(
        'https://api.thingspeak.com/channels/%s/feeds.json?api_key=%s&minutes=%d',
        TS_CHANNEL_ID,
        TS_READ_KEY,
        $minutes
    );

    $raw = @file_get_contents($url);
    if (!$raw) return [];

    $data = json_decode($raw, true);
    if (!$data || empty($data['feeds'])) return [];

    return array_map(function (array $feed): array {
        return [
            'tds_ppm'       => (float) ($feed['field1'] ?? 0),
            'temperature_c' => (float) ($feed['field2'] ?? 0),
            'water_quality' => (float) ($feed['field3'] ?? 0),
            'recorded_at'   =>          $feed['created_at'],
        ];
    }, $data['feeds']);
}
