import { expect, test, type Page } from '@playwright/test';

const day = 24 * 60 * 60 * 1000;
const at = (offsetDays: number) => {
  const d = new Date(Date.now() + offsetDays * day);
  d.setHours(offsetDays === 0 ? 23 : 12, offsetDays === 0 ? 30 : 0, 0, 0);
  return d.toISOString();
};

// 10 recent interactions without follow-ups, plus older ones that have follow-ups.
const recent = Array.from({ length: 10 }, (_, n) => ({ id: 100 + n, summary: `Call ${n}`, contact_date: at(-1), lead_name: 'Busy lead' }));
const withFollowUps = [
  { id: 1, summary: 'Send proposal', contact_date: at(-30), follow_up: at(-3), followup_status: 'pending', lead_name: 'Harbor Point Dental' },
  { id: 2, summary: 'Check in', contact_date: at(-30), follow_up: at(0), followup_status: 'pending', client_name: 'Coastal Title' },
  { id: 3, summary: 'Demo', contact_date: at(-30), follow_up: at(3), followup_status: 'pending', project_name: 'Portal rollout' },
  { id: 4, summary: 'Done already', contact_date: at(-30), follow_up: at(-2), followup_status: 'completed', lead_name: 'Old lead' },
];

async function setup(page: Page, opts: { fail?: boolean; hold?: Promise<void> } = {}) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({ id: 1, email: 'local@example.test', roles: [], tenant_id: 1 }));
  });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    if (url.pathname.startsWith('/api/preferences')) return route.fulfill({ json: { pagination: {}, display: {} } });
    if (url.pathname === '/api/interactions/') {
      if (opts.hold) await opts.hold;
      if (opts.fail) return route.fulfill({ status: 500, json: { error: 'boom' } });
      // Like the backend: 10 newest by default; open follow-ups first with sort=pending.
      const pending = url.searchParams.get('sort') === 'pending';
      const perPage = Number(url.searchParams.get('per_page') || 10);
      const rows = (pending ? [...withFollowUps, ...recent] : [...recent, ...withFollowUps]).slice(0, perPage);
      return route.fulfill({ json: { interactions: rows, total: 14 } });
    }
    if (url.pathname === '/api/activity/recent') {
      return route.fulfill({ json: [{ entity_type: 'lead', entity_id: 5, name: 'Harbor Point Dental', last_touched: new Date().toISOString().replace('Z', '') + 'Z', profile_link: '/leads/5' }] });
    }
    if (url.pathname === '/api/leads/5') return route.fulfill({ json: { id: 5, name: 'Harbor Point Dental', lead_status: 'open', created_at: at(-30) } });
    return route.fulfill({ json: [] });
  });
}

test('follow-ups on older interactions show, with the right counts', async ({ page }) => {
  await setup(page);
  await page.goto('/dashboard');
  const followUps = page.getByRole('region', { name: 'My follow-ups' });
  await expect(followUps.getByText('Send proposal')).toBeVisible();
  await expect(followUps.getByText('Check in')).toBeVisible();
  await expect(followUps.getByText('Demo')).toBeVisible();
  await expect(followUps.getByText('Done already')).toHaveCount(0);
  await expect(followUps.getByRole('heading', { name: 'Overdue (1)' })).toBeVisible();
  await expect(followUps.getByRole('heading', { name: 'Today (1)' })).toBeVisible();
  await expect(followUps.getByRole('heading', { name: 'Next 7 days (1)' })).toBeVisible();

  // Clicking a follow-up still opens the follow-up window.
  await followUps.getByRole('button', { name: /Send proposal/ }).click();
  await expect(page.getByText('Follow-up: Harbor Point Dental')).toBeVisible();
});

test('recently touched links move within the app', async ({ page }) => {
  await setup(page);
  await page.goto('/dashboard');
  await page.evaluate(() => { (window as unknown as { marker: boolean }).marker = true; });
  await page.getByRole('region', { name: 'Recently touched' }).getByRole('link', { name: /Harbor Point Dental/ }).click();
  await expect(page).toHaveURL(/\/leads\/5$/);
  expect(await page.evaluate(() => (window as unknown as { marker?: boolean }).marker)).toBe(true);
});

test('no "all caught up" while loading or after an error', async ({ page }) => {
  let release!: () => void;
  const hold = new Promise<void>(r => { release = r; });
  await setup(page, { fail: true, hold });
  await page.goto('/dashboard');
  await expect(page.getByRole('status', { name: 'Loading dashboard' })).toBeVisible();
  await expect(page.getByText(/all caught up/i)).toHaveCount(0);
  release();
  await expect(page.getByText("Couldn't load follow-ups.", { exact: false })).toBeVisible();
  await expect(page.getByText(/all caught up/i)).toHaveCount(0);
});

test('dashboard fits a phone screen', async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard');
  await expect(page.getByText('Send proposal')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
