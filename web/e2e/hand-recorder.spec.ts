import { test, expect } from "@playwright/test";

test.describe("Hand Recorder", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hands/record");
    await expect(
      page.getByRole("heading", { name: "Record Hand", exact: true }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("renders the hand recorder page", async ({ page }) => {
    await expect(page).toHaveURL(/hands\/record/);
    await expect(page.locator("main")).toBeVisible({ timeout: 10000 });
  });

  test("shows game settings form", async ({ page }) => {
    // Should see table size, blinds, and button seat controls
    await expect(page.getByText("Table Size", { exact: true })).toBeVisible({
      timeout: 5000,
    });
  });

  test("page navigable from sidebar", async ({ page }) => {
    await page.goto("/equity-calculator");
    // Look for navigation link to hand recorder
    const navLink = page.getByRole("link", { name: /record|hand recorder/i });
    await expect(navLink).toBeVisible({ timeout: 15000 });
    await navLink.click();
    await expect(page).toHaveURL(/hands\/record/);
    await expect(
      page.getByRole("heading", { name: "Record Hand", exact: true }),
    ).toBeVisible();
  });
});
