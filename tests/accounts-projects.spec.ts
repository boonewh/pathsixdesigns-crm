import { expect, test, type Page } from '@playwright/test';

const clients = [
  { id: 1, name: 'Coastal Title & Escrow', contact_person: 'Renee Park', city: 'Tampa', state: 'FL', status: 'active', type: 'Finance', created_at: '2026-10-01T12:00:00Z' },
  { id: 2, name: 'Metro Freight Partners', contact_person: 'Owen Diaz', status: 'prospect', type: 'Logistics', created_at: '2026-10-02T12:00:00Z' },
];
const projects = [
  { id: 7, project_name: 'Patient portal rollout', project_status: 'active', project_worth: 1530, value_type: 'monthly', client_id: 1, client_name: 'Coastal Title & Escrow', project_start: '2026-11-01T12:00:00Z', project_end: '2027-02-01T12:00:00Z', created_at: '2026-10-01T12:00:00Z', assigned_to_name: 'Wes Boone' },
  { id: 8, project_name: 'Fleet tracking install', project_status: 'pending', project_worth: 42000, value_type: 'one_time', created_at: '2026-10-02T12:00:00Z', primary_contact_name: 'Owen Diaz' },
];

async function setup(page: Page) {
  const deletes: string[] = [];
  const dialogs: string[] = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({ id: 1, email: 'local@example.test', roles: [], tenant_id: 1 }));
  });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    if (route.request().method() === 'DELETE') { deletes.push(url.pathname); return route.fulfill({ json: {} }); }
    if (url.pathname.startsWith('/api/preferences')) return route.fulfill({ json: { pagination: {}, display: {} } });
    if (url.pathname === '/api/clients/') return route.fulfill({ json: { clients, total: 2 } });
    if (url.pathname === '/api/projects/') return route.fulfill({ json: { projects, total: 2 } });
    if (url.pathname === '/api/projects/7') return route.fulfill({ json: projects[0] });
    if (url.pathname.startsWith('/api/interactions')) return route.fulfill({ json: url.searchParams.get('page') ? { interactions: [], total: 0 } : { interactions: [] } });
    return route.fulfill({ json: [] });
  });
  return { deletes, dialogs };
}

test('accounts and projects show a compact list on phones', async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/clients');
  const accounts = page.getByRole('list', { name: /Clients|Accounts/ });
  await expect(accounts.getByRole('link', { name: /Coastal Title & Escrow/ })).toBeVisible();
  await expect(accounts.getByText('Renee Park · Tampa, FL')).toBeVisible();
  await expect(page.locator('table')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.goto('/projects');
  const list = page.getByRole('list', { name: 'Projects' });
  await expect(list.getByText('$1,530 / mo · Coastal Title & Escrow')).toBeVisible();
  await expect(list.getByText('$42,000 · Owen Diaz')).toBeVisible();
  await expect(page.locator('table')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('deleting an account or a project asks only once', async ({ page }) => {
  const { deletes, dialogs } = await setup(page);

  await page.goto('/clients');
  await page.getByRole('row', { name: /Metro Freight Partners/ }).getByTitle(/Delete/).click();
  await expect.poll(() => deletes).toEqual(['/api/clients/2']);
  expect(dialogs).toHaveLength(1);

  await page.goto('/projects');
  await page.getByRole('row', { name: /Fleet tracking install/ }).getByTitle(/Delete/).click();
  await expect.poll(() => deletes).toEqual(['/api/clients/2', '/api/projects/8']);
  expect(dialogs).toHaveLength(2);
});

test('project page shows the record header and tabs', async ({ page }) => {
  await setup(page);
  await page.goto('/projects/7');
  await expect(page.getByRole('heading', { name: 'Patient portal rollout' })).toBeVisible();
  await expect(page.getByText('$1,530 / mo')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Coastal Title & Escrow' })).toBeVisible();
  await expect(page.getByText('Wes Boone')).toBeVisible();
  await expect(page.getByRole('tab', { name: /Activity/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Notes/ })).toBeVisible();
  // Linked projects can't be converted; that option is for standalone projects only.
  await expect(page.getByRole('button', { name: /Convert to/ })).toHaveCount(0);
});
