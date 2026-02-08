import { defineConfig, devices } from "@playwright/test";

// Skip E2E tests unless CLERK_TESTING_TOKEN is set or running in CI
// This prevents 401 errors when running without authentication
const skipProject = !process.env.CLERK_TESTING_TOKEN && !process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      skip: skipProject,
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:4000",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
