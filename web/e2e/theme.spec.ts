import { expect, test } from "./fixtures";

/** Light, Dark and System: light on a first visit even when the system is dark, and a choice that stays. */

test.use({ viewport: { width: 1280, height: 800 }, theme: "unset" });

const page_colour = (page: import("@playwright/test").Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.describe("first visit", () => {
  test.use({ colorScheme: "dark" });
  test("is light, though the system is dark", async ({ page }) => {
    await page.goto("/lantern/account");
    await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(await page_colour(page)).toBe("rgb(246, 242, 236)");
  });
});

test("the switch gives Dark, System and Light, and keeps the choice", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/lantern/account");
  const html = page.locator("html");
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  expect(await page_colour(page)).toBe("rgb(20, 17, 15)");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.getByRole("radio", { name: "System" }).click();
  await expect(html).toHaveAttribute("data-theme", "system");
  expect(await page_colour(page)).toBe("rgb(20, 17, 15)");
  await page.emulateMedia({ colorScheme: "light" });
  expect(await page_colour(page)).toBe("rgb(246, 242, 236)");

  await page.getByRole("radio", { name: "Light" }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
});
