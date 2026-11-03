import { expect, test, type Page } from '@playwright/test';

const NOTE = 'Board meets Nov 12; send the quote by the 5th.';

async function setup(page: Page) {
  const saved: Record<string, unknown>[] = [];
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({ id: 1, email: 'local@example.test', roles: [], tenant_id: 1 }));
  });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    if (!url.pathname.startsWith('/api/')) return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    if (method === 'PUT') { saved.push(route.request().postDataJSON()); return route.fulfill({ json: {} }); }
    if (url.pathname === '/api/leads/5') return route.fulfill({ json: { id: 5, name: 'Harbor Point Dental', lead_status: 'open', notes: '', created_at: '2026-10-01T12:00:00Z' } });
    if (url.pathname === '/api/projects/7') return route.fulfill({ json: { id: 7, project_name: 'Patient portal', project_status: 'pending', notes: '', created_at: '2026-10-01T12:00:00Z' } });
    if (url.pathname.startsWith('/api/preferences')) return route.fulfill({ json: { pagination: {}, display: {} } });
    if (url.pathname.startsWith('/api/interactions')) return route.fulfill({ json: { interactions: [], total: 0 } });
    return route.fulfill({ json: [] });
  });
  return saved;
}

const notesBox = (page: Page) => page.locator('details').filter({ has: page.getByText('Notes', { exact: true }) });

async function openNotesAndSave(page: Page, saved: Record<string, unknown>[]) {
  await page.getByText('Notes', { exact: true }).click();
  await page.getByRole('button', { name: 'Add Note' }).click();
  const box = page.getByPlaceholder('Enter notes here');
  await box.pressSequentially(NOTE);
  // Every letter shows while typing (the bug showed nothing).
  await expect(box).toHaveValue(NOTE);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(() => saved.at(-1)?.notes).toBe(NOTE);
  await expect(page.getByText(NOTE, { exact: true })).toBeVisible();
}

test('lead notes keep every typed letter and save the whole note', async ({ page }) => {
  const saved = await setup(page);
  await page.goto('/leads/5');
  await openNotesAndSave(page, saved);
});

test('project notes keep every typed letter and save the whole note', async ({ page }) => {
  const saved = await setup(page);
  await page.goto('/projects/7');
  await openNotesAndSave(page, saved);
});

test('cancelling an edit puts the saved note back', async ({ page }) => {
  const saved = await setup(page);
  await page.goto('/leads/5');
  await openNotesAndSave(page, saved);

  await notesBox(page).getByRole('button').first().click(); // the ⋮ menu on the note
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const box = page.getByPlaceholder('Enter notes here');
  await expect(box).toHaveValue(NOTE);
  await box.fill('Something else entirely');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByText(NOTE, { exact: true })).toBeVisible();
  expect(saved).toHaveLength(1);
});
