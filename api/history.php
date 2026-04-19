<?php


require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/thingspeak.php';

bootstrap_api();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed. Use GET.', 405);
}

$allowed = ['1h', '6h', '24h'];
$range   = $_GET['range'] ?? '1h';
if (!in_array($range, $allowed, true)) {
    json_error('Invalid range. Use: 1h, 6h, or 24h.');
}

$feeds = thingspeak_history($range);

$points = array_map(function (array $f): array {
    $tds  = $f['tds_ppm'];
    $temp = $f['temperature_c'];
    $wq   = $f['water_quality'];

   
    $label = substr($f['recorded_at'], 11, 5);

    return [
        'label'         => $label,
        'tds_ppm'       => $tds,
        'temperature_c' => $temp,
        'water_quality' => $wq,
        'tds_status'    => classify_tds($tds),
        'temp_status'   => classify_temp($temp),
        'wq_status'     => classify_wq($wq),
    ];
}, $feeds);

json_ok([
    'range'  => $range,
    'points' => $points,
]);
