import { test, expect, type Page } from "@playwright/test";
import type { TableView } from "../../common/src/interfaces/tableInterfaces";
const apiUrl = process.env.VITE_API_URL || "http://localhost:3000";
async function snapshot(page: Page, id: string): Promise<TableView> {
  return page.evaluate(
    async ({ apiUrl, id }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = await (window as any).Clerk.session.getToken();
      const response = await fetch(`${apiUrl}/api/tables/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Table returned ${response.status}`);
      return response.json();
    },
    { apiUrl, id },
  );
}
async function create(page: Page, seats: number, name: string) {
  await page.goto("/tables");
  await page.getByRole("button", { name: "Create table", exact: true }).click();
  await page.getByLabel("Table name", { exact: true }).fill(name);
  await page
    .getByRole("combobox", { name: "Seats", exact: true })
    .selectOption(String(seats));
  await page.getByRole("button", { name: "Open table", exact: true }).click();
  await expect(page).toHaveURL(/\/tables\/[0-9a-f-]{36}/);
  await page.getByRole("button", { name: "CPU players", exact: true }).click();
  return page.url().split("/").pop()!;
}
async function close(page: Page) {
  await page.getByRole("button", { name: "Agent seats", exact: true }).click();
  await page.getByRole("button", { name: "Close table", exact: true }).click();
  await expect(
    page.getByText("This table is closed", { exact: true }),
  ).toBeVisible();
}
async function playHand(page: Page, id: string, reconnect = false) {
  await page.getByRole("button", { name: "I’m ready", exact: true }).click();
  await page.getByRole("button", { name: "Deal hand", exact: true }).click();
  const streets = new Set<string>();
  let current = await snapshot(page, id);
  const total = current.seats.reduce(
    (sum, seat) => sum + seat.stack + seat.committed,
    0,
  );
  for (
    let decisions = 0;
    decisions < 100 && current.street !== "complete";
    decisions++
  ) {
    streets.add(current.street);
    expect(
      current.seats
        .filter((s) => s.kind === "cpu")
        .every((s) => !s.cards.length),
    ).toBe(true);
    await expect
      .poll(
        async () => {
          current = await snapshot(page, id);
          streets.add(current.street);
          return current.legal !== null || current.street === "complete";
        },
        { timeout: 60000, intervals: [800] },
      )
      .toBe(true);
    if (current.street === "complete") break;
    const action = page.getByRole("button", {
      name: current.legal!.check ? "Check" : /^Call /,
      exact: current.legal!.check,
    });
    await expect(action).toBeEnabled();
    await action.click();
    // Wait for the submitted human version to commit before another decision.
    const before = current.version;
    if (reconnect) {
      await page.reload();
      await expect(
        page.getByRole("button", { name: "CPU players", exact: true }),
      ).toBeVisible();
      reconnect = false;
    }
    await expect
      .poll(
        async () => {
          current = await snapshot(page, id);
          return current.version;
        },
        { timeout: 12000 },
      )
      .toBeGreaterThan(before);
  }
  expect(current.street).toBe("complete");
  expect(current.seats.reduce((sum, seat) => sum + seat.stack, 0)).toBe(total);
  await expect(page.locator(".live-result")).toBeVisible();
  return { streets, current };
}
test("one human can play repeated hands against a CPU and reconnect", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  page.setDefaultTimeout(12000);
  const id = await create(page, 2, "Marina practice");
  await page.getByRole("radio", { name: "Marina Passive" }).check();
  await page.screenshot({ path: info.outputPath("desktop-cpu-picker.png") });
  await page.getByRole("button", { name: "Add Marina", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Remove Marina", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "CPU players", exact: true }),
  ).toBeFocused();
  await page.reload();
  await expect(page.locator(".cpu-seat-tag")).toHaveText("CPU");
  let reachedRiver = false;
  for (let i = 0; i < 4; i++) {
    const { current } = await playHand(page, id, i === 0);
    if (current.board.length === 5) {
      reachedRiver = true;
      break;
    }
  }
  expect(reachedRiver).toBe(true);
  await page.screenshot({
    path: info.outputPath("desktop-cpu-showdown.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "CPU players", exact: true }).click();
  await page
    .getByRole("button", { name: "Remove Marina", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remove Marina", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await close(page);
});
test("one human can fill seven CPU seats, play a full hand, and use phone controls", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  page.setDefaultTimeout(12000);
  const id = await create(page, 8, "Miami CPU table");
  await page
    .getByRole("button", {
      name: "Fill open seats · Mixed styles",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("All seats are taken.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add Vega", exact: true }),
  ).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: info.outputPath("mobile-cpu-picker.png") });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator(".cpu-seat-tag")).toHaveCount(7);
  await page.screenshot({
    path: info.outputPath("mobile-eight-cpu-seats.png"),
    fullPage: true,
  });
  const { current } = await playHand(page, id);
  expect(
    current.events.some((e) =>
      /^(Rico|Marina|Vega|Ziggy).*: (Call|Check|Raise|Bet|Fold)/.test(e.text),
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("mobile-cpu-result.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".live-seat.is-winner")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: info.outputPath("desktop-eight-cpu-result.png"),
    fullPage: true,
  });
  await close(page);
});
