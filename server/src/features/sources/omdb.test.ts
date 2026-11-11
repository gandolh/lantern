import { describe, expect, it } from "vitest";
import { NoKeyError, SourceError } from "./http.js";
import { createOmdbClient, forPage, names, readOmdb } from "./omdb.js";
import { fakeFetch, fixture, immediateQueue, json } from "./testing.js";

const KEY = "omdb-test-key-not-real";

describe("readOmdb", () => {
  it("reads a film's whole record", () => {
    const reading = readOmdb(fixture("omdb-found"), "tt1375666");
    expect(reading.outcome).toBe("found");
    if (reading.outcome !== "found") return;
    expect(reading.record).toEqual({
      imdbId: "tt1375666",
      title: "Inception",
      type: "movie",
      year: 2010,
      endYear: null,
      ongoing: false,
      rated: "PG-13",
      released: "16 Jul 2010",
      runtime: 148,
      genres: ["Action", "Adventure", "Sci-Fi"],
      directors: ["Christopher Nolan"],
      writers: ["Christopher Nolan"],
      actors: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
      plot: expect.stringContaining("dream-sharing"),
      language: "English, Japanese, French",
      country: "United States, United Kingdom",
      awards: "Won 4 Oscars. 159 wins & 220 nominations total",
      hasPoster: true,
      posterUrl: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
      seasons: null,
      scores: { imdb: { rating: 8.8, votes: 2_600_000 }, rottenTomatoes: 87, metacritic: 74 },
    });
    // The page never gets the poster's URL.
    expect(forPage(reading.record)).not.toHaveProperty("posterUrl");
  });

  it("reads a series' years and seasons", () => {
    const reading = readOmdb(fixture("omdb-series"), "tt0944947");
    if (reading.outcome !== "found") throw new Error("expected a record");
    expect(reading.record).toMatchObject({
      year: 2011,
      endYear: 2019,
      ongoing: false,
      seasons: 8,
      type: "series",
      directors: [],
    });
    expect(reading.record.writers).toEqual(["David Benioff", "D.B. Weiss"]);
    expect(reading.record.scores).toEqual({
      imdb: { rating: 9.2, votes: 2_400_000 },
      rottenTomatoes: null,
      metacritic: null,
    });
  });

  it("reads N/A as none, an open-ended series, writers' notes, and drops a poster on another host", () => {
    const reading = readOmdb(fixture("omdb-na"), "tt0000001");
    if (reading.outcome !== "found") throw new Error("expected a record");
    expect(reading.record).toMatchObject({
      year: 2019,
      endYear: null,
      ongoing: true,
      rated: null,
      runtime: null,
      plot: null,
      actors: [],
      writers: ["Jane Writer", "John Other"],
      hasPoster: false,
      posterUrl: null,
      seasons: null,
      scores: { imdb: { rating: 7.1, votes: null }, rottenTomatoes: null, metacritic: null },
    });
  });

  it("calls a wrong id not found, and throws on a refusal", () => {
    expect(readOmdb(fixture("omdb-not-found"), "tt0000002")).toEqual({ outcome: "not_found" });
    expect(() => readOmdb(fixture("omdb-limit"), "tt0000002")).toThrow(SourceError);
    expect(() => readOmdb({ Response: "False", Error: "Invalid API key!" }, "tt0000002")).toThrow(/refused/);
  });
});

describe("names", () => {
  it("splits, strips notes and repeats", () => {
    expect(names("Jonathan Nolan (screenplay), Christopher Nolan (story), Jonathan Nolan")).toEqual([
      "Jonathan Nolan",
      "Christopher Nolan",
    ]);
    expect(names("N/A")).toEqual([]);
  });
});

describe("the OMDb client", () => {
  it("asks by IMDb id for the full plot, with the key as apikey, and hands back a 401's body", async () => {
    const fetch = fakeFetch((url) =>
      url.searchParams.get("i") === "tt1375666"
        ? json(fixture("omdb-found"))
        : json({ Response: "False", Error: "Invalid API key!" }, 401),
    );
    const omdb = createOmdbClient({ apiKey: KEY, fetch, queue: immediateQueue() });
    expect(readOmdb(await omdb.byImdbId("tt1375666"), "tt1375666").outcome).toBe("found");
    expect(fetch.calls[0]!.url.searchParams.get("apikey")).toBe(KEY);
    expect(fetch.calls[0]!.url.searchParams.get("plot")).toBe("full");
    await expect(omdb.byImdbId("tt0000002").then((answer) => readOmdb(answer, "tt0000002"))).rejects.toThrow(
      /Invalid API key/,
    );
  });

  it("refuses without a key, before any request", async () => {
    const fetch = fakeFetch(() => json({}));
    const omdb = createOmdbClient({ apiKey: undefined, fetch, queue: immediateQueue() });
    expect(omdb.enabled).toBe(false);
    await expect(omdb.byImdbId("tt1375666")).rejects.toBeInstanceOf(NoKeyError);
    expect(fetch.calls).toHaveLength(0);
  });

  it("never puts the key in an error", async () => {
    const omdb = createOmdbClient({
      apiKey: KEY,
      fetch: fakeFetch(() => Promise.reject(new TypeError("fetch failed"))),
      queue: immediateQueue(),
    });
    const error = await omdb.byImdbId("tt1375666").catch((caught: unknown) => caught);
    expect((error as SourceError).failure).toBe("network");
    expect(String(error)).not.toContain(KEY);
  });
});
