import { describe, expect, it } from "vitest";
import { NoKeyError, SourceError } from "./http.js";
import { fakeFetch, fixture, immediateQueue, json, noSleep } from "./testing.js";
import { createTmdbClient, isReadAccessToken } from "./tmdb.js";

// Neither is a real key: the shapes only.
const API_KEY = "0123456789abcdef0123456789abcdef";
const TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJ0ZXN0In0.c2lnbmF0dXJlLW5vdC1yZWFs";

const answers = () =>
  fakeFetch((url) => {
    if (url.pathname === "/3/search/multi") return json(fixture("tmdb-search"));
    if (url.pathname === "/3/movie/27205") return json(fixture("tmdb-movie"));
    if (url.pathname === "/3/tv/1399") return json(fixture("tmdb-tv"));
    if (url.pathname === "/3/movie/popular" || url.pathname === "/3/discover/movie") return json(fixture("tmdb-popular-movie"));
    if (url.pathname === "/3/genre/movie/list") return json(fixture("tmdb-genres-movie"));
    if (url.pathname === "/3/movie/1") return json({ status_code: 34, status_message: "The resource you requested could not be found." }, 404);
    return undefined;
  });

describe("the key", () => {
  it("tells a read access token from an API key by its shape", () => {
    expect(isReadAccessToken(TOKEN)).toBe(true);
    expect(isReadAccessToken(API_KEY)).toBe(false);
  });

  it("sends a read access token as a bearer header, and no api_key", async () => {
    const fetch = answers();
    await createTmdbClient({ apiKey: TOKEN, fetch, queue: immediateQueue() }).details("movie", 27205);
    const call = fetch.calls[0]!;
    expect(call.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
    expect(call.url.searchParams.has("api_key")).toBe(false);
  });

  it("sends an API key as api_key, and no header", async () => {
    const fetch = answers();
    await createTmdbClient({ apiKey: API_KEY, fetch, queue: immediateQueue() }).details("movie", 27205);
    const call = fetch.calls[0]!;
    expect(call.url.searchParams.get("api_key")).toBe(API_KEY);
    expect(call.headers.has("authorization")).toBe(false);
  });

  it("refuses every call without a key, before any request", async () => {
    const fetch = answers();
    const tmdb = createTmdbClient({ apiKey: undefined, fetch, queue: immediateQueue() });
    expect(tmdb.enabled).toBe(false);
    await expect(tmdb.search("inception", 1)).rejects.toBeInstanceOf(NoKeyError);
    expect(fetch.calls).toHaveLength(0);
  });

  it("never puts the key in an error", async () => {
    const tmdb = createTmdbClient({ apiKey: API_KEY, fetch: answers(), queue: immediateQueue() });
    const error = await tmdb.details("movie", 1).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(SourceError);
    expect((error as SourceError).failure).toBe("not_found");
    expect((error as Error).message).toBe("TMDB /3/movie/1: answered 404");
    expect(String(error)).not.toContain(API_KEY);

    const down = createTmdbClient({ apiKey: API_KEY, fetch: fakeFetch(() => Promise.reject(new TypeError("fetch failed"))), queue: immediateQueue() });
    const network = await down.search("x", 1).catch((caught: unknown) => caught);
    expect((network as SourceError).failure).toBe("network");
    expect(String(network)).not.toContain(API_KEY);
  });
});

describe("the requests", () => {
  it("ask in English, append what a title page needs, and page the lists", async () => {
    const fetch = answers();
    const tmdb = createTmdbClient({ apiKey: API_KEY, fetch, queue: immediateQueue() });
    await tmdb.search("inception", 2);
    await tmdb.details("movie", 27205);
    await tmdb.details("tv", 1399);
    await tmdb.list("popular", "movie", 3);
    await tmdb.list("best_known", "movie", 4);
    await tmdb.genres("movie");
    const [search, film, series, popular, best, genres] = fetch.calls.map((call) => call.url);
    expect(search!.searchParams.get("query")).toBe("inception");
    expect(search!.searchParams.get("page")).toBe("2");
    expect(search!.searchParams.get("include_adult")).toBe("false");
    expect(film!.searchParams.get("append_to_response")).toBe("keywords,credits,recommendations");
    expect(series!.searchParams.get("append_to_response")).toBe("keywords,aggregate_credits,external_ids,recommendations");
    expect(popular!.pathname).toBe("/3/movie/popular");
    expect(popular!.searchParams.get("page")).toBe("3");
    expect(best!.pathname).toBe("/3/discover/movie");
    expect(best!.searchParams.get("sort_by")).toBe("vote_count.desc");
    expect(genres!.pathname).toBe("/3/genre/movie/list");
    for (const call of fetch.calls) expect(call.url.searchParams.get("language")).toBe("en-US");
  });

  it("retries once after a 429, then gives up", async () => {
    let n = 0;
    const once = fakeFetch(() => (++n === 1 ? json({}, 429, { "retry-after": "1" }) : json(fixture("tmdb-search"))));
    const tmdb = createTmdbClient({ apiKey: API_KEY, fetch: once, queue: immediateQueue(), sleep: noSleep });
    await expect(tmdb.search("inception", 1)).resolves.toBeDefined();
    expect(once.calls).toHaveLength(2);

    const always = fakeFetch(() => json({}, 429));
    const limited = createTmdbClient({ apiKey: API_KEY, fetch: always, queue: immediateQueue(), sleep: noSleep });
    const error = await limited.search("inception", 1).catch((caught: unknown) => caught);
    expect((error as SourceError).failure).toBe("rate_limited");
    expect(always.calls).toHaveLength(2);
  });
});
