import { test, expect } from "@playwright/test";
import { timedTable } from "../src/test/timedTable";

for (const viewport of [
  { width: 1440, height: 1080 },
  { width: 390, height: 844 },
]) {
  test(`turn countdown and urgent alerts at ${viewport.width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize(viewport);
    let view = timedTable();
    let started = false;
    await page.route("**/api/tables/timer-preview", async (route) => {
      if (!started) {
        view = timedTable();
        started = true;
      }
      await route.fulfill({ json: { ...view, serverTime: Date.now() } });
    });
    await page.goto("/tables/timer-preview");
    const action = page.locator(".your-action");
    const timer = action.locator(".turn-timer");
    const number = timer.locator(".turn-timer-number");
    await expect(timer).toBeVisible();
    const buttons = page.getByRole("button", { name: "Call 10", exact: true });
    const before = await buttons.boundingBox();
    expect(
      await number.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(36);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const bounds = await action.boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
    view = { ...view, version: 2, deadline: Date.now() + 11000 };
    await expect(timer).toHaveClass(/is-warning/, { timeout: 5000 });
    await expect(action).toHaveClass(/has-turn-warning/);
    await expect(
      page.locator('.live-seat[data-seat="0"] .turn-timer-number'),
    ).toHaveText((await number.textContent()) || "");
    expect(
      await action.evaluate(
        (el) => getComputedStyle(el, "::after").animationDuration,
      ),
    ).toBe("1s");
    await expect(number).toHaveText("5s", { timeout: 10000 });
    await expect(action).toHaveClass(/has-turn-critical/);
    expect(
      await action.evaluate(
        (el) => getComputedStyle(el, "::after").animationDuration,
      ),
    ).toBe("0.6s");
    expect(
      await page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (a) => (a as CSSAnimation).animationName === "turn-alert-pulse",
            ).length,
      ),
    ).toBe(2);
    const after = await buttons.boundingBox();
    expect(after!.x).toBeCloseTo(before!.x, 0);
    expect(after!.y).toBeCloseTo(before!.y, 0);
    await page.screenshot({
      path: info.outputPath("urgent-turn.png"),
      fullPage: false,
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await action.evaluate(
        (el) => getComputedStyle(el, "::after").animationName,
      ),
    ).toBe("none");
    expect(
      await page
        .locator(".live-seat.is-acting")
        .evaluate((el) => getComputedStyle(el, "::after").animationName),
    ).toBe("none");
    await expect(number).toHaveText("0s", { timeout: 7000 });
    await expect(buttons).toBeDisabled();
    await expect(action).toHaveClass(/has-turn-expired/);
    view = {
      ...view,
      version: 3,
      actor: 1,
      deadline: Date.now() + 30000,
      legal: null,
    };
    await expect(page.locator(".waiting-action .turn-timer-label")).toHaveText(
      "Marina to act",
    );
    await expect(
      page.locator('.live-seat[data-seat="0"] [role="timer"]'),
    ).toHaveCount(0);
    await expect(page.locator(".has-turn-warning")).toHaveCount(0);
    view = {
      ...view,
      version: 4,
      actor: null,
      deadline: null,
      street: "complete",
    };
    await expect(page.getByRole("timer")).toHaveCount(0);
  });
}
