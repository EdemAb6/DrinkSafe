<?php


require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/thingspeak.php';

bootstrap_api();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed. Use GET.', 405);
}

$feeds = thingspeak_history('24h');

$alerts = [];

foreach ($feeds as $feed) {
    $tds  = $feed['tds_ppm'];
    $temp = $feed['temperature_c'];
    $wq   = $feed['water_quality'];
    $time = $feed['recorded_at'];

    if ($tds >= TDS_UNSAFE) {
        $alerts[] = ['severity' => 'unsafe',  'message' => "TDS critical: {$tds} ppm (limit " . TDS_UNSAFE . " ppm)", 'created_at' => $time];
    } elseif ($tds >= TDS_WARNING) {
        $alerts[] = ['severity' => 'warning', 'message' => "TDS elevated: {$tds} ppm (warning at " . TDS_WARNING . " ppm)", 'created_at' => $time];
    }

    if ($temp >= TEMP_UNSAFE) {
        $alerts[] = ['severity' => 'unsafe',  'message' => "Temperature critical: {$temp}°C (limit " . TEMP_UNSAFE . "°C)", 'created_at' => $time];
    } elseif ($temp >= TEMP_WARNING) {
        $alerts[] = ['severity' => 'warning', 'message' => "Temperature elevated: {$temp}°C (warning at " . TEMP_WARNING . "°C)", 'created_at' => $time];
    }

    if ($wq <= WQ_UNSAFE) {
        $alerts[] = ['severity' => 'unsafe',  'message' => "Water quality critical: score {$wq}/100", 'created_at' => $time];
    } elseif ($wq <= WQ_WARNING) {
        $alerts[] = ['severity' => 'warning', 'message' => "Water quality low: score {$wq}/100", 'created_at' => $time];
    }
}


usort($alerts, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));
$alerts = array_slice($alerts, 0, 10);

json_ok([
    'total_unread' => count($alerts),
    'alerts'       => $alerts,
]);
