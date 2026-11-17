import { expect, test, type Page } from '@playwright/test';

const deletedAt = new Date(Date.now() - 36e5).toISOString();

async function setup(page: Page, opts: { restoreStatus?: number; listStatus?: number } = {}) {
  const dialogs: string[] = [];
  page.on('dialog', async d => { dialogs.push(d.message()); await d.dismiss(); });
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({ id: 1, email: 'local@example.test', roles: [], tenant_id: 1 }));
  });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    if (url.pathname.startsWith('/api/preferences')) return route.fulfill({ json: { pagination: {}, display: {} } });
    if (url.pathname.endsWith('/trash')) {
      if (opts.listStatus) return route.fulfill({ status: opts.listStatus, json: { error: 'boom' } });
      const rows = url.pathname === '/api/leads/trash' ? [{ id: 2, name: 'Harbor Point Dental', deleted_at: deletedAt, deleted_by: 1 }] : [];
      return route.fulfill({ json: rows });
    }
    if (url.pathname === '/api/leads/2/restore') return route.fulfill({ status: opts.restoreStatus ?? 200, json: {} });
    return route.fulfill({ json: [] });
  });
  await page.goto('/trash');
  return { dialogs };
}

test('restoring a record confirms it with a message', async ({ page }) => {
  const { dialogs } = await setup(page);
  await expect(page.getByRole('heading', { name: 'Deletes', exact: true })).toBeVisible();
  await page.getByRole('row', { name: /Harbor Point Dental/ }).getByRole('button', { name: 'Restore' }).click();
  await expect(page.getByText('Harbor Point Dental restored')).toBeVisible();
  await expect(page.getByRole('row', { name: /Harbor Point Dental/ })).toHaveCount(0);
  expect(dialogs).toEqual([]);
});

test('a failed restore shows a message, not a browser alert, and keeps the record', async ({ page }) => {
  const { dialogs } = await setup(page, { restoreStatus: 500 });
  await page.getByRole('row', { name: /Harbor Point Dental/ }).getByRole('button', { name: 'Restore' }).click();
  await expect(page.getByText("Couldn't restore Harbor Point Dental. Please try again.")).toBeVisible();
  await expect(page.getByRole('row', { name: /Harbor Point Dental/ })).toBeVisible();
  expect(dialogs).toEqual([]);
});

test('the refresh error reads correctly (no broken characters)', async ({ page }) => {
  await setup(page, { listStatus: 500 });
  await expect(page.getByText("Trash couldn't be refreshed. The displayed records may be out of date.")).toBeVisible();
});

test('deletes fits a phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await expect(page.getByText('Harbor Point Dental').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
