import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type Db } from "../db.js";
import { DAY_MS, MAX_AGE_MS, createSourceCache } from "./cache.js";
import { NoKeyError, SourceError } from "./http.js";
import { createOmdbClient } from "./omdb.js";
import { fakeFetch, fixture, immediateQueue, json, type FakeFetch } from "./testing.js";
import { createTmdbClient } from "./tmdb.js";
import { createSources, TitleNotFoundError, type Sources } from "./titles.js";

let db: Db;
let clock: number;
let tmdbFetch: FakeFetch;
let omdbFetch: FakeFetch;
let tmdbDown: boolean;
let omdbAnswer: unknown;

function sources(keys: { tmdb?: string; omdb?: string } = { tmdb: "tmdb-test-key", omdb: "omdb-test-key" }): Sources {
  return createSources({
    tmdb: createTmdbClient({ apiKey: keys.tmdb, fetch: tmdbFetch, queue: immediateQueue() }),
    omdb: createOmdbClient({ apiKey: keys.omdb, fetch: omdbFetch, queue: immediateQueue() }),
    cache: createSourceCache(db, () => clock),
  });
}

beforeEach(() => {
  db = openDatabase(":memory:");
  clock = Date.UTC(2026, 10, 4, 12);
  tmdbDown = false;
  omdbAnswer = fixture("omdb-found");
  tmdbFetch = fakeFetch((url) => {
    if (tmdbDown) return json({}, 500);
    if (url.pathname === "/3/movie/27205") return json(fixture("tmdb-movie"));
    if (url.pathname === "/3/tv/1399") return json(fixture("tmdb-tv"));
    if (url.pathname === "/3/movie/404") return json({ status_code: 34 }, 404);
    if (url.pathname === "/3/movie/7") return json({ ...(fixture("tmdb-movie") as object), id: 7, imdb_id: null });
    if (url.pathname === "/3/search/multi") return json(fixture("tmdb-search"));
    if (url.pathname === "/3/genre/movie/list") return json(fixture("tmdb-genres-movie"));
    return undefined;
  });
  omdbFetch = fakeFetch(() => json(omdbAnswer));
});
afterEach(() => {
  db.close();
});

describe("the cache", () => {
  it("answers a fresh title without asking again", async () => {
    const s = sources();
    expect((await s.details("movie", 27205)).title).toBe("Inception");
    clock += 89 * DAY_MS;
    await s.details("movie", 27205);
    expect(tmdbFetch.calls).toHaveLength(1);
  });

  it("refreshes a stale title when it is used, and serves the stale one if the refresh fails", async () => {
    const s = sources();
    await s.details("movie", 27205);
    clock += 91 * DAY_MS;
    tmdbDown = true;
    expect((await s.details("movie", 27205)).title).toBe("Inception");
    expect(tmdbFetch.calls).toHaveLength(2);
    tmdbDown = false;
    await s.details("movie", 27205);
    expect(tmdbFetch.calls).toHaveLength(3);
    await s.details("movie", 27205);
    expect(tmdbFetch.calls).toHaveLength(3);
  });

  it("never serves a row 180 days old, and deletes it at start-up", async () => {
    await sources().details("movie", 27205);
    clock += MAX_AGE_MS;
    tmdbDown = true;
    const s = sources();
    expect(db.prepare("SELECT count(*) AS n FROM tmdb_cache").get()).toEqual({ n: 0 });
    await expect(s.details("movie", 27205)).rejects.toBeInstanceOf(SourceError);
  });

  it("purges old rows at most hourly as the cache is read", async () => {
    const s = sources();
    await s.details("movie", 27205);
    clock += MAX_AGE_MS - DAY_MS;
    await s.details("tv", 1399);
    clock += DAY_MS;
    // The film is now 180 days old; reading anything purges it.
    await s.search("inception", 1);
    const keys = (db.prepare("SELECT key FROM tmdb_cache").all() as { key: string }[]).map((row) => row.key);
    expect(keys.some((key) => key.includes("movie:27205"))).toBe(false);
    expect(keys.some((key) => key.includes("tv:1399"))).toBe(true);
  });

  it("keeps search and list pages a day, and a query by its normal form", async () => {
    const s = sources();
    await s.search("Inception", 1);
    await s.search("  inception ", 1);
    expect(tmdbFetch.calls).toHaveLength(1);
    clock += DAY_MS;
    await s.search("inception", 1);
    expect(tmdbFetch.calls).toHaveLength(2);
  });

  it("names genres", async () => {
    expect((await sources().genres("movie")).get(878)).toBe("Science Fiction");
  });

  it("forgets a title TMDB no longer has", async () => {
    await expect(sources().details("movie", 404)).rejects.toBeInstanceOf(TitleNotFoundError);
  });

  it("says no key without one", async () => {
    const s = sources({});
    expect(s.status).toEqual({ tmdb: false, omdb: false });
    await expect(s.details("movie", 27205)).rejects.toBeInstanceOf(NoKeyError);
  });
});

describe("summaries for a list page", () => {
  it("fetches at most the budget, missing titles first, and says how many are pending", async () => {
    const s = sources();
    const titles = [
      { mediaType: "movie" as const, tmdbId: 27205 },
      { mediaType: "tv" as const, tmdbId: 1399 },
    ];
    const first = await s.summaries(titles, 1);
    expect([...first.found.keys()]).toEqual(["movie:27205"]);
    expect(first.pending).toBe(1);
    const second = await s.summaries(titles, 1);
    expect([...second.found.keys()].sort()).toEqual(["movie:27205", "tv:1399"]);
    expect(second.pending).toBe(0);
    expect(tmdbFetch.calls).toHaveLength(2);
    const third = await s.summaries(titles, 5);
    expect(third.found.get("tv:1399")?.title).toBe("Game of Thrones");
    expect(tmdbFetch.calls).toHaveLength(2);
  });

  it("counts a failed fetch as pending", async () => {
    tmdbDown = true;
    const result = await sources().summaries([{ mediaType: "movie", tmdbId: 27205 }], 5);
    expect(result).toEqual({ found: new Map(), pending: 1 });
  });
});

describe("scores", () => {
  it("asks OMDb once per title, by the IMDb id from TMDB", async () => {
    const s = sources();
    expect(await s.scores("movie", 27205)).toEqual({
      status: "found",
      scores: { imdb: { rating: 8.8, votes: 2_600_000 }, rottenTomatoes: 87, metacritic: 74 },
    });
    clock += 400 * DAY_MS;
    await s.scores("movie", 27205);
    expect(omdbFetch.calls).toHaveLength(1);
    expect(omdbFetch.calls[0]!.url.searchParams.get("i")).toBe("tt1375666");
  });

  it("keeps a not-found answer 30 days, and never a refusal", async () => {
    omdbAnswer = fixture("omdb-not-found");
    const s = sources();
    expect(await s.scores("tv", 1399)).toEqual({ status: "none", reason: "not_found" });
    clock += 29 * DAY_MS;
    await s.scores("tv", 1399);
    expect(omdbFetch.calls).toHaveLength(1);
    clock += DAY_MS;
    omdbAnswer = fixture("omdb-limit");
    await expect(s.scores("tv", 1399)).rejects.toThrow(/Request limit reached/);
    await expect(s.scores("tv", 1399)).rejects.toThrow(/Request limit reached/);
    expect(omdbFetch.calls).toHaveLength(3);
  });

  it("has none for a title without an IMDb id, without asking OMDb", async () => {
    expect(await sources().scores("movie", 7)).toEqual({ status: "none", reason: "no_imdb_id" });
    expect(omdbFetch.calls).toHaveLength(0);
  });
});
