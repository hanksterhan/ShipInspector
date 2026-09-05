import { test, expect } from "@playwright/test";

test.describe("Hand Library", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/hands?*", (route) =>
      route.fulfill({ json: { hands: [], nextCursor: null } }),
    );
    await page.goto("/hands/library");
  });

  test("renders the hand library page", async ({ page }) => {
    await expect(page).toHaveURL(/hands\/library/);
    await expect(page.locator("main")).toBeVisible({ timeout: 10000 });
  });

  test("shows empty state or hand list", async ({ page }) => {
    // Wait for loading skeleton to disappear (data has loaded)
    await expect(page.getByRole("status", { name: /loading/i })).toBeHidden({
      timeout: 15000,
    });
    // Should show either a table of hands or an empty state message
    const hasTable = await page
      .locator("table")
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .getByText(/Your next hand starts here/i)
      .isVisible()
      .catch(() => false);
    expect(hasTable || hasEmptyState).toBe(true);
  });

  test("page has no critical console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/hands/library");
    await page.waitForTimeout(2000);
    const criticalErrors = errors.filter(
      (e) => !e.includes("Clerk") && !e.includes("clerk") && !e.includes("401"),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
