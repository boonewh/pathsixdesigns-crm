import { test, expect } from '@playwright/test';

test('401 from global search triggers toast and logout', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({
      id: 1,
      email: 'local@example.test',
      roles: ['admin'],
      tenant_id: 1,
    }));
  });

  // Intercept the /search request and force a 401 response
  await page.route('**/api/search/?q=test', route => {
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Unauthorized' }),
    });
  });

  await page.goto('/dashboard');

  // Type "test" to trigger the search
  const input = page.getByPlaceholder('Search...');
  await input.fill('test');

  // Wait for toast to appear
  await expect(page.getByText('Unauthorized Activity. Please log in again.')).toBeVisible();

  // Assert user was logged out (you redirect to /login on logout)
  await expect(page).toHaveURL(/\/login$/);
});
