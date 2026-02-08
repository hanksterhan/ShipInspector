import { test, expect } from "@playwright/test";

test.describe("Hand Library", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hands/library");
  });

  test("renders the hand library page", async ({ page }) => {
    await expect(page).toHaveURL(/hands\/library/);
    await expect(page.locator("main")).toBeVisible({ timeout: 10000 });
  });

  test("shows empty state or hand list", async ({ page }) => {
    // Should show either a list of hands or an empty state message
    const content = page.locator("main");
    await expect(content).toBeVisible({ timeout: 10000 });
    // Check for either table/list elements or empty state text
    const hasTable = await page.locator("table").isVisible().catch(() => false);
    const hasEmptyState = await page
      .getByText(/no hands|empty|record your first/i)
      .first()
      .isVisible()
      .catch(() => false);
    // Page loaded successfully with either content or empty state
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
      (e) =>
        !e.includes("Clerk") && !e.includes("clerk") && !e.includes("401"),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
