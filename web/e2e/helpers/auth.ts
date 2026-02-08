import { Page } from "@playwright/test";

/**
 * Helper to authenticate a test user via Clerk.
 * In CI, this should use Clerk's testing tokens.
 * For local development, relies on existing session cookies.
 */
export async function signIn(page: Page): Promise<void> {
  // Clerk testing mode: set the test session token via cookies/localStorage
  // For now, bypass auth by checking if CLERK_TESTING_TOKEN is set
  const testToken = process.env.CLERK_TESTING_TOKEN;
  if (testToken) {
    // Use Clerk's testing mode
    await page.goto("/");
    await page.evaluate((token) => {
      window.localStorage.setItem("__clerk_testing_token", token);
    }, testToken);
    await page.reload();
    await page.waitForURL(/\/(equity-calculator|hands)/);
  } else {
    // Local dev: navigate and assume session exists
    await page.goto("/");
    // If redirected to sign-in, wait for user to handle it
    if (page.url().includes("/signin")) {
      console.warn(
        "No CLERK_TESTING_TOKEN set. Please sign in manually or set the env var.",
      );
    }
  }
}
