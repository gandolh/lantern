import { test as plain, type Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/**
 * Screenshots of the states the data stubs never reach: loading, empty, error and not found, the rate page leaving, a
 * focused tab, and the gate's states. Written to SHOTS_DIR; with it unset the spec is skipped.
 */
const dir = process.env.SHOTS_DIR;
const SIZES = [
  { width: 1280, height: 800, theme: "dark" },
  { width: 390, height: 844, theme: "light" },
] as const;

const fail = (status: number, code: string, message: string) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify({ code, message }),
});
/** A request that never answers, so the page stays in its loading state. */
const hang = () => new Promise<void>(() => undefined);

async function shoot(page: Page, name: string, size: { width: number; theme: string }) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${dir}/state-${name}-${size.theme}-${size.width}.png`, fullPage: true });
}

for (const size of SIZES) {
  test.describe(`states ${size.theme} ${size.width}`, () => {
    test.skip(!dir, "SHOTS_DIR is not set");
    test.use({ theme: size.theme, viewport: { width: size.width, height: size.height } });

    test("suggestions: error, empty, nothing left and loading", async ({ page }) => {
      await page.route("**/lantern-api/v1/suggestions*", (route) =>
        route.fulfill(fail(500, "internal", "The server failed.")),
      );
      await page.goto("/lantern/");
      await expect(page.getByText("Couldn’t load suggestions.")).toBeVisible();
      await shoot(page, "suggestions-error", size);

      await page.unroute("**/lantern-api/v1/suggestions*");
      await page.route("**/lantern-api/v1/suggestions*", (route) =>
        route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ suggestions: [], rated: 0, liked: 0 }),
        }),
      );
      await page.reload();
      await expect(page.getByText(/Rate a few titles you liked/)).toBeVisible();
      await shoot(page, "suggestions-empty", size);

      await page.unroute("**/lantern-api/v1/suggestions*");
      await page.route("**/lantern-api/v1/suggestions*", (route) =>
        route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ suggestions: [], rated: 3, liked: 2 }),
        }),
      );
      await page.reload();
      await expect(page.getByText(/Nothing left to suggest/)).toBeVisible();
      await shoot(page, "suggestions-nothing-left", size);

      await page.unroute("**/lantern-api/v1/suggestions*");
      await page.route("**/lantern-api/v1/suggestions*", hang);
      await page.reload();
      await expect(page.getByText("Loading…")).toBeVisible();
      await shoot(page, "suggestions-loading", size);
    });

    test("title: no key, not in the list, error and loading", async ({ page }) => {
      await page.route("**/lantern-api/v1/titles/tt9100023/record", (route) =>
        route.fulfill(fail(503, "no_key", "OMDb has no key: set OMDB_API_KEY in .env")),
      );
      await page.goto("/lantern/title/tt9100023");
      await expect(page.getByText(/need OMDb’s key/)).toBeVisible();
      await shoot(page, "title-no-key", size);

      await page.goto("/lantern/title/tt9999999");
      await expect(page.getByRole("heading", { name: "Not in Lantern’s list" })).toBeVisible();
      await shoot(page, "title-not-in-list", size);

      await page.route("**/lantern-api/v1/titles/tt9100025", (route) =>
        route.fulfill(fail(500, "internal", "The title didn’t come back.")),
      );
      await page.goto("/lantern/title/tt9100025");
      await expect(page.getByRole("heading", { name: "Couldn’t load this title" })).toBeVisible();
      await shoot(page, "title-error", size);

      await page.route("**/lantern-api/v1/titles/tt9100036**", hang);
      await page.goto("/lantern/title/tt9100036");
      await expect(page.getByText("Loading…")).toBeVisible();
      await shoot(page, "title-loading", size);
    });

    test("rate: dealing, nothing left, error, leaving", async ({ page }) => {
      await page.route("**/lantern-api/v1/cards*", hang);
      await page.goto("/lantern/rate");
      await expect(page.getByText("Dealing…")).toBeVisible();
      await shoot(page, "rate-dealing", size);

      await page.unroute("**/lantern-api/v1/cards*");
      await page.route("**/lantern-api/v1/cards*", (route) =>
        route.fulfill({ contentType: "application/json", body: JSON.stringify({ cards: [] }) }),
      );
      await page.reload();
      await expect(page.getByText(/No more cards/)).toBeVisible();
      await shoot(page, "rate-exhausted", size);

      await page.unroute("**/lantern-api/v1/cards*");
      await page.route("**/lantern-api/v1/cards*", (route) =>
        route.fulfill(fail(500, "internal", "The server failed.")),
      );
      await page.reload();
      await expect(page.getByText(/Couldn’t deal cards/)).toBeVisible();
      await shoot(page, "rate-error", size);

      await page.unroute("**/lantern-api/v1/cards*");
      await page.reload();
      await expect(page.getByRole("heading", { name: "Amber Border" })).toBeVisible();
      await page.getByRole("button", { name: "Skip" }).click();
      await page.screenshot({ path: `${dir}/state-rate-leaving-${size.theme}-${size.width}.png` });
    });

    test("ratings: not interested, and a focused tab", async ({ page }) => {
      await page.goto("/lantern/ratings");
      await expect(page.getByRole("tab", { name: /^All/ })).toBeVisible();
      await page.getByRole("tab", { name: /^Not interested/ }).click();
      await expect(page.getByText("Nothing marked not interested.")).toBeVisible();
      await shoot(page, "ratings-not-interested", size);

      await page.getByRole("tab", { name: /^All/ }).click();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await page.getByRole("tab", { name: /^All/ }).focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await shoot(page, "ratings-tab-focus", size);
    });
  });
}

plain.describe("the gate", () => {
  plain.skip(!dir, "SHOTS_DIR is not set");
  for (const size of SIZES) {
    plain(`loading and unreachable, ${size.theme} ${size.width}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.addInitScript((value) => localStorage.setItem("theme", value), size.theme);
      await page.route("**/lantern-api/auth/session", hang);
      await page.goto("/lantern/");
      await expect(page.getByText("Loading…")).toBeVisible();
      await shoot(page, "gate-loading", size);

      await page.unroute("**/lantern-api/auth/session");
      await page.route("**/lantern-api/auth/session", (route) => route.abort());
      await page.reload();
      await expect(page.getByText(/can’t be reached/)).toBeVisible();
      await shoot(page, "gate-unreachable", size);
    });
  }
});
