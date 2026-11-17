import { expect, test, type Page } from '@playwright/test';

const users = [{ id: 7, email: 'sam@example.test', is_active: true }];
const page1 = [
  { id: 1, name: 'Harbor Point Dental', lead_status: 'proposal', created_at: '2026-10-01T12:00:00Z' },
  { id: 2, name: 'Ridgeline Logistics', lead_status: 'open', created_at: '2026-10-02T12:00:00Z' },
];
const page2 = [{ id: 3, name: 'Summit Roofing', lead_status: 'won', created_at: '2026-10-03T12:00:00Z' }];

async function setup(page: Page, opts: { noLeads?: boolean; deleteStatus?: number } = {}) {
  const bulkDeletes: unknown[] = [];
  const dialogs: string[] = [];
  page.on('dialog', async d => { dialogs.push(d.message()); await d.accept(); });
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({ id: 1, email: 'admin@example.test', roles: ['admin'], tenant_id: 1 }));
  });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    if (url.pathname.startsWith('/api/preferences')) return route.fulfill({ json: { pagination: {}, display: {} } });
    if (url.pathname === '/api/users/') return route.fulfill({ json: users });
    if (url.pathname === '/api/leads/all') {
      if (opts.noLeads) return route.fulfill({ json: { leads: [], total: 0 } });
      const rows = url.searchParams.get('page') === '2' ? page2 : page1;
      return route.fulfill({ json: { leads: rows, total: 12 } });
    }
    if (url.pathname === '/api/leads/bulk-delete') {
      bulkDeletes.push(route.request().postDataJSON());
      return route.fulfill({ status: opts.deleteStatus ?? 200, json: {} });
    }
    if (url.pathname === '/api/interactions/all') {
      const future = new Date(Date.now() + 3 * 864e5).toISOString();
      return route.fulfill({ json: { total: 2, interactions: [
        { id: 1, contact_date: '2026-10-01T12:00:00Z', summary: 'Kickoff call', project_name: 'Patient portal rollout', profile_link: '/projects/7', follow_up: future, followup_status: 'pending' },
        { id: 2, contact_date: '2026-10-02T12:00:00Z', summary: 'Intro email', lead_name: 'Harbor Point Dental', profile_link: '/leads/1' },
      ] } });
    }
    return route.fulfill({ json: [] });
  });
  return { bulkDeletes, dialogs };
}

test('checked leads are cleared when you change page, so nothing hidden gets deleted', async ({ page }) => {
  const { bulkDeletes } = await setup(page);
  await page.goto('/admin/leads?user=sam%40example.test');
  await page.getByLabel('Select Harbor Point Dental').check();
  await expect(page.getByRole('button', { name: 'Delete Selected (1)' })).toBeVisible();

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('link', { name: 'Summit Roofing' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Delete Selected/ })).toHaveCount(0);
  expect(bulkDeletes).toEqual([]);
});

test('lead status uses the standard badge without emoji', async ({ page }) => {
  await setup(page);
  await page.goto('/admin/leads?user=sam%40example.test');
  const row = page.getByRole('row', { name: /Harbor Point Dental/ });
  await expect(row.getByText('Proposal', { exact: true })).toBeVisible();
  await expect(row).not.toContainText('📞');
});

test('a failed bulk delete shows a message instead of a browser alert', async ({ page }) => {
  const { dialogs } = await setup(page, { deleteStatus: 500 });
  await page.goto('/admin/leads?user=sam%40example.test');
  await page.getByLabel('Select Harbor Point Dental').check();
  await page.getByRole('button', { name: 'Delete Selected (1)' }).click();
  await expect(page.getByText("Couldn't delete the selected leads. Please try again.")).toBeVisible();
  // Only the confirmation question, no alert popup.
  expect(dialogs).toEqual(['Delete 1 selected lead(s)?']);
});

test('the empty row spans the whole table', async ({ page }) => {
  await setup(page, { noLeads: true });
  await page.goto('/admin/leads?user=sam%40example.test');
  const cell = page.getByRole('cell', { name: 'No leads found for this user.' });
  await expect(cell).toBeVisible();
  const columns = await page.locator('thead th').count();
  expect(Number(await cell.getAttribute('colspan'))).toBe(columns);
});

test('admin interactions show project names and a separate no-follow-up group', async ({ page }) => {
  await setup(page);
  await page.goto('/admin/interactions?user=sam%40example.test');
  await expect(page.getByRole('link', { name: 'Patient portal rollout' })).toBeVisible();

  const upcoming = page.locator('div.space-y-2', { has: page.getByRole('heading', { name: 'Upcoming', exact: true }) });
  await expect(upcoming.getByText('Kickoff call')).toBeVisible();
  await expect(upcoming.getByText('Intro email')).toHaveCount(0);

  const noFollowUp = page.locator('div.space-y-2', { has: page.getByRole('heading', { name: 'No follow-up', exact: true }) });
  await expect(noFollowUp.getByText('Intro email')).toBeVisible();
});
