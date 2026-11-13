import { test as plain, type Page } from "@playwright/test";
import { SCREENS, expect, test } from "./fixtures";

/** The checks every screen answers to: a focus ring on every stop, nothing moving under reduced motion, no sideways scroll on a phone. */

async function ready(page: Page, name: string) {
  await expect(page.getByRole("heading", { name }).or(page.getByLabel(name)).first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

/** Tabs through the page and returns every stop that shows no ring (an outline of 2 px or more that isn't transparent). */
async function stopsWithoutRing(page: Page): Promise<string[]> {
  const bare: string[] = [];
  let stops = 0;
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (let stop = 0; stop < 80; stop++) {
    await page.keyboard.press("Tab");
    const state = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      const ring =
        style.outlineStyle !== "none" &&
        parseFloat(style.outlineWidth) >= 2 &&
        style.outlineColor !== "rgba(0, 0, 0, 0)";
      return {
        ring,
        name: `${el.tagName.toLowerCase()} ${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 30)}`,
        id: el.outerHTML.slice(0, 80),
      };
    });
    if (state === null) break;
    stops++;
    if (!state.ring) bare.push(state.name);
  }
  // A page with nothing to tab to would pass for the wrong reason.
  expect(stops).toBeGreaterThanOrEqual(2);
  return bare;
}

test.describe("focus ring", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  for (const screen of SCREENS) {
    test(screen.name, async ({ page }) => {
      await page.goto(screen.path);
      await ready(page, screen.ready);
      expect(await stopsWithoutRing(page)).toEqual([]);
    });
  }
});

plain("focus ring: the login page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/lantern/");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  expect(await stopsWithoutRing(page)).toEqual([]);
});

test.describe("reduced motion", () => {
  test.use({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  for (const screen of SCREENS) {
    test(screen.name, async ({ page }) => {
      await page.goto(screen.path);
      await ready(page, screen.ready);
      const moving = await page.evaluate(() => {
        const offenders: string[] = [];
        if (document.getAnimations().length > 0) offenders.push("a running animation or transition");
        for (const el of document.querySelectorAll("*")) {
          const style = getComputedStyle(el);
          const properties = style.transitionProperty.split(",").map((p) => p.trim());
          const durations = style.transitionDuration
            .split(",")
            .map((d) => parseFloat(d) * (d.trim().endsWith("ms") ? 1 : 1000));
          properties.forEach((property, i) => {
            const duration = durations[i % durations.length] ?? 0;
            if (duration > 0 && property !== "opacity")
              offenders.push(`${el.tagName.toLowerCase()} ${property} ${duration}ms`);
          });
          if (style.animationName !== "none" && parseFloat(style.animationDuration) > 0)
            offenders.push(`${el.tagName.toLowerCase()} ${style.animationName}`);
        }
        return offenders;
      });
      expect(moving).toEqual([]);
    });
  }

  test("the swipe card only fades", async ({ page }) => {
    await page.goto("/lantern/rate");
    await ready(page, "Rate");
    await page.getByRole("button", { name: "Skip" }).click();
    const transforms = await page.evaluate(() =>
      document
        .getAnimations()
        .filter(
          (a): a is CSSTransition => a instanceof CSSTransition && ["transform", "all"].includes(a.transitionProperty),
        )
        .map((a) => a.transitionProperty),
    );
    expect(transforms).toEqual([]);
  });
});

test.describe("no sideways scroll at 390", () => {
  for (const theme of ["light", "dark"] as const) {
    test.describe(theme, () => {
      test.use({ viewport: { width: 390, height: 844 }, theme });
      for (const screen of SCREENS) {
        test(screen.name, async ({ page }) => {
          await page.goto(screen.path);
          await ready(page, screen.ready);
          const widths = await page.evaluate(() => ({
            scroll: document.documentElement.scrollWidth,
            inner: window.innerWidth,
          }));
          expect(widths.scroll).toBeLessThanOrEqual(widths.inner);
        });
      }
    });
  }

  plain("the login page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/lantern/");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.inner);
  });
});
