import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:4321";

export default defineConfig({
  testDir: "tests/e2e",
  retries: process.env.CI ? 1 : 0,
  use: { baseURL, trace: "on-first-retry" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // sans BASE_URL, on teste le serveur de dev local (exactOptionalPropertyTypes interdit webServer: undefined)
  ...(process.env.BASE_URL
    ? {}
    : { webServer: { command: "pnpm dev --port 4321", url: baseURL, reuseExistingServer: !process.env.CI } }),
});
