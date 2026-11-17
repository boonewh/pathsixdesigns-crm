import { expect, test, type Page } from '@playwright/test';

const client = { id: 1, name: 'Alderline Studio', type: 'Professional Services', contact_person: 'Maya Bennett', created_at: '2026-09-27T12:00:00Z' };
const project = {
  id: 7, project_name: 'Design Intake Rollout', project_status: 'won', project_worth: 18400, value_type: 'one_time',
  client_id: 1, client_name: 'Alderline Studio', project_start: '2026-10-11T12:00:00', project_end: '2026-11-30T12:00:00',
  created_at: '2026-10-01T12:00:00Z', assigned_to_name: 'admin@staging.test',
};
const lead = { id: 5, name: 'Clearwater Ledger Co.', lead_status: 'lost', created_at: '2026-10-28T12:00:00Z' };

async function setup(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({ id: 1, email: 'admin@staging.test', roles: ['admin'], tenant_id: 1 }));
  });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    if (url.pathname.startsWith('/api/preferences')) return route.fulfill({ json: { pagination: {}, display: {} } });
    if (url.pathname === '/api/clients/1') return route.fulfill({ json: client });
    if (url.pathname === '/api/projects/7') return route.fulfill({ json: project });
    if (url.pathname === '/api/leads/5') return route.fulfill({ json: lead });
    if (url.pathname.startsWith('/api/interactions')) return route.fulfill({ json: { interactions: [], total: 0 } });
    return route.fulfill({ json: [] });
  });
}

async function expectRoomyTitle(page: Page, title: string, button: RegExp) {
  const heading = page.getByRole('heading', { name: title });
  await expect(heading).toBeVisible();
  const headingBox = (await heading.boundingBox())!;
  const buttonBox = (await page.getByRole('button', { name: button }).first().boundingBox())!;
  // The title keeps most of the card width instead of being squeezed beside the button.
  expect(headingBox.width).toBeGreaterThan(230);
  // The button sits on its own line below the title.
  expect(buttonBox.y).toBeGreaterThanOrEqual(headingBox.y + headingBox.height - 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('account page title is not squeezed on phones', async ({ page }) => {
  await setup(page);
  await page.goto('/clients/1');
  await expectRoomyTitle(page, 'Alderline Studio', /^Assign/);
});

test('project page title is not squeezed and the full date range shows on phones', async ({ page }) => {
  await setup(page);
  await page.goto('/projects/7');
  await expectRoomyTitle(page, 'Design Intake Rollout', /^Assign/);
  const dates = page.getByText(/10\/11\/2026.*11\/30\/2026/);
  await expect(dates).toBeVisible();
  // Not cut off with an ellipsis.
  expect(await dates.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});

test('lead page keeps its buttons below the title on phones', async ({ page }) => {
  await setup(page);
  await page.goto('/leads/5');
  await expectRoomyTitle(page, 'Clearwater Ledger Co.', /^Assign/);
});
