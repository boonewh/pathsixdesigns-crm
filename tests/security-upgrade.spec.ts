import { test, expect } from '@playwright/test';

const claims = { email: 'a?@example.test', sub: 42, roles: ['admin'], exp: 2000000000, tenant_id: 7 };
const token = `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/')) return route.fulfill({ json: {
      projects: [], clients: [], leads: [], total: 0, pagination: {}, display: {},
    } });
    return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
  });
});

test('login and expiry accept a valid base64url token', async ({ page }) => {
  expect(token.split('.')[1]).toMatch(/_/);
  await page.clock.install();
  await page.route('**/api/login', route => route.fulfill({ json: { token } }));
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(claims.email);
  await page.getByLabel('Password', { exact: true }).fill('synthetic-test-password');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('authUser')!))).toMatchObject({
    id: 42, email: claims.email, tenant_id: 7,
  });
  await page.clock.fastForward(60_001);
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBe(token);
});

test('an expired valid token still logs out', async ({ page }) => {
  const expired = `header.${Buffer.from(JSON.stringify({ ...claims, exp: 1 })).toString('base64url')}.signature`;
  await page.addInitScript(value => {
    localStorage.setItem('token', value);
    localStorage.setItem('authUser', JSON.stringify({ id: 42, email: 'test@example.test', roles: ['admin'], tenant_id: 7 }));
  }, expired);
  await page.clock.install();
  await page.goto('/projects');
  await page.clock.fastForward(60_001);
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
});

test('application wires privacy hooks and preserves caller-visible API errors', async ({ page }) => {
  await page.goto('/login');
  await page.route('**/api/privacy-probe?query=PRIVATE', route => route.fulfill({
    status: 503, json: { error: 'PRIVATE backend detail' },
  }));
  const result = await page.evaluate(async () => {
    // @ts-expect-error Vite serves the source import and resolves its SDK module.
    const Sentry = await import('/node_modules/.vite/deps/@sentry_react.js');
    // @ts-expect-error Vite source module.
    const { apiFetch } = await import('/src/lib/api.ts');
    const options = Sentry.getClient().getOptions();
    const raw = { message: 'PRIVATE', user: { email: 'PRIVATE' }, request: { url: '/reset-password/PRIVATE' } };
    const event = options.beforeSend(raw, {});
    const transaction = options.beforeSendTransaction({ ...raw, type: 'transaction' }, {});
    const crumb = options.beforeBreadcrumb({ category: 'console', message: 'PRIVATE' }, {});
    const span = options.beforeSendSpan({ description: '/api/search?q=PRIVATE', data: { body: 'PRIVATE' } });
    const replay = options.integrations.find((integration: { name: string }) => integration.name === 'Replay');
    const response = await apiFetch('/privacy-probe?query=PRIVATE', undefined, { showErrorToast: false });
    return { safe: JSON.stringify({ event, transaction, span }), crumb, replay: !!replay,
      body: await response.json(), status: response.status };
  });
  expect(result.safe).not.toContain('PRIVATE');
  expect(result.crumb).toBeNull();
  expect(result.replay).toBe(true);
  expect(result.body).toEqual({ error: 'PRIVATE backend detail' });
  expect(result.status).toBe(503);
});

test('direct password-reset links do not initialize telemetry or replay', async ({ page }) => {
  await page.goto('/reset-password/PRIVATE-reset-credential');
  const initialized = await page.evaluate(async () => {
    // @ts-expect-error Vite serves this optimized SDK import.
    const Sentry = await import('/node_modules/.vite/deps/@sentry_react.js');
    return !!Sentry.getClient();
  });
  expect(initialized).toBe(false);
});
