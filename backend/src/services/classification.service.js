const thresholds = Object.freeze({
  tdsWarning: 300,
  tdsUnsafe: 500,
  temperatureWarning: 25,
  temperatureUnsafe: 30,
  waterQualityWarning: 75,
  waterQualityUnsafe: 50
});

export function classifyTds(ppm) {
  if (ppm >= thresholds.tdsUnsafe) return 'unsafe';
  if (ppm >= thresholds.tdsWarning) return 'warning';
  return 'safe';
}

export function classifyTemperature(celsius) {
  if (celsius >= thresholds.temperatureUnsafe) return 'unsafe';
  if (celsius >= thresholds.temperatureWarning) return 'warning';
  return 'safe';
}

export function classifyWaterQuality(score) {
  if (score <= thresholds.waterQualityUnsafe) return 'unsafe';
  if (score <= thresholds.waterQualityWarning) return 'warning';
  return 'safe';
}

export function overallStatus(...statuses) {
  const rank = { safe: 0, warning: 1, unsafe: 2 };

  return statuses.reduce(
    (current, status) => (rank[status] > rank[current] ? status : current),
    'safe'
  );
}

export { thresholds };
