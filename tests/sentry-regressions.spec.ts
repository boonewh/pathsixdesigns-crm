import { expect, test } from '@playwright/test';


test('apiFetch leaves an error response body available to callers', async ({ page }) => {
  await page.route('**/api/test-error', route => route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Database error' }),
  }));

  await page.goto('/login');

  const result = await page.evaluate(async () => {
    const modulePath = '/src/lib/api.ts';
    const { apiFetch } = await import(/* @vite-ignore */ modulePath);
    const response = await apiFetch('/test-error');
    return {
      bodyUsedBeforeCallerRead: response.bodyUsed,
      body: await response.json(),
    };
  });

  expect(result.bodyUsedBeforeCallerRead).toBe(false);
  expect(result.body).toEqual({ error: 'Database error' });
});


test('dashboard handles failed API responses without an unhandled page error', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({
      id: 1,
      email: 'local@example.test',
      roles: ['admin'],
      tenant_id: 1,
    }));
  });

  await page.route('**/api/interactions/', route => route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Database error' }),
  }));
  await page.route('**/api/activity/recent', route => route.fulfill({
    status: 500,
    contentType: 'text/html',
    body: '<html><body>Internal Server Error</body></html>',
  }));

  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect.poll(() => pageErrors).toEqual([]);
});
