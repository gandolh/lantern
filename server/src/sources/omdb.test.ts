import { describe, expect, it } from "vitest";
import { NoKeyError, SourceError } from "./http.js";
import { createOmdbClient, readOmdb } from "./omdb.js";
import { fakeFetch, fixture, immediateQueue, json } from "./testing.js";

const KEY = "omdb-test-key-not-real";

describe("readOmdb", () => {
  it("reads the three scores", () => {
    expect(readOmdb(fixture("omdb-found"))).toEqual({
      outcome: "found",
      scores: { imdb: { rating: 8.8, votes: 2_600_000 }, rottenTomatoes: 87, metacritic: 74 },
    });
  });

  it("reads N/A and a missing source as null", () => {
    expect(readOmdb(fixture("omdb-na"))).toEqual({
      outcome: "found",
      scores: { imdb: { rating: 7.1, votes: null }, rottenTomatoes: null, metacritic: null },
    });
  });

  it("calls a wrong id not found, and throws on a refusal", () => {
    expect(readOmdb(fixture("omdb-not-found"))).toEqual({ outcome: "not_found" });
    expect(() => readOmdb(fixture("omdb-limit"))).toThrow(SourceError);
    expect(() => readOmdb({ Response: "False", Error: "Invalid API key!" })).toThrow(/refused/);
  });
});

describe("the OMDb client", () => {
  it("asks by IMDb id with the key as apikey, and hands back a 401's body", async () => {
    const fetch = fakeFetch((url) => (url.searchParams.get("i") === "tt1375666" ? json(fixture("omdb-found")) : json({ Response: "False", Error: "Invalid API key!" }, 401)));
    const omdb = createOmdbClient({ apiKey: KEY, fetch, queue: immediateQueue() });
    expect(readOmdb(await omdb.byImdbId("tt1375666")).outcome).toBe("found");
    expect(fetch.calls[0]!.url.searchParams.get("apikey")).toBe(KEY);
    await expect(omdb.byImdbId("tt0000002").then(readOmdb)).rejects.toThrow(/Invalid API key/);
  });

  it("refuses without a key, before any request", async () => {
    const fetch = fakeFetch(() => json({}));
    const omdb = createOmdbClient({ apiKey: undefined, fetch, queue: immediateQueue() });
    expect(omdb.enabled).toBe(false);
    await expect(omdb.byImdbId("tt1375666")).rejects.toBeInstanceOf(NoKeyError);
    expect(fetch.calls).toHaveLength(0);
  });
});
