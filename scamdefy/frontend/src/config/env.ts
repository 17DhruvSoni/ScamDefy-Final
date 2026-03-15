export const ENV = {
  API_BASE: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  APP_VERSION: '1.0.0',
} as const;
