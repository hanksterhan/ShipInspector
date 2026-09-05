import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import type { TableView } from "../../common/src/interfaces/tableInterfaces";

const apiUrl = process.env.VITE_API_URL || "http://localhost:3000";
test.use({ actionTimeout: 12000 });
async function api(
  page: Page,
  path: string,
  method = "GET",
  body?: unknown,
): Promise<{ status: number; data: TableView }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.waitForFunction(() => !!(window as any).Clerk?.session);
  return page.evaluate(
    async ({ apiUrl, path, method, body }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = await (window as any).Clerk.session.getToken();
      const response = await fetch(apiUrl + path, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return { status: response.status, data: await response.json() };
    },
    { apiUrl, path, method, body },
  );
}
async function ticketSignIn(page: Page, userId: string) {
  const response = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId, expires_in_seconds: 300 }),
  });
  if (!response.ok) throw new Error(`Test sign-in failed: ${response.status}`);
  const { token } = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.waitForFunction(() => !!(window as any).Clerk?.loaded);
  await page.evaluate(async (ticket) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clerk = (window as any).Clerk;
    const result = await clerk.client.signIn.create({
      strategy: "ticket",
      ticket,
    });
    await clerk.setActive({ session: result.createdSessionId });
  }, token);
}
async function createInBrowser(page: Page, name: string, takeSeat = true) {
  await page.goto("/tables");
  await page.getByRole("button", { name: "Create table", exact: true }).click();
  await page.getByLabel("Table name", { exact: true }).fill(name);
  await page
    .getByRole("combobox", { name: "Seats", exact: true })
    .selectOption("2");
  await page.getByLabel("Take a seat", { exact: true }).setChecked(takeSeat);
  if (takeSeat)
    await page.getByLabel("Your name", { exact: true }).fill("Alice");
  await page.getByRole("button", { name: "Open table", exact: true }).click();
  await expect(page).toHaveURL(/\/tables\/[0-9a-f-]{36}/);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  return page.url().split("/").pop()!;
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("two signed-in people play from desktop and mobile, reconnect, and finish a hand", async ({
  page,
  browser,
}, info) => {
  test.setTimeout(90000);
  if (!process.env.CLERK_SECRET_KEY?.startsWith("sk_test_"))
    throw new Error(
      "Multiplayer browser tests require a Clerk development instance.",
    );
  const createUser = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: [`poker-${randomUUID()}+clerk_test@example.com`],
      skip_password_requirement: true,
      first_name: "Bob",
    }),
  });
  if (!createUser.ok) {
    const detail = await createUser.json();
    throw new Error(
      `Could not create the temporary test player: ${createUser.status}; ${detail.errors?.map((e: { code: string; message: string }) => `${e.code}: ${e.message}`).join("; ")}`,
    );
  }
  const secondUserId = (await createUser.json()).id;
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    storageState: { cookies: [], origins: [] },
  });
  const mobile = await mobileContext.newPage();
  let id = "";
  try {
    await page.setViewportSize({ width: 1440, height: 1080 });
    id = await createInBrowser(page, "Friday with friends");
    await mobile.goto(`http://localhost:4000/tables/${id}`);
    await expect(mobile).toHaveURL(/returnTo=/);
    await ticketSignIn(mobile, secondUserId);
    await expect(
      mobile.getByRole("heading", { name: "Take your seat" }),
    ).toBeVisible();
    await mobile.getByLabel("Your name", { exact: true }).fill("Bob");
    await mobile
      .getByRole("button", { name: "Join table", exact: true })
      .click();
    await expect(
      mobile.getByRole("heading", { name: "Friday with friends" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "I’m ready" }).click();
    await mobile.getByRole("button", { name: "I’m ready" }).click();
    await expect(
      mobile.getByText("You’re ready", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Deal hand", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Call 5", exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('.live-seat[data-seat="0"] .card-face'),
    ).toHaveCount(2);
    await expect(
      page.locator('.live-seat[data-seat="1"] .live-card-back'),
    ).toHaveCount(2);
    await expect(
      mobile.locator('.live-seat[data-seat="0"] .live-card-back'),
    ).toHaveCount(2);
    await expect(
      mobile.locator('.live-seat[data-seat="1"] .card-face'),
    ).toHaveCount(2);
    await expect(
      page.locator('.live-seat[data-seat="0"] .live-seat-positions'),
    ).toHaveText("DealerSmall blind");
    await expect(
      page.locator('.live-seat[data-seat="1"] .live-seat-positions'),
    ).toHaveText("Big blind");
    await expect(
      page.locator('.live-seat[data-seat="0"] .live-seat-bet'),
    ).toHaveText("Preflop bet5");
    await expect(
      mobile.locator('.live-seat[data-seat="1"] .live-seat-bet'),
    ).toHaveText("Preflop bet10");
    await page.screenshot({
      path: info.outputPath("desktop-live-table.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Call 5", exact: true }).click();
    await expect(
      mobile.getByRole("button", { name: "Check", exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('.live-seat[data-seat="0"] .live-seat-bet'),
    ).toHaveText("Preflop bet10");
    await noOverflow(mobile);
    await mobile.evaluate(() => window.scrollTo(0, 0));
    const actionBounds = await mobile.locator(".your-action").boundingBox();
    expect(actionBounds!.y + actionBounds!.height).toBeLessThanOrEqual(844);
    await mobile.screenshot({ path: info.outputPath("mobile-viewport.png") });
    await mobile.screenshot({
      path: info.outputPath("mobile-your-turn.png"),
      fullPage: true,
    });
    await mobile.reload();
    await expect(
      mobile.getByRole("button", { name: "Check", exact: true }),
    ).toBeVisible();
    await mobile.getByRole("button", { name: "Check", exact: true }).click();
    await expect(page.locator(".live-hand-status")).toContainText("Flop");
    await mobile.getByRole("button", { name: "Bet", exact: true }).click();
    await mobile.getByLabel("Bet", { exact: true }).fill("40");
    await mobile.getByRole("button", { name: "Bet 40", exact: true }).click();
    await expect(
      page.locator('.live-seat[data-seat="1"] .live-seat-bet'),
    ).toHaveText("Flop bet40");
    await expect(
      page.locator('.live-seat[data-seat="0"] .live-seat-bet'),
    ).toHaveText("Flop bet0");
    await expect(
      page.locator('.live-seat[data-seat="1"] .position-big-blind'),
    ).toHaveText("Big blind");
    await page.screenshot({
      path: info.outputPath("desktop-flop-bets.png"),
      fullPage: true,
    });
    await mobile.screenshot({
      path: info.outputPath("mobile-flop-bets.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Call 40", exact: true }).click();
    for (const street of ["Turn", "River"]) {
      await expect(page.locator(".live-hand-status")).toContainText(street);
      await expect(
        page.locator('.live-seat[data-seat="0"] .live-seat-bet'),
      ).toHaveText(`${street} bet0`);
      await expect(
        page.locator('.live-seat[data-seat="1"] .live-seat-bet'),
      ).toHaveText(`${street} bet0`);
      await mobile.getByRole("button", { name: "Check", exact: true }).click();
      await page.getByRole("button", { name: "Check", exact: true }).click();
    }
    await expect(page.locator(".live-result")).toBeVisible();
    await expect(mobile.locator(".live-result")).toBeVisible();
    await expect(page.locator(".live-seat.is-winner")).not.toHaveCount(0);
    const state = (await api(page, `/tables/${id}`)).data;
    expect(state.seats.reduce((sum, s) => sum + s.stack, 0)).toBe(2000);
    expect(state.board).toHaveLength(5);
    await noOverflow(page);
    await noOverflow(mobile);
    await page.screenshot({
      path: info.outputPath("desktop-winner.png"),
      fullPage: true,
    });
    await mobile.screenshot({
      path: info.outputPath("mobile-winner.png"),
      fullPage: true,
    });
    await mobile.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await mobile
        .locator(".live-result")
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("none");
    await mobile
      .getByRole("button", { name: "Leave seat", exact: true })
      .click();
    await expect(
      mobile.getByRole("button", { name: "Take a seat", exact: true }),
    ).toBeVisible();
  } finally {
    try {
      if (id && !page.isClosed()) {
        const { data } = await api(page, `/tables/${id}`);
        if (["waiting", "complete"].includes(data.street))
          await api(page, `/tables/${id}/commands`, "POST", {
            version: data.version,
            requestId: randomUUID(),
            command: { type: "close" },
          });
      }
    } catch {
      /* Keep cleanup from hiding the original browser failure. */
    }
    await mobileContext.close().catch(() => {});
    const removed = await fetch(
      `https://api.clerk.com/v1/users/${secondUserId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
      },
    );
    expect(removed.ok).toBe(true);
  }
});

test("eight agents play an all-in hand with desktop and mobile table layouts", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  await page.goto("/tables");
  let view = (
    await api(page, "/api/tables", "POST", {
      settings: {
        name: "Eight-player table",
        maxPlayers: 8,
        smallBlind: 5,
        bigBlind: 10,
        startingStack: 1000,
        turnSeconds: 60,
      },
    })
  ).data;
  const tokens: string[] = [];
  for (let i = 0; i < 8; i++) {
    const issued = await page.evaluate(
      async ({ apiUrl, id, version, i, requestId }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const token = await (window as any).Clerk.session.getToken();
        const response = await fetch(`${apiUrl}/api/tables/${id}/agents`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ version, name: `Agent ${i + 1}`, requestId }),
        });
        if (!response.ok)
          throw new Error(`Reserve agent failed: ${response.status}`);
        return response.json();
      },
      {
        apiUrl,
        id: view.id,
        version: view.version,
        i,
        requestId: randomUUID(),
      },
    );
    tokens.push(issued.token);
    view = issued.table;
  }
  const command = async (index: number, action: Record<string, unknown>) => {
    const response = await fetch(`${apiUrl}/api/tables/${view.id}/commands`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens[index]}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: view.version,
        requestId: randomUUID(),
        command: action,
      }),
    });
    expect(response.status).toBe(200);
    view = await response.json();
  };
  for (let i = 0; i < 8; i++) await command(i, { type: "ready", ready: true });
  await command(0, { type: "deal" });
  await page.goto(`/tables/${view.id}`);
  await page.setViewportSize({ width: 1440, height: 1050 });
  await expect(page.locator(".live-card-back")).toHaveCount(16);
  await noOverflow(page);
  await page.screenshot({
    path: info.outputPath("desktop-eight-players.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
  await page.screenshot({
    path: info.outputPath("mobile-eight-players.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.locator(".live-hand-status").click();
  await command(view.actor!, { type: "act", action: "raise", raiseTo: 1000 });
  let count = 0;
  while (view.street !== "complete" && count++ < 8)
    await command(view.actor!, { type: "act", action: "call" });
  await expect(page.locator(".live-result")).toBeVisible();
  expect(view.seats.reduce((sum, seat) => sum + seat.stack, 0)).toBe(8000);
  await expect(page.locator(".live-board .card-face")).toHaveCount(5);
  await expect(page.locator(".live-hole-cards .card-face")).toHaveCount(16);
  const winnerDuration = await page
    .locator(".live-seat.is-winner")
    .first()
    .evaluate((el) => getComputedStyle(el).animationDuration);
  expect(winnerDuration).toBe("0.65s");
  await page.screenshot({
    path: info.outputPath("desktop-eight-showdown.png"),
    fullPage: true,
  });
  const current = (await api(page, `/api/tables/${view.id}`)).data;
  await api(page, `/api/tables/${view.id}/commands`, "POST", {
    version: current.version,
    requestId: randomUUID(),
    command: { type: "close" },
  });
});

test("host reserves agent seats, eight-seat mobile layout fits, and access is revoked", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tables");
  await page.getByRole("button", { name: "Create table", exact: true }).click();
  await page.getByLabel("Table name", { exact: true }).fill("Agent arena");
  await page
    .getByRole("combobox", { name: "Seats", exact: true })
    .selectOption("8");
  await page.getByLabel("Take a seat", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Open table", exact: true }).click();
  await expect(page).toHaveURL(/\/tables\/[0-9a-f-]{36}/);
  await page.getByRole("button", { name: "Agent seats", exact: true }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Agent name", { exact: true }).fill("Riverbot");
  await sheet
    .getByRole("button", { name: "Reserve seat", exact: true })
    .click();
  await expect(
    sheet.getByText("Save this credential now", { exact: true }),
  ).toBeVisible();
  const token = await sheet
    .getByLabel("Agent credential", { exact: true })
    .inputValue();
  const id = page.url().split("/").pop()!;
  const response = await fetch(`${apiUrl}/tables/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status).toBe(200);
  const view = await response.json();
  expect(view.yourSeat).toBe(0);
  expect(view.isOwner).toBe(false);
  await sheet.getByRole("button", { name: "Dismiss", exact: true }).click();
  await sheet.locator("summary").click();
  await noOverflow(page);
  await page.screenshot({
    path: info.outputPath("mobile-agent-setup.png"),
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Agent seats", exact: true }),
  ).toBeFocused();
  await noOverflow(page);
  await page.screenshot({
    path: info.outputPath("mobile-eight-seat-table.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Agent seats", exact: true }).click();
  await page.getByRole("button", { name: "Revoke", exact: true }).click();
  await expect(page.getByText("Revoked", { exact: true })).toBeVisible();
  expect(
    (
      await fetch(`${apiUrl}/tables/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).status,
  ).toBe(401);
  await page.getByRole("button", { name: "Close table", exact: true }).click();
  await expect(
    page.getByText("This table is closed", { exact: true }),
  ).toBeVisible();
});
