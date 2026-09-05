import { test, expect } from "@playwright/test";

test("desktop study and real showdown", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("/equity-calculator");
  await expect(
    page.getByRole("heading", { name: "Equity Calculator" }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("desktop-empty.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "River showdown" }).click();
  await expect(
    page.getByRole("heading", { name: "Player 1 wins", exact: true }),
  ).toBeVisible({ timeout: 25000 });
  await expect(
    page.getByRole("region", { name: "Player 1", exact: true }),
  ).toContainText("100.0%");
  await page.screenshot({
    path: info.outputPath("desktop-showdown.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Board card 5: 3 of Hearts", exact: true })
    .click();
  await page.getByRole("button", { name: "K of Clubs", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  // A set of kings wins after the flush misses.
  await expect(
    page.getByRole("heading", { name: "Player 2 wins", exact: true }),
  ).toBeVisible({ timeout: 25000 });
  await page.getByRole("button", { name: "New Hand", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Set up your hand" }),
  ).toBeVisible();
  await expect(page.locator(".seat-winner")).toHaveCount(0);
});

test("mobile card flow and eight players", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/equity-calculator");
  await page.getByRole("button", { name: "Choose cards", exact: true }).click();
  await page.getByRole("button", { name: "A of Spades", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Player 1 · Card 2" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "A of Spades", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: info.outputPath("mobile-picker.png"),
    fullPage: false,
  });
  await page.getByRole("button", { name: "A of Hearts", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Board card 4: Empty", exact: true }),
  ).toBeDisabled();
  for (let i = 0; i < 6; i++)
    await page.getByRole("button", { name: "Add player", exact: true }).click();
  await expect(page.locator(".poker-seat")).toHaveCount(8);
  await expect(
    page.getByRole("button", { name: "Add player", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("mobile-eight-players.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Hand Library", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Hand Library", exact: true }),
  ).toBeVisible();
});

test("import, split pot, export, and reduced motion", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/equity-calculator");
  const study = {
    version: 1,
    variant: "texas-holdem",
    players: [
      {
        seat: 0,
        cards: [
          { rank: 2, suit: "c" },
          { rank: 3, suit: "c" },
        ],
      },
      {
        seat: 1,
        cards: [
          { rank: 4, suit: "d" },
          { rank: 5, suit: "d" },
        ],
      },
    ],
    board: [10, 11, 12, 13, 14].map((rank) => ({ rank, suit: "h" })),
  };
  await page.getByLabel("Import study file").setInputFiles({
    name: "split.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(study)),
  });
  await expect(
    page.getByRole("heading", { name: "Split pot", exact: true }),
  ).toBeVisible({ timeout: 25000 });
  await expect(page.locator(".seat-winner")).toHaveCount(2);
  await expect(page.locator(".equity-result-row").first()).toContainText(
    "50.0%",
  );
  expect(
    await page
      .locator(".winner-emblem")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const download = await pending;
  await download.saveAs(info.outputPath("study.json"));
  expect(download.suggestedFilename()).toBe("ship-inspector-study.json");
  await page.getByLabel("Import study file").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":2}'),
  });
  await expect(page.getByRole("alert")).toContainText("version 1");
  await expect(
    page.getByRole("heading", { name: "Split pot", exact: true }),
  ).toBeVisible();
});

test("real preflop and flop calculations", async ({ page }) => {
  test.setTimeout(90000);
  await page.goto("/equity-calculator");
  await page.getByRole("button", { name: "Aces vs kings" }).click();
  await expect(page.locator(".equity-result-row").first()).toContainText(
    /8\d\.\d%/,
    { timeout: 60000 },
  );
  await expect(page.locator(".seat-winner")).toHaveCount(0);
  await page.getByRole("button", { name: "The flush draw" }).click();
  await expect(page.locator(".equity-result-row").first()).toContainText(
    /\d+\.\d%/,
    { timeout: 25000 },
  );
  await expect(page.locator(".seat-winner")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Board card 4: Empty", exact: true })
    .click();
  await page.getByRole("button", { name: "9 of Spades", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Player 1 · River outs", exact: true }),
  ).toBeVisible({ timeout: 25000 });
  await expect(page.locator(".outs-panel")).toContainText("Win Outs", {
    timeout: 25000,
  });
});

test("settings and secondary screens", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("/equity-calculator");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("switch", { name: "4-color deck" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Settings", exact: true }),
  ).toBeFocused();
  await page.getByRole("link", { name: "Record Hand", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Record Hand", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("recorder.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Pot Odds", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Pot Odds & Equity Required" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Half-pot bet", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Pot odds result" }),
  ).toContainText("25.0%");
  await expect(
    page.getByRole("region", { name: "Pot odds result" }),
  ).toContainText("3:1");
  await page.screenshot({
    path: info.outputPath("pot-odds.png"),
    fullPage: true,
  });
  await page.route("**/hands?*", (route) =>
    route.fulfill({ json: { hands: [], nextCursor: null } }),
  );
  await page.getByRole("link", { name: "Hand Library", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your next hand starts here." }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("library.png"),
    fullPage: true,
  });
});

test("saved hand replay with a known history fixture", async ({
  page,
}, info) => {
  const hand = {
    id: "redesign-fixture",
    owner_user_id: "fixture",
    table_size: 2,
    button_seat: 0,
    small_blind: 50,
    big_blind: 100,
    ante: 0,
    board_flop_1: "11h",
    board_flop_2: "7h",
    board_flop_3: "2c",
    board_turn: "9s",
    board_river: "3h",
    created_at: 1788600000000,
    updated_at: null,
    deleted_at: null,
  };
  const players = [
    {
      id: "one",
      hand_id: hand.id,
      seat_index: 0,
      display_name: "Alex",
      stack_at_start: 10000,
      is_hero: true,
      showdown_card_1: "14h",
      showdown_card_2: "12h",
      created_at: 0,
      updated_at: null,
      deleted_at: null,
    },
    {
      id: "two",
      hand_id: hand.id,
      seat_index: 1,
      display_name: "Sam",
      stack_at_start: 10000,
      is_hero: false,
      showdown_card_1: "13s",
      showdown_card_2: "13d",
      created_at: 0,
      updated_at: null,
      deleted_at: null,
    },
  ];
  const events = [
    ["preflop", "POST_SB", 0, 50],
    ["preflop", "POST_BB", 1, 100],
    ["preflop", "CALL", 0, 50],
    ["preflop", "CHECK", 1, null],
    ["flop", "DEAL_FLOP", null, null],
    ["flop", "CHECK", 1, null],
    ["flop", "CHECK", 0, null],
    ["turn", "DEAL_TURN", null, null],
    ["turn", "CHECK", 1, null],
    ["turn", "CHECK", 0, null],
    ["river", "DEAL_RIVER", null, null],
    ["river", "CHECK", 1, null],
    ["river", "CHECK", 0, null],
    ["river", "REVEAL", 0, null],
    ["river", "REVEAL", 1, null],
    ["river", "COLLECT", 0, 200],
  ];
  const actions = events.map(
    ([street, action_type, actor_seat, amount], sequence_index) => ({
      id: String(sequence_index),
      hand_id: hand.id,
      sequence_index,
      street,
      action_type,
      actor_seat,
      amount,
      raise_to: null,
      decision_ms: null,
      tags: [],
      created_at: 0,
      updated_at: null,
      deleted_at: null,
    }),
  );
  await page.route("**/hands?*", (route) =>
    route.fulfill({ json: { hands: [hand], nextCursor: null } }),
  );
  await page.route("**/hands/redesign-fixture", (route) =>
    route.fulfill({ json: { hand, players, actions } }),
  );
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("/hands/library");
  await page.getByRole("button", { name: "Replay hand", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Hand replay table" }),
  ).toBeVisible();
  await expect(page.locator(".seat-winner")).toHaveCount(0);
  for (let i = 0; i < actions.length; i++)
    await page
      .getByRole("button", { name: "Step forward", exact: true })
      .click();
  await expect(page.locator(".seat-winner")).toHaveCount(1);
  await expect(page.locator(".seat-winner")).toContainText("Alex");
  await expect(
    page.getByRole("img", { name: "Board card: 3 of Hearts", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("replay.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("replay-mobile.png"),
    fullPage: true,
  });
});
