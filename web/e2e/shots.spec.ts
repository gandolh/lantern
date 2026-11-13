import { test as plain } from "@playwright/test";
import { SCREENS, expect, test } from "./fixtures";

/**
 * Screenshots of every screen at 1280 and 390, light and dark, for comparing the build with the comps. They are
 * written to SHOTS_DIR, outside the repo; with it unset the spec is skipped.
 *
 *     SHOTS_DIR=/some/folder LANTERN_DEMO_PASSWORD=... npx playwright test shots --workers=2
 */
const dir = process.env.SHOTS_DIR;
const WIDTHS = [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
] as const;

for (const theme of ["light", "dark"] as const) {
  for (const size of WIDTHS) {
    test.describe(`${theme} ${size.width}`, () => {
      test.skip(!dir, "SHOTS_DIR is not set");
      test.use({ theme, viewport: size });

      for (const screen of SCREENS) {
        test(screen.name, async ({ page }) => {
          await page.goto(screen.path);
          await expect(
            page.getByRole("heading", { name: screen.ready }).or(page.getByLabel(screen.ready)).first(),
          ).toBeVisible();
          // The type, the stubs and the tiles settle.
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(400);
          await page.screenshot({ path: `${dir}/${screen.name}-${theme}-${size.width}.png`, fullPage: true });
        });
      }

      test("undo notice", async ({ page }) => {
        await page.goto("/lantern/watchlist");
        await expect(page.getByRole("heading", { name: "Little Clock" })).toBeVisible();
        await page.getByRole("button", { name: "Good" }).first().click();
        await expect(page.getByRole("status")).toBeVisible();
        await page.waitForTimeout(300);
        await page.screenshot({ path: `${dir}/undo-notice-${theme}-${size.width}.png`, fullPage: true });
      });

      test("rate mid-swipe", async ({ page }) => {
        await page.goto("/lantern/rate");
        await expect(page.getByRole("heading", { name: "Amber Border" })).toBeVisible();
        const card = page
          .getByRole("heading", { name: "Amber Border" })
          .locator("xpath=ancestor::div[contains(@class,'touch-none')]");
        const box = await card.boundingBox();
        if (!box) throw new Error("no card");
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 4, { steps: 4 });
        await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 6, { steps: 4 });
        await page.screenshot({ path: `${dir}/rate-swipe-${theme}-${size.width}.png` });
        await page.mouse.up();
      });
    });
  }
}

plain.describe("signed out", () => {
  plain.skip(!dir, "SHOTS_DIR is not set");
  for (const theme of ["light", "dark"] as const) {
    for (const size of WIDTHS) {
      plain(`login ${theme} ${size.width}`, async ({ browser }) => {
        const context = await browser.newContext({ viewport: size });
        await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
        const page = await context.newPage();
        await page.goto("/lantern/");
        await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: `${dir}/login-${theme}-${size.width}.png`, fullPage: true });
        await page.getByRole("button", { name: "Sign in" }).click();
        await expect(page.getByText("Enter your username.")).toBeVisible();
        await page.screenshot({ path: `${dir}/login-error-${theme}-${size.width}.png`, fullPage: true });
        await context.close();
      });
    }
  }
});
