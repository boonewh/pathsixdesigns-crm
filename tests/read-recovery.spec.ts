import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem("authUser", JSON.stringify({id: 1, email: "owner@test", roles: ["admin"], tenant_id: 1}));
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    await route.fulfill({json: {projects: [], total: 0, clients: [], leads: [], pagination: {}, display: {}}});
  });
});

test("loading stays visible until the last related request finishes", async ({page}) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/leads/", async route => {
    await pending;
    await route.fulfill({json: {leads: []}});
  });
  await page.goto("/projects");
  await expect(page.getByText("Loading projects...", {exact: true})).toBeVisible();
  await expect(page.getByRole("status").filter({hasText: "Loading…"})).toBeVisible();
  await page.screenshot({path: "test-results/projects-loading.png", fullPage: true});
  release();
  await expect(page.getByText("Loading projects...", {exact: true})).toHaveCount(0);
  await expect(page.getByText("Loading…", {exact: true})).toHaveCount(0);
});

test("failure shows an explicit retry and retry stays busy until completion", async ({page}) => {
  let recovered = false;
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/leads/", async route => {
    if (recovered) {
      await pending;
      await route.fulfill({json: {leads: []}});
    } else {
      await route.fulfill({status: 503, json: {error: "Database temporarily unavailable. Please try again.", retryable: true}});
    }
  });
  await page.goto("/projects");
  await expect(page.getByRole("button", {name: "Try again", exact: true})).toBeVisible();
  await expect(page.getByText(/Showing .* projects/)).toHaveCount(0);
  await expect(page.getByRole("button", {name: "New Project"})).toBeDisabled();
  await page.screenshot({path: "test-results/projects-retry.png", fullPage: true});
  recovered = true;
  await page.getByRole("button", {name: "Try again", exact: true}).click();
  await expect(page.getByRole("button", {name: "Try again", exact: true})).toHaveCount(0);
  await expect(page.getByText("Loading projects...", {exact: true})).toBeVisible();
  release();
  await expect(page.getByText("Loading projects...", {exact: true})).toHaveCount(0);
  await expect(page.getByText(/We couldn't load projects/)).toHaveCount(0);
});

test("API errors remain readable by callers and cancelled reads clear the indicator", async ({page}) => {
  await page.goto("/projects");
  await expect(page.getByText("Loading projects...", {exact: true})).toHaveCount(0);
  await page.route("**/api/error-probe", route => route.fulfill({status: 503, json: {error: "Temporary failure"}}));
  const result = await page.evaluate(async () => {
    // @ts-expect-error Vite serves source modules for this isolated browser test.
    const { apiFetch } = await import("/src/lib/api.ts");
    // @ts-expect-error Vite source module.
    const { getPendingReads } = await import("/src/lib/requestActivity.ts");
    const response = await apiFetch("/error-probe");
    const body = await response.json();
    const controller = new AbortController();
    controller.abort();
    try { await apiFetch("/cancel-probe", {signal: controller.signal}); } catch { /* expected */ }
    return {body, pending: getPendingReads()};
  });
  expect(result).toEqual({body: {error: "Temporary failure"}, pending: 0});
  await expect(page.getByText("An unexpected error occurred. Please try again.", {exact: true})).toHaveCount(0);
});

test("mobile retry controls fit the screen", async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.route("**/api/leads/", route => route.fulfill({status: 503, json: {error: "Temporarily unavailable"}}));
  await page.goto("/projects");
  await expect(page.getByRole("button", {name: "Try again", exact: true})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path: "test-results/projects-retry-mobile.png", fullPage: true});
});
