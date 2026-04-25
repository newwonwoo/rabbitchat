// Playwright config skeleton. Devs run:
//   npm i -D @playwright/test && npx playwright install
//   npx playwright test
//
// Tests live in e2e/. The first scenario covers harness §18 (10 steps).
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "android-chrome-tablet",
      use: { ...devices["Galaxy Tab S4"] },
    },
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
