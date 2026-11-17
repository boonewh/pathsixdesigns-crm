import { expect, test, type Page } from '@playwright/test';

const now = new Date();
const local = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15, 10);
const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15, 10);
const nextMonthTitle = nextMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

const interactions = [
  { id: 1, summary: 'Send revised proposal', outcome: 'Interested', notes: '', contact_date: thisMonth.toISOString(), follow_up: thisMonth.toISOString(), followup_status: 'pending', lead_name: 'Harbor Point Dental', lead_id: 1 },
  { id: 2, summary: 'Renewal check-in', outcome: '', notes: '', contact_date: thisMonth.toISOString(), follow_up: nextMonth.toISOString(), followup_status: 'pending', client_name: 'Metro Freight', client_id: 2 },
  { id: 3, summary: 'Kickoff', outcome: '', notes: '', contact_date: thisMonth.toISOString(), follow_up: nextMonth.toISOString(), followup_status: 'pending', lead_name: 'Summit Roofing', lead_id: 3 },
];

async function setup(page: Page, opts: { listStatus?: number; putStatus?: number } = {}) {
  const listRequests: string[] = [];
  const puts: unknown[] = [];
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
    if (url.pathname === '/api/interactions/') {
      listRequests.push(url.search);
      if (opts.listStatus) return route.fulfill({ status: opts.listStatus, json: { error: 'boom' } });
      return route.fulfill({ json: { interactions, total: interactions.length } });
    }
    if (url.pathname === '/api/interactions/1' && route.request().method() === 'PUT') {
      puts.push(route.request().postDataJSON());
      return route.fulfill({ status: opts.putStatus ?? 200, json: {} });
    }
    return route.fulfill({ json: [] });
  });
  return { listRequests, puts, dialogs };
}

test('changing the type filter keeps your place and does not reload', async ({ page }) => {
  const { listRequests } = await setup(page);
  await page.goto('/calendar');
  await page.getByRole('button', { name: 'Next month' }).click();
  await expect(page.getByRole('heading', { name: nextMonthTitle })).toBeVisible();
  await expect(page.getByText('Metro Freight')).toBeVisible();

  const requestsBefore = listRequests.length; // dev mode may load twice on start
  await page.getByRole('group', { name: 'Filter by type' }).getByRole('button', { name: 'Leads' }).click();
  await expect(page.getByRole('heading', { name: nextMonthTitle })).toBeVisible();
  await expect(page.getByText('Summit Roofing')).toBeVisible();
  await expect(page.getByText('Metro Freight')).toHaveCount(0);
  expect(listRequests.length).toBe(requestsBefore);
  expect(listRequests[0]).toBe('?sort=pending&per_page=200');
});

test('a failed load shows a message instead of loading forever', async ({ page }) => {
  await setup(page, { listStatus: 500 });
  await page.goto('/calendar');
  await expect(page.getByText("Couldn't load follow-ups.", { exact: false })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Loading calendar' })).toHaveCount(0);
});

test('the follow-up window shows the summary', async ({ page }) => {
  await setup(page);
  await page.goto('/calendar');
  await page.getByText('Harbor Point Dental').click();
  await expect(page.getByText('Send revised proposal')).toBeVisible();
});

async function dragToNextDay(page: Page) {
  const event = page.locator('.fc-event', { hasText: 'Harbor Point Dental' });
  const target = page.locator(`td[data-date="${local(new Date(now.getFullYear(), now.getMonth(), 16))}"]`);
  const from = (await event.boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(from.x + 10, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 10 });
  await page.mouse.up();
}

test('moving a follow-up confirms the new date', async ({ page }) => {
  const { puts, dialogs } = await setup(page);
  await page.goto('/calendar');
  await dragToNextDay(page);
  await expect(page.getByText(/Follow-up moved to/)).toBeVisible();
  expect(puts).toHaveLength(1);
  expect(dialogs).toEqual([]);
});

test('a failed move shows a message, not a browser alert, and puts it back', async ({ page }) => {
  const { dialogs } = await setup(page, { putStatus: 500 });
  await page.goto('/calendar');
  await dragToNextDay(page);
  await expect(page.getByText("Couldn't move the follow-up. Please try again.")).toBeVisible();
  expect(dialogs).toEqual([]);
  await expect(page.locator(`td[data-date="${local(thisMonth)}"]`).getByText('Harbor Point Dental')).toBeVisible();
});

test('phones open on the list view and fit the screen', async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/calendar');
  await expect(page.locator('.fc-list')).toBeVisible();
  await expect(page.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
