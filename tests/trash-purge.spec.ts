import { expect, test, type Page } from '@playwright/test';

type Resource = 'clients' | 'leads' | 'projects';
async function setup(page: Page, resource: Resource, mode = 'blocked') {
  let purges = 0;
  let restores = 0;
  let rows = [
    { id: 10, name: 'Acme history', deleted_at: '2026-09-20T12:00:00Z', deleted_by: 1 },
    { id: 11, name: 'Empty record', deleted_at: '2026-09-20T12:00:00Z', deleted_by: 1 },
  ];
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({ id: 1, email: 'local@example.test', roles: ['admin'], tenant_id: 1 }));
  });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) {
      return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    }
    if (url.pathname === `/api/${resource}/bulk-purge`) {
      purges++;
      expect(route.request().method()).toBe('POST');
      expect(route.request().postDataJSON()).toEqual({ [`${resource.slice(0, -1)}_ids`]: [10, 11] });
      if (mode === 'network') return route.abort();
      if (mode === 'html') return route.fulfill({ status: 500, contentType: 'text/html', body: '<html>internal SQL details</html>' });
      if (mode === 'success' || mode === 'legacy') {
        rows = rows.filter(row => row.id !== 11);
        return route.fulfill({ json: mode === 'legacy' ? { message: 'Deleted' } : { deleted_ids: [11] } });
      }
      if (mode === 'delayed') await new Promise(resolve => setTimeout(resolve, 400));
      return route.fulfill({ status: 409, json: {
        code: 'purge_blocked', error: 'Linked records prevent permanent deletion. No selected records were deleted.',
        blocked: [{ id: 10, name: 'Acme history', dependencies: [{ kind: 'interactions', count: 3 }] }], deleted_ids: [],
      } });
    }
    if (url.pathname === `/api/${resource}/10/restore`) {
      restores++;
      return route.fulfill({ json: { message: 'Restored' } });
    }
    if (url.pathname.endsWith('/trash')) {
      return route.fulfill({ json: url.pathname === `/api/${resource}/trash` ? rows : [] });
    }
    return route.fulfill({ json: {} });
  });
  await page.goto('/login');
  await page.evaluate(async () => {
    // Model ASFI's saved terminology rather than the generic tenant defaults.
    // @ts-expect-error Vite resolves the source module in the browser.
    const { DEFAULT_CONFIG } = await import('/src/config/crmConfig.ts');
    localStorage.setItem('authTenant', JSON.stringify({ id: 1, name: 'ASFI', slug: 'asfi', config: {
      ...DEFAULT_CONFIG, labels: { ...DEFAULT_CONFIG.labels, client: 'Account' },
    } }));
  });
  await page.goto('/trash');
  const section = page.locator('section').filter({ has: page.getByRole('heading', { name: resource === 'clients' ? 'Deleted Accounts' : `Deleted ${resource[0].toUpperCase() + resource.slice(1)}` }) });
  await expect(section.locator("tbody tr")).toHaveCount(2);
  const mobile = (page.viewportSize()?.width ?? 1280) < 768;
  if (mobile) {
    await section.getByRole('checkbox', { name: /Acme history/ }).check();
    await section.getByRole('button', { name: 'Select All', exact: true }).click();
  } else {
    await section.getByRole('checkbox', { name: /^Select all/ }).check();
  }
  await section.getByRole('button', { name: 'Delete Selected (2)' }).click();
  return { section, dialog: page.getByRole('dialog'), purges: () => purges, restores: () => restores };
}

for (const resource of ['clients', 'leads', 'projects'] as const) {
  test(`${resource}: named blockers preserve the batch and offer safe options`, async ({ page }) => {
    const nativeDialogs: string[] = [];
    page.on('dialog', async dialog => { nativeDialogs.push(dialog.message()); await dialog.dismiss(); });
    const view = await setup(page, resource);
    await expect(view.dialog.getByRole('button', { name: 'Keep in Trash' })).toBeFocused();
    await view.dialog.getByRole('button', { name: 'Delete permanently', exact: true }).click();
    await expect(view.dialog.getByText('Acme history', { exact: true })).toBeVisible();
    await expect(view.dialog.getByText('3 linked interactions')).toBeVisible();
    await expect(view.dialog.getByRole('button', { name: 'Restore and review Acme history' })).toBeVisible();
    await view.dialog.getByRole('button', { name: 'Keep in Trash' }).click();
    await expect(view.section.getByRole('button', { name: 'Delete Selected (2)' })).toBeVisible();
    await expect(view.section.locator('tbody tr')).toHaveCount(2);
    expect(view.purges()).toBe(1);
    expect(nativeDialogs).toEqual([]);
  });

  test(`${resource}: only acknowledged deleted IDs leave the list`, async ({ page }) => {
    const view = await setup(page, resource, 'success');
    await view.dialog.getByRole('button', { name: 'Delete permanently', exact: true }).click();
    await expect(view.dialog).toHaveCount(0);
    await expect(view.section.locator('tbody tr')).toHaveCount(1);
    await expect(view.section.locator('tbody')).toContainText('Acme history');
    await expect(view.section.getByRole('button', { name: 'Delete Selected (1)' })).toBeVisible();
  });
}

for (const mode of ['network', 'html']) {
  test(`${mode}: uncertain failures keep rows and offer refresh without technical errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const view = await setup(page, 'clients', mode);
    await view.dialog.getByRole('button', { name: 'Delete permanently', exact: true }).click();
    await expect(view.dialog.getByRole('button', { name: 'Refresh Trash' })).toBeVisible();
    await expect(view.dialog).not.toContainText('internal SQL details');
    await view.dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(view.section.locator('tbody tr')).toHaveCount(2);
    expect(errors).toEqual([]);
  });
}

test('restoring a blocked record opens its detail page only after success', async ({ page }) => {
  const view = await setup(page, 'clients');
  await view.dialog.getByRole('button', { name: 'Delete permanently', exact: true }).click();
  await view.dialog.getByRole('button', { name: 'Restore and review Acme history' }).click();
  await expect(page).toHaveURL(/\/clients\/10$/);
  expect(view.restores()).toBe(1);
});

test('legacy success refreshes actual rows instead of assuming all were deleted', async ({ page }) => {
  const view = await setup(page, 'leads', 'legacy');
  await view.dialog.getByRole('button', { name: 'Delete permanently', exact: true }).click();
  await expect(view.dialog).toHaveCount(0);
  await expect(view.section.locator('tbody tr')).toHaveCount(1);
  await expect(view.section.locator('tbody')).toContainText('Acme history');
});

test('a pending delete cannot be submitted twice or dismissed', async ({ page }) => {
  const view = await setup(page, 'projects', 'delayed');
  await view.dialog.getByRole('button', { name: 'Delete permanently', exact: true }).click();
  await expect(view.dialog.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(view.dialog).toHaveCount(1);
  await expect(view.dialog.getByText('3 linked interactions')).toBeVisible();
  expect(view.purges()).toBe(1);
});

test('mobile dialog fits the viewport and keeps actions reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const view = await setup(page, 'clients');
  await view.dialog.getByRole('button', { name: 'Delete permanently', exact: true }).click();
  await expect(view.dialog.getByRole('button', { name: 'Keep in Trash' })).toBeVisible();
  await expect(view.dialog.getByRole('heading', { name: 'Linked records prevent deletion' })).toBeVisible();
  await expect(view.dialog.getByRole('button', { name: 'Keep in Trash' })).toBeEnabled();
  await page.screenshot({ path: 'test-results/trash-purge-mobile.png', animations: 'disabled' });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});


test('cancelling the confirmation sends no delete request', async ({ page }) => {
  const view = await setup(page, 'projects');
  await view.dialog.getByRole('button', { name: 'Keep in Trash' }).click();
  await expect(view.dialog).toHaveCount(0);
  expect(view.purges()).toBe(0);
  await expect(view.section.locator('tbody tr')).toHaveCount(2);
});

test('a single-row action confirms only that record', async ({ page }) => {
  const view = await setup(page, 'clients');
  await view.dialog.getByRole('button', { name: 'Keep in Trash' }).click();
  await view.section.locator('tbody tr').first().getByRole('button', { name: 'Delete Permanently' }).click();
  await expect(view.dialog.getByRole('heading', { name: 'Permanently delete 1 account?' })).toBeVisible();
  await expect(view.dialog.getByRole('list', { name: 'Selected records' }).getByRole('listitem')).toHaveCount(1);
  await expect(view.dialog).not.toContainText('Empty record');
  await view.dialog.getByRole('button', { name: 'Keep in Trash' }).click();
  expect(view.purges()).toBe(0);
});
