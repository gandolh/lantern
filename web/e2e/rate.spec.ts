import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/** The rating cards: the keys, the buttons and the swipes still do what they did. */

test.use({ viewport: { width: 1280, height: 800 } });

/** The state and skip writes the page makes, as `METHOD /path body`. */
function recordWrites(page: Page): string[] {
  const writes: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (request.method() !== "GET" && /\/titles\/tt\d+\/(state|skip)$/.test(url.pathname)) {
      writes.push(
        `${request.method()} ${url.pathname.replace(/^.*\/titles\//, "")} ${request.postData() ?? ""}`.trim(),
      );
    }
  });
  return writes;
}

async function dragCard(page: Page, dx: number, dy: number) {
  const card = page.locator(".touch-none").first();
  const box = await card.boundingBox();
  if (!box) throw new Error("no card");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 4 });
  await page.mouse.move(x + dx, y + dy, { steps: 4 });
  await page.mouse.up();
}

test("the number keys rate, the arrows swipe and Z undoes", async ({ page }) => {
  const writes = recordWrites(page);
  await page.goto("/lantern/rate");
  await expect(page.getByRole("heading", { name: "Amber Border" })).toBeVisible();

  await page.keyboard.press("3");
  await expect(page.getByRole("heading", { name: "Paper Foundry" })).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("heading", { name: "Open Hollow" })).toBeVisible();
  await page.keyboard.press("ArrowUp");
  await expect(page.getByText(/No more cards/)).toBeVisible();
  await page.keyboard.press("z");
  await expect(page.getByRole("heading", { name: "Open Hollow" })).toBeVisible();

  expect(writes).toEqual([
    'PUT tt9100025/state {"state":"good"}',
    'PUT tt9100036/state {"state":"not_interested"}',
    "POST tt9100037/skip",
    "DELETE tt9100037/skip",
  ]);
});

test("a swipe commits right, left and up", async ({ page }) => {
  const writes = recordWrites(page);
  await page.goto("/lantern/rate");
  await expect(page.getByRole("heading", { name: "Amber Border" })).toBeVisible();

  await dragCard(page, 200, 0);
  await expect(page.getByRole("heading", { name: "Paper Foundry" })).toBeVisible();
  await dragCard(page, -200, 0);
  await expect(page.getByRole("heading", { name: "Open Hollow" })).toBeVisible();
  await dragCard(page, 0, -200);
  await expect(page.getByText(/No more cards/)).toBeVisible();

  expect(writes).toEqual([
    'PUT tt9100025/state {"state":"want_to_watch"}',
    'PUT tt9100036/state {"state":"not_interested"}',
    "POST tt9100037/skip",
  ]);
});

test("a short drag snaps back and commits nothing", async ({ page }) => {
  const writes = recordWrites(page);
  await page.goto("/lantern/rate");
  await expect(page.getByRole("heading", { name: "Amber Border" })).toBeVisible();
  await dragCard(page, 60, 0);
  await page.waitForTimeout(300);
  await expect(page.getByRole("heading", { name: "Amber Border" })).toBeVisible();
  expect(writes).toEqual([]);
});

test("the keycaps show on a wide page only", async ({ page }) => {
  await page.goto("/lantern/rate");
  await expect(page.getByRole("heading", { name: "Amber Border" })).toBeVisible();
  await expect(page.getByText("4", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByText("4", { exact: true })).toBeHidden();
});
