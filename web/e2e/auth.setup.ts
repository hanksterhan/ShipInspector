import { test as setup } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const thisDir = dirname(fileURLToPath(import.meta.url));
const STORAGE_STATE_PATH = join(thisDir, ".auth", "storage-state.json");
const TEST_USER_ID = "user_39OwkE873fI5GYnqYefsQHBcI7v";

setup("authenticate via Clerk", async ({ page }) => {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    setup.skip(!secretKey, "CLERK_SECRET_KEY not set");
    return;
  }

  // Step 1: Create a sign-in token via Clerk Backend API
  const res = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: TEST_USER_ID,
      expires_in_seconds: 300,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(
      `Failed to create sign-in token: ${JSON.stringify(error)}`,
    );
  }

  const signInToken = await res.json();

  // Step 2: Navigate to our app's sign-in page
  await page.goto("/");

  // Step 3: Wait for Clerk to fully load in the browser
  await page.waitForFunction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => !!(window as any).Clerk?.loaded,
    undefined,
    { timeout: 15000 },
  );

  // Step 4: Sign in using the ticket strategy via Clerk's frontend SDK
  await page.evaluate(async (ticket) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clerk = (window as any).Clerk;
    const result = await clerk.client.signIn.create({
      strategy: "ticket",
      ticket,
    });
    if (result.status === "complete") {
      await clerk.setActive({ session: result.createdSessionId });
    }
  }, signInToken.token);

  // Step 5: Wait for sign-in redirect to authenticated page
  await page.waitForURL("**/equity-calculator", { timeout: 15000 });

  // Step 6: Save storage state for use by test projects
  mkdirSync(dirname(STORAGE_STATE_PATH), { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
