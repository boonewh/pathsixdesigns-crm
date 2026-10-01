import { expect, test, type Page } from '@playwright/test';

async function setup(page: Page, denied = false) {
  const writes: string[] = [];
  let archived = false;
  const project = { id: 10, project_name: 'Historical job', project_status: 'lost', created_at: '2026-04-01T12:00:00Z', deleted_at: '2026-04-02T12:00:00Z', archived_at: '2026-10-01T12:00:00Z', notes: 'Retain the original notes.', account_name: 'Original account', interactions: [{ id: 10, summary: 'Original conversation', followup_status: 'pending' }] };
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    if (url.pathname.startsWith('/api/owner/project-archive')) {
      if (denied) return route.fulfill({ status: 403, json: { error: 'Owner access required' } });
      const path = url.pathname.replace('/api/owner/project-archive', '');
      if (route.request().method() === 'POST') writes.push(path);
      if (path === '/preview') return route.fulfill({ json: { total: 1, in_trash: 1, projects: [project], preview_token: 'signed-preview' } });
      if (path === '/archive') {
        expect(route.request().postDataJSON()).toEqual({ preview_token: 'signed-preview', confirmation: 'ARCHIVE 1' });
        archived = true;
        return route.fulfill({ json: { total: 1 } });
      }
      if (path === '/10/restore') { archived = false; return route.fulfill({ json: { restored_to: 'trash' } }); }
      if (path === '/10') return route.fulfill({ json: project });
      return route.fulfill({ json: { total: archived ? 1 : 0, projects: archived ? [project] : [] } });
    }
    return route.fulfill({ json: {} });
  });
  await page.goto('/login');
  await page.evaluate(async () => {
    // @ts-expect-error Vite resolves source modules in browser tests.
    const { DEFAULT_CONFIG } = await import('/src/config/crmConfig.ts');
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({ id: 2, tenant_id: 2, email: 'owner@example.test', roles: ['admin'] }));
    localStorage.setItem('authTenant', JSON.stringify({ id: 2, name: 'Owner company', config: DEFAULT_CONFIG }));
  });
  await page.goto('/owner/project-archive');
  return writes;
}

test('preview never archives automatically; archive and restore require deliberate confirmation', async ({ page }) => {
  const writes = await setup(page);
  await expect(page.getByText('The archive is empty. No Projects have been moved here.')).toBeVisible();
  await expect(page.getByRole('link', { name: /archive/i })).toHaveCount(0);
  await page.getByRole('button', { name: 'Preview eligible Projects' }).click();
  await expect(page.getByText('1 eligible Projects')).toBeVisible();
  expect(writes).toEqual([]);
  const archive = page.getByRole('button', { name: 'Archive reviewed Projects' });
  await expect(archive).toBeDisabled();
  await page.getByLabel('To proceed, type').fill('ARCHIVE 1');
  await archive.click();
  await page.getByRole('button', { name: 'View Project #10' }).click();
  await expect(page.getByText('Retain the original notes.')).toBeVisible();
  await expect(page.getByText('Original conversation')).toBeVisible();
  await page.getByRole('button', { name: 'Restore Project', exact: true }).click();
  expect(writes).toEqual(['/archive']);
  await expect(page.getByText('Restore this Project to Deletes?', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm restore' }).click();
  await expect(page.getByText('Project restored to Deletes.')).toBeVisible();
  expect(writes).toEqual(['/archive', '/10/restore']);
});

test('ordinary admin receives no archive controls or data', async ({ page }) => {
  await setup(page, true);
  await expect(page.getByRole('alert')).toHaveText('This private space is available only to its designated owners.');
  await expect(page.getByRole('button', { name: 'Preview eligible Projects' })).toHaveCount(0);
});

test('mobile archive fits without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await page.getByRole('button', { name: 'Preview eligible Projects' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: 'test-results/archive-mobile.png', fullPage: true });
});
