function escapeCsvValue(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text)
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}

export function readingsToCsv(readings) {
  const headers = [
    'external_id',
    'tds_ppm',
    'temperature_c',
    'water_quality',
    'recorded_at'
  ];
  const rows = readings.map((reading) =>
    [
      reading.external_id,
      reading.tds_ppm,
      reading.temperature_c,
      reading.water_quality,
      new Date(reading.recorded_at).toISOString()
    ]
      .map(escapeCsvValue)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\r\n') + '\r\n';
}
