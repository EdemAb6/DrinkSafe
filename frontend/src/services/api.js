import { API_BASE_URL, API_TIMEOUT_MS } from '../config.js';

class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...options.headers
      }
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.status === 'error') {
      throw new ApiError(
        payload?.message ?? `Request failed with status ${response.status}.`,
        response.status
      );
    }

    return payload.data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('The request timed out. Check the backend connection.');
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError('Unable to reach the DrinkSafe backend.');
  } finally {
    window.clearTimeout(timeout);
  }
}

async function download(path) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      signal: controller.signal,
      headers: { Accept: 'text/csv, application/json' }
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new ApiError(
        payload?.message ?? `Export failed with status ${response.status}.`,
        response.status
      );
    }

    return {
      blob: await response.blob(),
      filename: response.headers
        .get('content-disposition')
        ?.match(/filename="?([^"]+)"?/)?.[1] ?? 'drinksafe-readings.csv'
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('The export request timed out.');
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError('Unable to download the CSV export.');
  } finally {
    window.clearTimeout(timeout);
  }
}

export const api = {
  register: (email, password) => request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }),
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  getDevices: () => request('/devices'),
  createDevice: (name, thingspeak_channel_id) => request('/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, thingspeak_channel_id })
  }),
  getLatest: () => request('/latest'),
  getHistory: (range) =>
    request(`/history?range=${encodeURIComponent(range)}`),
  getAlerts: () => request('/alerts'),
  exportReadings: (deviceId) =>
    download(`/readings/export.csv?deviceId=${encodeURIComponent(deviceId)}`)
};

export { ApiError };
