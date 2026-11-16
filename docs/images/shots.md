# README images

How each image was made, so the next refresh is a re-run. Retake an image when the screen it shows
changes.

| File | Shows | How to reach that state | Viewport | Data | Taken |
|---|---|---|---|---|---|
| hero.webp | Suggestions, the home page, in the light theme | `/lantern/`, signed in | 1440×900 @2x | stand-ins from `web/e2e/data.ts` | 2026-11-16 |
| rate-phone.webp | Rate: the card, the swipe hint, the four rating steps and the three actions above the tab bar | `/lantern/rate`, scrolled down 70 px so the swipe hint clears the pinned controls | iPhone 14 (390×664 @3x) | same | 2026-11-16 |
| title-phone.webp | A title rated meh: the facts, the verdict panel and the start of the plot | `/lantern/title/tt9100023` | iPhone 14 (390×664 @3x) | same | 2026-11-16 |

## Capture method

Nothing on screen comes from IMDb or OMDb. The app ran locally with no `OMDB_API_KEY`, an empty
scratch database and one seeded local account:

```bash
export DEMO_PASS=$(openssl rand -hex 12)              # never written to a file
LANTERN_DB=/tmp/shots/lantern.sqlite SEED_USERNAME=demo SEED_PASSWORD="$DEMO_PASS" npm run seed -w @lantern/server
npx tsc -b shared
PORT=<api> PUBLIC_ORIGIN=http://localhost:<page> LANTERN_DB=/tmp/shots/lantern.sqlite npm run dev -w @lantern/server
PORT=<api> PUBLIC_ORIGIN=http://localhost:<page> npm run dev -w @lantern/web -- --port <page> --strictPort
```

A Playwright spec kept outside the repo took the shots. It uses `test` from `web/e2e/fixtures.ts`,
which signs in as the seeded account and answers `/lantern-api/v1/**` with the invented titles in
`web/e2e/data.ts`. The poster route answers 404, so every poster is a type-set tile. Each shot waited
for the heading, `document.fonts.ready` and 800 ms, then took the viewport (not the full page), in the
default light theme and the Europe/Bucharest time zone:

```ts
import { test, expect } from "<repo>/web/e2e/fixtures.ts";

test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }); // phone: devices["iPhone 14"] minus defaultBrowserType
test("hero", async ({ page }) => {
  await page.goto("/lantern/");
  await expect(page.getByLabel("Suggested titles")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${process.env.SHOTS_DIR}/hero.png` });
});
```

It ran from `web/` with `npx playwright test -c <config>`, where the config sets `testDir` to the
spec's folder, `browserName: "chromium"`, `timezoneId: "Europe/Bucharest"` and `baseURL` to the page,
and the environment sets `LANTERN_DEMO_USER=demo`, `LANTERN_DEMO_PASSWORD="$DEMO_PASS"` and
`SHOTS_DIR` outside the repo. Each PNG became WebP with
`ffmpeg -i <shot>.png -c:v libwebp -quality 82 <name>.webp`.

For comparing a build with a design, `web/e2e/shots.spec.ts` writes every screen at 1280 and 390 px
in both themes when `SHOTS_DIR` is set.
