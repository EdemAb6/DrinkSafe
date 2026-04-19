

const API_BASE = '/drinksafeFinal/api';
let currentRange = '1h';
let tdsChart, tempChart, wqChart;

function statusLabel(metric, status) {
  if (metric === 'temp') return { safe: 'Normal', warning: 'Warning', unsafe: 'Unsafe' }[status] ?? 'Normal';
  return { safe: 'Safe', warning: 'Warning', unsafe: 'Unsafe' }[status] ?? 'Safe';
}

function statusClass(status) {
  return { safe: 'status-safe', warning: 'status-warn', unsafe: 'status-danger' }[status] ?? 'status-safe';
}

function statusColor(status) {
  return { safe: '#1a56ff', warning: '#ffa500', unsafe: '#ff4444' }[status] ?? '#1a56ff';
}

function dotColor(status) {
  return { safe: '#00c48c', warning: '#ffa500', unsafe: '#ff4444' }[status] ?? '#00c48c';
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}


//fetching latest reading and updating metric cards

async function fetchLatest() {
  try {
    const res  = await fetch(`${API_BASE}/latest.php`);
    const json = await res.json();
    if (json.status !== 'ok') return;

    const { tds_ppm, temperature_c, water_quality,
            tds_status, temp_status, wq_status, overall, recorded_at } = json.data;

    //tds 
    document.getElementById('tds-value').innerHTML = `${tds_ppm.toFixed(1)} <span>ppm</span>`;
    const tdsEl = document.getElementById('tds-status');
    tdsEl.textContent = statusLabel('tds', tds_status);
    tdsEl.className   = `status ${statusClass(tds_status)}`;

    //temp 
    document.getElementById('temp-value').innerHTML = `${temperature_c.toFixed(1)} <span>°C</span>`;
    const tempEl = document.getElementById('temp-status');
    tempEl.textContent = statusLabel('temp', temp_status);
    tempEl.className   = `status ${statusClass(temp_status)}`;

    //quality
    document.getElementById('wq-value').innerHTML = `${water_quality.toFixed(0)} <span>/100</span>`;
    const wqEl = document.getElementById('wq-status');
    wqEl.textContent = statusLabel('wq', wq_status);
    wqEl.className   = `status ${statusClass(wq_status)}`;

    
    document.querySelector('.live-dot').style.background = dotColor(overall);

    
    const dt = new Date(recorded_at);
    document.getElementById('last-updated').textContent =
      'Updated ' + dt.toLocaleTimeString();

  } catch (err) {
    console.error('fetchLatest error:', err);
  }
}


//redrawing charts

async function fetchHistory(range = '1h') {
  try {
    const res  = await fetch(`${API_BASE}/history.php?range=${range}`);
    const json = await res.json();
    if (json.status !== 'ok') return;

    const { points } = json.data;
    if (!points.length) return;

    const labels    = points.map(p => p.label);
    const tdsVals   = points.map(p => p.tds_ppm);
    const tempVals  = points.map(p => p.temperature_c);
    const wqVals    = points.map(p => p.water_quality);
    const tdsColors = points.map(p => statusColor(p.tds_status));
    const tmpColors = points.map(p => statusColor(p.temp_status));
    const wqColors  = points.map(p => statusColor(p.wq_status));

    updateChart(tdsChart,  labels, tdsVals,  tdsColors);
    updateChart(tempChart, labels, tempVals, tmpColors);
    updateChart(wqChart,   labels, wqVals,   wqColors);

  } catch (err) {
    console.error('fetchHistory error:', err);
  }
}

function updateChart(chart, labels, data, colors) {
  chart.data.labels                      = labels;
  chart.data.datasets[0].data            = data;
  chart.data.datasets[0].backgroundColor = colors;
  chart.update('none');
}


//rendering alerts section

async function fetchAlerts() {
  try {
    const res  = await fetch(`${API_BASE}/alerts.php?limit=10`);
    const json = await res.json();
    if (json.status !== 'ok') return;

    const { alerts }  = json.data;
    const container   = document.getElementById('alerts-container');
    container.innerHTML = '';

    if (!alerts.length) {
      container.innerHTML =
        '<p style="color:#6b7a99;font-size:0.95rem;">No alerts — water quality is good ✓</p>';
      return;
    }

    alerts.forEach(alert => {
      const icon = alert.severity === 'unsafe' ? '🔴' : '🟡';
      const div  = document.createElement('div');
      div.style.cssText =
        'display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #e2eaf4;';
      div.innerHTML = `
        <span style="font-size:1.2rem">${icon}</span>
        <span style="flex:1;font-size:0.9rem">${alert.message}</span>
        <span style="font-size:0.8rem;color:#6b7a99;white-space:nowrap">${timeAgo(alert.created_at)}</span>
      `;
      container.appendChild(div);
    });

  } catch (err) {
    console.error('fetchAlerts error:', err);
  }
}


//creating charts

function createCharts() {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: false } }
  };

  tdsChart = new Chart(
    document.getElementById('tdsChart').getContext('2d'),
    { type: 'bar', data: { labels: [], datasets: [{ label: 'TDS (ppm)', data: [], backgroundColor: [] }] }, options: chartOptions }
  );

  tempChart = new Chart(
    document.getElementById('tempChart').getContext('2d'),
    { type: 'bar', data: { labels: [], datasets: [{ label: 'Temperature (°C)', data: [], backgroundColor: [] }] }, options: chartOptions }
  );

  wqChart = new Chart(
    document.getElementById('wqChart').getContext('2d'),
    { type: 'bar', data: { labels: [], datasets: [{ label: 'Water Quality Score', data: [], backgroundColor: [] }] }, options: chartOptions }
  );
}


function setTimeRange(btn, range) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  btn.classList.add('active');
  currentRange = range;
  fetchHistory(currentRange);
}


//syncing button

function syncSensor() {
  fetchLatest();
  fetchHistory(currentRange);
  fetchAlerts();
}


//refresh every 5 seconds

function startAutoRefresh() {
  setInterval(() => {
    fetchLatest();
    fetchHistory(currentRange);
    fetchAlerts();
  }, 5000);
}


//initial start

window.onload = function () {
  createCharts();
  fetchLatest();
  fetchHistory(currentRange);
  fetchAlerts();
  startAutoRefresh();
};
