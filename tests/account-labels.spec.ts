import { expect, test, type Page } from '@playwright/test';

async function setup(page: Page, options: { id?: number; cached?: string; current?: string; failRefresh?: boolean } = {}) {
  const id = options.id ?? 1;
  const account = { id: 10, name: 'Client Supply Company', created_at: '2026-09-01T12:00:00Z', type: 'None', status: 'new', notes: 'Keep the client wording in this saved note.' };
  let serverTenant: Record<string, unknown>;
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    if (url.pathname === '/api/me') {
      return options.failRefresh ? route.fulfill({ status: 503, json: { error: 'Unavailable' } })
        : route.fulfill({ json: { id: 1, tenant_id: id, tenant: serverTenant } });
    }
    if (url.pathname === '/api/users/') return route.fulfill({ json: [{ id: 1, email: 'sales@example.test', is_active: true }] });
    if (url.pathname.endsWith('/trash')) return route.fulfill({ json: [] });
    if (url.pathname === '/api/search/') return route.fulfill({ json: [{ type: 'client', id: 10, name: account.name, link: '/clients/10', matches: ['name'] }] });
    if (url.pathname.startsWith('/api/clients/') && !url.pathname.endsWith('/10')) return route.fulfill({ json: { clients: [account], total: 21 } });
    if (url.pathname === '/api/clients/10') return route.fulfill({ json: account });
    if (url.pathname === '/api/reports/sales-activity') return route.fulfill({ json: {
      users: [{ user_id: 1, email: 'sales@example.test', is_active: true, leads_created: 0, clients_created: 1, projects_created: 0, interactions: 0, edits: 0, deletions: 0, views: 0, total: 1 }],
      events: [{ source: 'record', event_id: 10, user_id: 1, email: 'sales@example.test', occurred_at: '2026-09-25T12:00:00Z', action: 'created', entity_type: 'client', entity_id: 10, record_name: account.name }],
      total: 1, page: 1, per_page: 50, unattributed_total: 0,
    } });
    if (url.pathname === '/api/reports/revenue-by-client') return route.fulfill({ json: { clients: [{ client_id: 10, client_name: account.name, project_count: 1, won_value: 100, pending_value: 0, total_value: 100, value_type_breakdown: {}, mrr: 0 }] } });
    if (url.pathname === '/api/reports/revenue-forecast') return route.fulfill({ json: { projects: [], total_weighted_forecast: 0, mrr_from_projects: 0, arr_from_projects: 0, lead_pipeline: [] } });
    return route.fulfill({ json: { leads: [], projects: [], sources: [], overall: { total_leads: 0 }, by_user: [], pagination: {}, display: {} } });
  });
  await page.goto('/login');
  const config = await page.evaluate(async () => {
    // @ts-expect-error Vite resolves the source module in the browser.
    return (await import('/src/config/crmConfig.ts')).DEFAULT_CONFIG;
  });
  serverTenant = { id, name: id === 1 ? 'ASFI' : 'Example', slug: id === 1 ? 'asfi' : 'example', config: { ...config, labels: { ...config.labels, client: options.current ?? 'Account' } } };
  await page.evaluate(({ id, config, cached }) => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({ id: 1, email: 'sales@example.test', roles: ['admin'], tenant_id: id }));
    localStorage.setItem('authTenant', JSON.stringify({ id, name: 'Cached tenant', config: { ...config, labels: { ...config.labels, client: cached } } }));
  }, { id, config, cached: options.cached ?? 'Client' });
  await page.goto('/clients');
}

test('ASFI refreshes stale terminology across navigation, accounts, admin, reports, search and help', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await setup(page);
  await expect(page.getByRole('link', { name: 'Accounts', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Accounts', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Client Supply Company', exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Showing.*accounts/i).first()).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('authTenant')!).config.labels.client)).toBe('Account');
  await page.getByRole('link', { name: 'Accounts Overview', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Admin: Accounts Overview' })).toBeVisible();
  await page.getByLabel('Filter by user:').selectOption('sales@example.test');
  await page.getByTitle('Edit Account').click();
  await expect(page.getByRole('heading', { name: 'Edit Account', exact: true })).toBeVisible();
  await page.goto('/reports');
  await page.getByRole('button', { name: 'Revenue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Revenue by Account (Top 10)' })).toBeVisible();
  await page.getByRole('button', { name: 'Activity', exact: true }).click();
  await expect(page.getByRole('columnheader', { name: 'Accounts entered' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Account', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Client Supply Company #10', exact: true })).toBeVisible();
  await page.getByPlaceholder('Search...').fill('supply');
  await expect(page.getByRole('link', { name: /Client Supply Company Matched on/ })).toBeVisible();
  await expect(page.locator('header').getByText('Accounts', { exact: true })).toBeVisible();
  await page.goto('/help');
  await page.getByRole('button', { name: /Conversion Rate Report/ }).click();
  await expect(page.getByText(/using the Convert to Account button/)).toBeVisible();
  await page.getByRole('button', { name: /Revenue Reports/ }).click();
  await expect(page.getByText('Your top accounts by total project value')).toBeVisible();
  await expect(page.getByText('Log all account interactions')).toBeVisible();
  await page.goto('/trash');
  await expect(page.getByRole('heading', { name: 'Deleted Accounts' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('other tenants retain their own terminology', async ({ page }) => {
  await setup(page, { id: 2, cached: 'Customer', current: 'Customer' });
  await expect(page.getByRole('link', { name: 'Customers', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Customers Overview', exact: true })).toBeVisible();
  await page.goto('/help');
  await expect(page.getByText('Log all customer interactions')).toBeVisible();
  await page.goto('/trash');
  await expect(page.getByRole('heading', { name: 'Deleted Customers' })).toBeVisible();
});

test('a temporary config refresh failure preserves the cached session and labels', async ({ page }) => {
  await setup(page, { cached: 'Account', failRefresh: true });
  await expect(page.getByRole('heading', { name: 'Accounts', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Client Supply Company', exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBe('test-token');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('authTenant')!).config.labels.client)).toBe('Account');
});
