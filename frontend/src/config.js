export const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  'https://drinksafe-backend.onrender.com/api';
export const API_TIMEOUT_MS = Number.parseInt(
  import.meta.env.VITE_API_TIMEOUT_MS ?? '8000',
  10
);

export const TIME_RANGES = ['1h', '6h', '24h'];
