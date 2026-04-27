import { defineConfig, devices } from "@playwright/test";

// Smoke tests for ChessWhiz. Aimed at catching regressions in the
// critical user paths — landing → onboard → play, kingdom navigation,
// and the upgrade-modal flow. Not exhaustive E2E coverage.

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "line" : "list",

  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },

  // Spin up the dev server when running locally; in CI you'd already
  // have a deployed preview URL.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "iphone-15",
      use: { ...devices["iPhone 15"] },
    },
  ],
});
