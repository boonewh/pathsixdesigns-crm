import { expect, test, type Page } from '@playwright/test';

const lead = { id: 5, name: 'Harbor Point Dental', lead_status: 'open', contact_person: 'Dana', contact_title: 'Manager', created_at: '2026-10-01T12:00:00Z' };

async function setup(page: Page, opts: { leadStatus?: number; titleSaveFails?: boolean } = {}) {
  let owner: string | null = null;
  const nativeDialogs: string[] = [];
  page.on('dialog', async dialog => { nativeDialogs.push(dialog.message()); await dialog.dismiss(); });
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({ id: 1, email: 'admin@example.test', roles: ['admin'], tenant_id: 1 }));
  });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    if (!url.pathname.startsWith('/api/')) return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    if (url.pathname === '/api/leads/5/assign') { owner = 'sam@example.test'; return route.fulfill({ json: { message: 'ok' } }); }
    if (url.pathname === '/api/leads/5' && method === 'PUT') return route.fulfill({ status: opts.titleSaveFails ? 500 : 200, json: {} });
    if (url.pathname === '/api/leads/5') {
      if (opts.leadStatus) return route.fulfill({ status: opts.leadStatus, json: { error: 'Not found' } });
      return route.fulfill({ json: { ...lead, assigned_to_name: owner } });
    }
    if (url.pathname.startsWith('/api/users')) return route.fulfill({ json: [{ id: 7, email: 'sam@example.test', is_active: true }] });
    if (url.pathname.startsWith('/api/preferences')) return route.fulfill({ json: { pagination: {}, display: {} } });
    if (url.pathname.startsWith('/api/interactions')) return route.fulfill({ json: { interactions: [], total: 0 } });
    return route.fulfill({ json: [] });
  });
  await page.goto('/leads/5');
  return { nativeDialogs };
}

test('assigning a lead updates the owner without reloading the page', async ({ page }) => {
  const { nativeDialogs } = await setup(page);
  await expect(page.getByRole('heading', { name: 'Harbor Point Dental' })).toBeVisible();
  await page.evaluate(() => { (window as unknown as { marker: boolean }).marker = true; });

  await page.getByRole('button', { name: 'Assign Lead' }).click();
  await page.locator('select').filter({ hasText: 'Select a user' }).selectOption('7');
  await page.getByRole('button', { name: 'Assign', exact: true }).click();

  await expect(page.getByText('Lead assigned')).toBeVisible();
  await expect(page.getByText('sam@example.test')).toBeVisible();
  // Same page instance: a full reload would have cleared this marker.
  expect(await page.evaluate(() => (window as unknown as { marker?: boolean }).marker)).toBe(true);
  expect(nativeDialogs).toEqual([]);
});

test('a failed save shows a message instead of a browser alert', async ({ page }) => {
  const { nativeDialogs } = await setup(page, { titleSaveFails: true });
  await page.getByRole('button', { name: 'Manager' }).click();
  await page.getByLabel('Contact title').fill('Office Manager');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText("Couldn't save the contact title. Please try again.")).toBeVisible();
  expect(nativeDialogs).toEqual([]);
});

test('a lead that cannot be loaded shows an error instead of loading forever', async ({ page }) => {
  await setup(page, { leadStatus: 404 });
  await expect(page.getByText("This lead couldn't be loaded.", { exact: false })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Loading' })).toHaveCount(0);
});
