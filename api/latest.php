<?php

require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/thingspeak.php';

bootstrap_api();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed. Use GET.', 405);
}

$entry = thingspeak_latest();

if (!$entry) {
    json_error('No readings available from ThingSpeak.', 404);
}

$tds_status = classify_tds($entry['tds_ppm']);
$tmp_status = classify_temp($entry['temperature_c']);
$wq_status  = classify_wq($entry['water_quality']);

json_ok([
    'tds_ppm'       => $entry['tds_ppm'],
    'temperature_c' => $entry['temperature_c'],
    'water_quality' => $entry['water_quality'],
    'recorded_at'   => $entry['recorded_at'],
    'tds_status'    => $tds_status,
    'temp_status'   => $tmp_status,
    'wq_status'     => $wq_status,
    'overall'       => overall_status($tds_status, $tmp_status, $wq_status),
]);
