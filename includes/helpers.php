<?php


require_once __DIR__ . '/../config/db.php';

function bootstrap_api(): void {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('X-Content-Type-Options: nosniff');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function json_ok(mixed $data): void {
    echo json_encode(['status' => 'ok', 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['status' => 'error', 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function classify_tds(float $ppm): string {
    if ($ppm >= TDS_UNSAFE)  return 'unsafe';
    if ($ppm >= TDS_WARNING) return 'warning';
    return 'safe';
}

function classify_temp(float $c): string {
    if ($c >= TEMP_UNSAFE)  return 'unsafe';
    if ($c >= TEMP_WARNING) return 'warning';
    return 'safe';
}

function classify_wq(float $score): string {
    if ($score <= WQ_UNSAFE)  return 'unsafe';
    if ($score <= WQ_WARNING) return 'warning';
    return 'safe';
}

function overall_status(string ...$statuses): string {
    $rank = ['safe' => 0, 'warning' => 1, 'unsafe' => 2];
    $max  = 'safe';
    foreach ($statuses as $s) {
        if (($rank[$s] ?? 0) > ($rank[$max] ?? 0)) $max = $s;
    }
    return $max;
}
