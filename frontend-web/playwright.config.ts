import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — apenas Chromium em CI; em dev o usuário pode
 * adicionar browsers manualmente (npx playwright install).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // single-worker pra evitar conflitos de DB
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.CI
    ? {
        command: "npm run build && npm run start",
        url: "http://localhost:3000",
        timeout: 120_000,
        reuseExistingServer: false,
      }
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        timeout: 120_000,
        reuseExistingServer: true,
      },
});
