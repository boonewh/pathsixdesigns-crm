import { expect, test } from '@playwright/test';

const leads = [
  { id: 1, name: 'Harbor Point Dental Group', contact_person: 'Dana Whitfield', city: 'Tampa', state: 'FL', lead_status: 'proposal', created_at: '2026-10-01T12:00:00Z' },
  { id: 2, name: 'Ridgeline Logistics', contact_person: 'Marcus Ortega', lead_status: 'qualified', created_at: '2026-10-02T12:00:00Z' },
];

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({ id: 1, email: 'local@example.test', roles: [], tenant_id: 1 }));
  });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    if (url.pathname.startsWith('/api/preferences')) return route.fulfill({ json: { pagination: {}, display: {} } });
    if (url.pathname === '/api/leads/') return route.fulfill({ json: { leads, total: 2, status_counts: { proposal: 1, qualified: 1 } } });
    if (url.pathname === '/api/leads/1') return route.fulfill({ json: leads[0] });
    if (url.pathname.startsWith('/api/interactions')) return route.fulfill({ json: { interactions: [], total: 0 } });
    return route.fulfill({ json: [] });
  });
});

test('phones get a compact lead list that uses the full width', async ({ page }) => {
  await page.goto('/leads');
  const list = page.getByRole('list', { name: 'Leads' });
  await expect(list.getByRole('link', { name: /Harbor Point Dental Group/ })).toBeVisible();
  await expect(list.getByText('Dana Whitfield · Tampa, FL')).toBeVisible();

  // The wide table and the Table / Cards toggle are not shown on phones.
  await expect(page.locator('table')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Table' })).toBeHidden();

  // No sideways scrolling, and only the page's own small margin at the edges.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const box = await list.boundingBox();
  expect(box!.x).toBeLessThanOrEqual(16);
  expect(box!.width).toBeGreaterThanOrEqual(390 - 32);

  await list.getByRole('link', { name: /Harbor Point Dental Group/ }).click();
  await expect(page).toHaveURL(/\/leads\/1$/);
});
