import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: 'http://localhost:5173', // Match your Vite dev server
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      // Never send synthetic browser-test failures to the real Sentry project.
      VITE_SENTRY_DSN: '',
    },
  },
});
