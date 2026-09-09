import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem("authUser", JSON.stringify({id: 1, email: "owner@test", roles: ["admin"], tenant_id: 1}));
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    await route.fulfill({json: {leads: [], projects: [], sources: [], overall: {total_leads: 0}, by_user: []}});
  });
});

const report = (count: number) => ({
  users: [{ user_id: 1, email: "seller@test", is_active: true, leads_created: count,
    clients_created: 0, projects_created: 0, interactions: 0, edits: 0, deletions: 0, views: 0, total: count }],
  events: count ? [{source: "record", event_id: 1, user_id: 1, email: "seller@test", occurred_at: "2026-09-09T23:59:59Z", action: "created", entity_type: "lead", entity_id: 1, record_name: "New prospect"}] : [],
  total: count, page: 1, per_page: 50, unattributed_total: 0, timezone: "UTC",
});

test("dates change performed-work totals and Clear sends no stale dates", async ({page}) => {
  const queries: URL[] = [];
  await page.route("**/api/reports/sales-activity?**", async route => {
    const url = new URL(route.request().url()); queries.push(url);
    await route.fulfill({json: report(url.searchParams.has("start_date") ? 1 : 9)});
  });
  await page.goto("/reports");
  await page.getByRole("button", {name: "Activity", exact: true}).click();
  await expect(page.getByText("Activity details · 9 recorded events")).toBeVisible();
  await page.getByRole("button", {name: "Last 7 days", exact: true}).click();
  await expect(page.getByText("Activity details · 1 recorded events")).toBeVisible();
  expect(queries.at(-1)?.searchParams.get("start_date")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await expect(page.getByRole("columnheader", {name: "Leads entered", exact: true})).toBeVisible();
  await expect(page.getByRole("columnheader", {name: "Leads Assigned", exact: true})).toHaveCount(0);
  await expect(page.getByRole("cell", {name: "New prospect #1", exact: true})).toBeVisible();
  await page.screenshot({path: "test-results/sales-activity-desktop.png", fullPage: true});
  await page.getByRole("button", {name: "Clear", exact: true}).click();
  await expect(page.getByText("Activity details · 9 recorded events")).toBeVisible();
  expect(queries.at(-1)?.searchParams.has("start_date")).toBe(false);
  expect(queries.at(-1)?.searchParams.has("end_date")).toBe(false);
  await page.getByLabel("Salesperson", {exact: true}).selectOption("1");
  await expect.poll(() => queries.at(-1)?.searchParams.get("user_id")).toBe("1");
});

test("a late response cannot overwrite a newer date selection", async ({page}) => {
  let release: () => void = () => {};
  const delayed = new Promise<void>(resolve => { release = resolve; });
  let olderStarted = false;
  await page.route("**/api/reports/sales-activity?**", async route => {
    const start = new URL(route.request().url()).searchParams.get("start_date");
    if (start === "2026-09-01") { olderStarted = true; await delayed; }
    await route.fulfill({json: report(start === "2026-09-01" ? 99 : 1)});
  });
  await page.goto("/reports");
  await page.getByRole("button", {name: "Activity", exact: true}).click();
  await expect(page.getByText("Activity details · 1 recorded events")).toBeVisible();
  await page.getByLabel("Start Date", {exact: true}).fill("2026-09-01");
  await page.getByRole("button", {name: "Apply Filter", exact: true}).click();
  await expect.poll(() => olderStarted).toBe(true);
  await page.getByLabel("Start Date", {exact: true}).fill("2026-09-03");
  await page.getByRole("button", {name: "Apply Filter", exact: true}).click();
  await expect(page.getByText("Activity details · 1 recorded events")).toBeVisible();
  const olderResponse = page.waitForResponse(response => response.url().includes("start_date=2026-09-01"));
  release();
  await olderResponse;
  await expect(page.getByText("Activity details · 99 recorded events")).toHaveCount(0);
  await expect(page.getByText("Activity details · 1 recorded events")).toBeVisible();
});

test("failed report is visible and retry recovers; invalid dates cannot apply", async ({page}) => {
  let fail = true;
  await page.route("**/api/reports/sales-activity?**", async route => {
    await route.fulfill(fail ? {status: 503, json: {error: "Unavailable"}} : {json: report(0)});
  });
  await page.goto("/reports");
  await page.getByRole("button", {name: "Activity", exact: true}).click();
  await expect(page.getByRole("alert")).toContainText("Could not load sales activity");
  fail = false;
  await page.getByRole("button", {name: "Retry", exact: true}).click();
  await expect(page.getByText("No recorded activity in this date range.")).toBeVisible();
  await page.getByLabel("Start Date", {exact: true}).fill("2026-09-10");
  await page.getByLabel("End Date", {exact: true}).fill("2026-09-01");
  await expect(page.getByRole("button", {name: "Apply Filter", exact: true})).toBeDisabled();
});
