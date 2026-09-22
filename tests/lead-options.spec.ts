import { expect, test, type Page } from '@playwright/test';

async function setup(page: Page, type: string | null, status: string | null, custom = false) {
  const writes: Record<string, unknown>[] = [];
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({ id: 1, email: 'local@example.test', roles: ['admin'], tenant_id: 1 }));
  });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    if (route.request().method() === 'PUT' || route.request().method() === 'POST') {
      writes.push(route.request().postDataJSON());
      return route.fulfill({ json: { id: 10 } });
    }
    return route.fulfill({ json: { leads: [{ id: 10, name: 'Existing lead', type, lead_status: status, created_at: '2026-09-01T12:00:00Z', lead_source: 'Retired source' }], total: 1 } });
  });
  await page.goto('/leads');
  if (custom) {
    await page.evaluate(async () => {
      // Use the app's full config so the test exercises the normal page.
      // @ts-expect-error Vite module resolved in the browser
      const { DEFAULT_CONFIG } = await import('/src/config/crmConfig.ts');
      localStorage.setItem('authTenant', JSON.stringify({ id: 1, name: 'Example', config: {
        ...DEFAULT_CONFIG, businessTypes: ['Oil & Gas'],
        leads: { ...DEFAULT_CONFIG.leads, statuses: ['prospecting', 'won', 'lost'] },
      } }));
    });
    await page.reload();
  }
  await expect(page.getByRole('link', { name: 'Existing lead', exact: true })).toBeVisible();
  return writes;
}

for (const [type, status] of [[' oil & gas ', 'prospecting'], ['Legacy category', 'Legacy status'], [null, null], ['', '']] as const) {
  test(`unrelated edits preserve existing options: ${JSON.stringify([type, status])}`, async ({ page }) => {
    const writes = await setup(page, type, status, true);
    await page.getByRole('button', { name: '', exact: true }).filter({ has: page.locator('svg.lucide-ellipsis-vertical') }).click();
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await expect(page.locator('#lead_status')).toHaveCount(1);
    await expect(page.locator('#type')).toHaveValue(type === ' oil & gas ' ? 'Oil & Gas' : type ?? '');
    await page.getByLabel('Notes', { exact: true }).fill('Updated notes');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0].notes).toBe('Updated notes');
    expect(writes[0]).not.toHaveProperty('type');
    expect(writes[0]).not.toHaveProperty('lead_status');
    expect(writes[0]).not.toHaveProperty('lead_source');
  });
}

test('new leads use tenant status and allow no business type or source', async ({ page }) => {
  const writes = await setup(page, null, null, true);
  await page.getByRole('button', { name: 'New Lead', exact: true }).click();
  await expect(page.getByLabel('Lead Status', { exact: true })).toHaveValue('prospecting');
  await page.getByLabel('Company Name *', { exact: true }).fill('New company');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toMatchObject({ name: 'New company', lead_status: 'prospecting', type: 'None' });
});

test('explicit edits send configured choices', async ({ page }) => {
  const writes = await setup(page, 'Legacy', null, true);
  await page.getByRole('button', { name: '', exact: true }).filter({ has: page.locator('svg.lucide-ellipsis-vertical') }).click();
  await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Type', { exact: true }).selectOption('Oil & Gas');
  await page.getByLabel('Lead Status', { exact: true }).selectOption('won');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toMatchObject({ type: 'Oil & Gas', lead_status: 'won' });
});
