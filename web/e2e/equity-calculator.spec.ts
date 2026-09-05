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
    await page
      .getByRole("button", { name: "Player 1 card 1: Empty", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "A of Spades", exact: true }),
    ).toBeVisible();
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
