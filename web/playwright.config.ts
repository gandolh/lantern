import { defineConfig } from "@playwright/test";

/**
 * The page's browser tests: headless Chromium against a running page (`LANTERN_URL`, the dev server by default) whose
 * API has a seeded local account (`LANTERN_DEMO_USER` and `LANTERN_DEMO_PASSWORD`). Every title and score on screen is
 * a stub of the specs' own (e2e/data.ts), so nothing depends on the database's titles and no outside call is made.
 *
 *     LANTERN_DEMO_PASSWORD=... npx playwright test --workers=2   (from web/)
 */
export default defineConfig({
  testDir: "e2e",
  workers: 2,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.LANTERN_URL ?? "http://localhost:5180",
    browserName: "chromium",
    trace: "off",
  },
});
