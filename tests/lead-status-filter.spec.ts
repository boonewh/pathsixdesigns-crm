import { expect, test, type Page } from '@playwright/test';

const leads = [
  { id: 1, name: 'Qualified lead', lead_status: 'qualified', created_at: '2026-10-01T12:00:00Z' },
  { id: 2, name: 'Open lead', lead_status: 'open', created_at: '2026-10-02T12:00:00Z' },
];

async function setup(page: Page, withCounts: boolean) {
  const listRequests: URL[] = [];
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({ id: 1, email: 'local@example.test', roles: [], tenant_id: 1 }));
  });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    if (url.pathname.startsWith('/api/preferences')) return route.fulfill({ json: { pagination: {}, display: {} } });
    if (url.pathname === '/api/leads/') {
      listRequests.push(url);
      const status = url.searchParams.get('status');
      const rows = withCounts && status ? leads.filter(l => l.lead_status === status) : leads;
      return route.fulfill({ json: {
        leads: rows,
        total: withCounts && status ? rows.length : 42,
        ...(withCounts ? { status_counts: { open: 30, qualified: 12 } } : {}),
      } });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto('/leads');
  await expect(page.getByRole('link', { name: 'Qualified lead', exact: true })).toBeVisible();
  return listRequests;
}

test('status filter is sent to the API and real counts are shown', async ({ page }) => {
  const requests = await setup(page, true);
  const strip = page.getByRole('group', { name: 'Filter by status' });
  await expect(strip.getByRole('button', { name: 'All leads 42' })).toBeVisible();
  await expect(strip.getByRole('button', { name: 'Qualified 12' })).toBeVisible();
  await expect(strip.getByRole('button', { name: 'Won 0' })).toBeVisible();

  await strip.getByRole('button', { name: 'Qualified 12' }).click();
  await expect.poll(() => requests.at(-1)?.searchParams.get('status')).toBe('qualified');
  expect(requests.at(-1)?.searchParams.get('page')).toBe('1');
  await expect(page.getByRole('link', { name: 'Open lead', exact: true })).toHaveCount(0);
  await expect(page.getByText('Showing 1 of 1 Qualified leads')).toBeVisible();

  await strip.getByRole('button', { name: /^All leads/ }).click();
  await expect.poll(() => requests.at(-1)?.searchParams.has('status')).toBe(false);
});

test('without counts from the API the page still filters the loaded leads', async ({ page }) => {
  await setup(page, false);
  const strip = page.getByRole('group', { name: 'Filter by status' });
  await expect(strip.getByRole('button', { name: 'All leads 42' })).toBeVisible();
  await expect(strip.getByRole('button', { name: 'Qualified', exact: true })).toBeVisible();

  await strip.getByRole('button', { name: 'Qualified', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open lead', exact: true })).toHaveCount(0);
  await expect(page.getByText('leads on this page')).toBeVisible();
});
