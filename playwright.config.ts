import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalTimeout: 240_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: true,
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --strictPort',
    port: 5173,
    timeout: 120 * 1000,
    reuseExistingServer: false,
    env: { ...process.env, VITE_SENTRY_DSN: '' },
  },
});
