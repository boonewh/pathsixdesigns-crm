import { expect, test } from "@playwright/test";

test("an admin can send a password reset from a user menu", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem(
      "authUser",
      JSON.stringify({
        id: 1,
        email: "admin@example.test",
        roles: ["admin"],
        tenant_id: 1,
      }),
    );
  });

  await page.route("**/api/users/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: 2,
          email: "user@example.test",
          roles: ["user"],
          created_at: "2026-09-04T12:00:00Z",
          is_active: true,
        },
        {
          id: 3,
          email: "inactive@example.test",
          roles: ["user"],
          created_at: "2026-09-04T12:00:00Z",
          is_active: false,
        },
      ]),
    });
  });

  let resetRequestAuthorization = "";
  await page.route("**/api/users/2/send-password-reset", async (route) => {
    resetRequestAuthorization = route.request().headers().authorization ?? "";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Password reset email sent" }),
    });
  });

  await page.goto("/admin/users");
  await expect(page.getByText("user@example.test")).toBeVisible();

  await page.getByRole("button", { name: "Actions for user@example.test" }).click();
  await page.getByRole("button", { name: "Send Password Reset" }).click();

  await expect(
    page.getByText("Password reset email sent to user@example.test"),
  ).toBeVisible();
  expect(resetRequestAuthorization).toBe("Bearer test-token");

  await page.getByText("Deactivated Users (1)").click();
  await page
    .getByRole("button", { name: "Actions for inactive@example.test" })
    .click();
  await expect(
    page.getByRole("button", { name: "Send Password Reset" }),
  ).toBeVisible();
});
