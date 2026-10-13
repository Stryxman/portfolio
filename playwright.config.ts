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
  // sans BASE_URL, on teste le serveur de dev local (exactOptionalPropertyTypes interdit webServer: undefined).
  // --ignore-lock : Astro 7 passe sinon le serveur en arrière-plan quand il détecte un agent IA.
  ...(process.env.BASE_URL
    ? {}
    : { webServer: { command: "pnpm exec astro dev --port 4321 --ignore-lock", url: baseURL, reuseExistingServer: !process.env.CI } }),
});
