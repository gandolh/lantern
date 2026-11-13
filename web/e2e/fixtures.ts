import { expect, test as base, type Page, type Route } from "@playwright/test";
import { AMBER, CARDS, HARBOUR, HOLLOW, FOUNDRY, RATED, SUGGESTIONS, WATCHLIST, itemOf, recordOf } from "./data";
import type { ListRow, PoolTitle } from "@lantern/shared";

/** Every page the specs walk, with the path and a line to wait for. */
export const SCREENS = [
  { name: "suggestions", path: "/lantern/", ready: "Suggested titles" },
  { name: "rate", path: "/lantern/rate", ready: "Rate" },
  { name: "title", path: `/lantern/title/${HARBOUR.imdbId}`, ready: "Scores" },
  { name: "watchlist", path: "/lantern/watchlist", ready: "Watchlist" },
  { name: "ratings", path: "/lantern/ratings", ready: "Ratings" },
  { name: "search", path: "/lantern/search?q=harbour", ready: "Search" },
  { name: "account", path: "/lantern/account", ready: "Account" },
  { name: "not-found", path: "/lantern/nowhere", ready: "Not found" },
] as const;

const COUNTS = { awful: 0, meh: 1, good: 1, amazing: 1, not_interested: 0, want_to_watch: 2 };

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

/**
 * Answers the data routes with stand-in titles (the session stays the real server's). The poster route answers 404, as
 * it does with no OMDb key, so the type-set tiles show.
 */
async function stubApi(page: Page) {
  /** Titles given a state or skipped so far: the cards route leaves them out, as the server does. */
  const marked = new Set<string>();
  await page.route("**/lantern-api/v1/**", (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    const path = url.pathname.replace(/^.*\/lantern-api\/v1/, "");
    const kind = url.searchParams.get("kind");
    const byKind = <T extends { title: PoolTitle }>(rows: T[]) => rows.filter((r) => !kind || r.title.kind === kind);

    if (path === "/suggestions") {
      return json(route, { suggestions: byKind(SUGGESTIONS), rated: 11, liked: 6 });
    }
    if (path === "/cards") {
      const exclude = new Set((url.searchParams.get("exclude") ?? "").split(","));
      return json(route, {
        cards: byKind(CARDS).filter((c) => !exclude.has(c.title.imdbId) && !marked.has(c.title.imdbId)),
      });
    }
    if (path.startsWith("/posters/")) return json(route, { code: "not_found", message: "no poster" }, 404);
    if (path.startsWith("/lists/")) {
      const name = path.slice("/lists/".length);
      const rows: ListRow[] = name === "watchlist" ? WATCHLIST : name === "ratings" ? RATED : [];
      return json(route, { rows: byKind(rows), next: null, counts: COUNTS });
    }
    if (path === "/search") {
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      const all = [HARBOUR, AMBER, FOUNDRY, HOLLOW].filter((t) => t.title.toLowerCase().includes(q));
      return json(route, { results: byKind(all.map((t) => ({ title: t, state: null, poster: false }))) });
    }
    const record = /^\/titles\/(tt\d+)\/record$/.exec(path);
    if (record?.[1]) {
      const found = recordOf(record[1]);
      return found
        ? json(route, { record: found })
        : json(route, { code: "no_key", message: "OMDb has no key: set OMDB_API_KEY in .env" }, 503);
    }
    const state = /^\/titles\/(tt\d+)\/state$/.exec(path);
    if (state?.[1]) {
      if (method === "PUT") marked.add(state[1]);
      else marked.delete(state[1]);
      return method === "PUT"
        ? json(route, { imdbId: state[1], state: "good", updatedAt: Date.now() })
        : json(route, { cleared: true });
    }
    const skip = /^\/titles\/(tt\d+)\/skip$/.exec(path);
    if (skip?.[1]) {
      if (method === "POST") marked.add(skip[1]);
      else marked.delete(skip[1]);
      return json(route, { skipped: method === "POST" });
    }
    const one = /^\/titles\/(tt\d+)$/.exec(path);
    if (one?.[1]) {
      const all = [HARBOUR, AMBER, FOUNDRY, HOLLOW, ...SUGGESTIONS.map((s) => s.title)];
      const found = all.find((t) => t.imdbId === one[1]);
      if (!found) return json(route, { code: "not_found", message: "no such title" }, 404);
      return json(route, itemOf(found, found.imdbId === HARBOUR.imdbId ? "meh" : null));
    }
    return route.fallback();
  });
}

/** Signs the browser in as the seeded local account, with the stubs in place and a theme chosen before the first paint. */
export const test = base.extend<{ theme: "light" | "dark" | "system" | "unset" }>({
  theme: ["light", { option: true }],
  page: async ({ page, baseURL, theme }, use) => {
    const password = process.env.LANTERN_DEMO_PASSWORD;
    if (!password || !baseURL) throw new Error("Set LANTERN_DEMO_PASSWORD (and run against a seeded local server).");
    const response = await page.context().request.post(`${baseURL}/lantern-api/auth/login`, {
      data: { username: process.env.LANTERN_DEMO_USER ?? "demo", password },
      headers: { origin: new URL(baseURL).origin },
    });
    expect(response.ok()).toBe(true);
    // "unset" leaves the first-visit state alone, so a spec can set a theme itself and see it kept.
    if (theme !== "unset") await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
    await stubApi(page);
    await use(page);
  },
});

export { expect };
