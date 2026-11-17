import { expect, test, type Page } from '@playwright/test';

const clients = [
  { id: 1, name: 'Coastal Clinic', type: 'Healthcare', created_at: '2026-10-01T12:00:00Z' },
  { id: 2, name: 'Metro Freight', type: 'Logistics', created_at: '2026-10-02T12:00:00Z' },
];
const projects = [
  { id: 7, project_name: 'Portal rollout', project_status: 'active', created_at: '2026-10-01T12:00:00Z' },
  { id: 8, project_name: 'Fleet install', project_status: 'pending', created_at: '2026-10-02T12:00:00Z' },
];

async function setup(page: Page, withCounts: boolean) {
  const clientRequests: URL[] = [];
  const projectRequests: URL[] = [];
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({ id: 1, email: 'local@example.test', roles: [], tenant_id: 1 }));
  });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    if (url.pathname.startsWith('/api/preferences')) return route.fulfill({ json: { pagination: {}, display: {} } });
    if (url.pathname === '/api/clients/') {
      clientRequests.push(url);
      const type = url.searchParams.get('type');
      const rows = withCounts && type ? clients.filter(c => c.type === type) : clients;
      return route.fulfill({ json: {
        clients: rows,
        total: withCounts && type ? 30 : 42,
        ...(withCounts ? { type_counts: { Healthcare: 30, Logistics: 12 } } : {}),
      } });
    }
    if (url.pathname === '/api/projects/') {
      projectRequests.push(url);
      const status = url.searchParams.get('status');
      const rows = withCounts && status ? projects.filter(p => p.project_status === status) : projects;
      return route.fulfill({ json: {
        projects: rows,
        total: withCounts && status ? 9 : 25,
        ...(withCounts ? { status_counts: { active: 9, pending: 16 } } : {}),
      } });
    }
    return route.fulfill({ json: [] });
  });
  return { clientRequests, projectRequests };
}

test('accounts type filter is sent to the API with real counts', async ({ page }) => {
  const { clientRequests } = await setup(page, true);
  await page.goto('/clients');
  const select = page.locator('select').filter({ hasText: 'All types' });
  await expect(select.locator('option', { hasText: 'Healthcare (30)' })).toHaveCount(1);
  await expect(select.locator('option', { hasText: 'All types (42)' })).toHaveCount(1);

  await select.selectOption('Healthcare');
  await expect.poll(() => clientRequests.at(-1)?.searchParams.get('type')).toBe('Healthcare');
  expect(clientRequests.at(-1)?.searchParams.get('page')).toBe('1');
  await expect(page.getByText(/Showing 1 of 30 Healthcare/)).toBeVisible();
  await expect(page.getByText('on this page')).toHaveCount(0);

  await select.selectOption('all');
  await expect.poll(() => clientRequests.at(-1)?.searchParams.has('type')).toBe(false);
});

test('projects status filter is sent to the API with real counts', async ({ page }) => {
  const { projectRequests } = await setup(page, true);
  await page.goto('/projects');
  const select = page.locator('select').filter({ hasText: 'All statuses' });
  await expect(select.locator('option', { hasText: 'Active (9)' })).toHaveCount(1);

  await select.selectOption('active');
  await expect.poll(() => projectRequests.at(-1)?.searchParams.get('status')).toBe('active');
  expect(projectRequests.at(-1)?.searchParams.get('page')).toBe('1');
  await expect(page.getByText('Showing 1 of 9 active projects')).toBeVisible();
});

test('without counts from the API both filters still work on the loaded page', async ({ page }) => {
  await setup(page, false);
  await page.goto('/clients');
  await page.locator('select').filter({ hasText: 'All types' }).selectOption('Healthcare');
  await expect(page.getByText('on this page')).toBeVisible();

  await page.goto('/projects');
  await page.locator('select').filter({ hasText: 'All statuses' }).selectOption('active');
  await expect(page.getByText('on this page')).toBeVisible();
});
