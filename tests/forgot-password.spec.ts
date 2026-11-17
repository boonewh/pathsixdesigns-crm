import { expect, test } from "@playwright/test";

test("the reset button shows progress and cannot be submitted twice", async ({ page }) => {
  let releaseRequest: () => void = () => {};
  const waitForRelease = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });

  let requestCount = 0;
  await page.route("**/api/forgot-password", async (route) => {
    requestCount += 1;
    await waitForRelease;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Reset email sent" }),
    });
  });

  await page.goto("/forgot-password");
  await page.getByLabel("Email Address").fill("user@example.test");

  const button = page.getByRole("button", { name: "Send Reset Link" });
  await button.click();

  const sendingButton = page.getByRole("button", { name: "Sending..." });
  await expect(sendingButton).toBeDisabled();
  await sendingButton.click({ force: true });
  expect(requestCount).toBe(1);

  releaseRequest();
  await expect(page.getByText("If that email exists, a reset link has been sent.")).toBeVisible();
});
