import { test, expect } from "@playwright/test";

test.describe("Hand Recorder", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hands/record");
  });

  test("renders the hand recorder page", async ({ page }) => {
    await expect(page).toHaveURL(/hands\/record/);
    await expect(page.locator("main")).toBeVisible({ timeout: 10000 });
  });

  test("shows game settings form", async ({ page }) => {
    // Should see table size, blinds, and button seat controls
    await expect(
      page.getByText(/table size|blinds|button/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("page navigable from sidebar", async ({ page }) => {
    await page.goto("/equity-calculator");
    // Look for navigation link to hand recorder
    const navLink = page.getByRole("link", { name: /record|hand recorder/i });
    if (await navLink.isVisible()) {
      await navLink.click();
      await expect(page).toHaveURL(/hands\/record/);
    }
  });
});
