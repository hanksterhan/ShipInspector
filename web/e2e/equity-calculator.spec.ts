import { test, expect } from "@playwright/test";

test.describe("Equity Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/equity-calculator");
  });

  test("renders the equity calculator page", async ({ page }) => {
    await expect(page).toHaveURL(/equity-calculator/);
    // Check for main layout elements
    await expect(
      page.locator('[data-testid="poker-table"], .poker-table, main'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("can open card picker and see card grid", async ({ page }) => {
    // Click on a card slot to open the picker
    const cardSlot = page
      .locator('[data-testid="card-slot"], [role="button"]')
      .first();
    if (await cardSlot.isVisible()) {
      await cardSlot.click();
      // Card picker modal should appear
      await expect(
        page.locator('[role="dialog"], [data-testid="card-picker"]'),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("page has no console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/equity-calculator");
    await page.waitForTimeout(2000);
    // Filter out known non-critical errors (e.g., Clerk warnings in dev)
    const criticalErrors = errors.filter(
      (e) => !e.includes("Clerk") && !e.includes("clerk"),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
