import type { SearchResponse, TitleItem } from "@lantern/shared";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { createOmdbClient } from "../sources/omdb.js";
import { fakeFetch, fixture, immediateQueue, json } from "../sources/testing.js";
import { seedPool, signIn, TEST_ORIGIN } from "../testing.js";

let app: FastifyInstance;
let cookie: string;

beforeEach(async () => {
  app = await buildApp({
    dbPath: ":memory:",
    publicOrigin: TEST_ORIGIN,
    omdb: createOmdbClient({ apiKey: "omdb-test-key", fetch: fakeFetch(() => json(fixture("omdb-found"))), queue: immediateQueue() }),
  });
  cookie = await signIn(app);
  seedPool(app.db, [
    { imdbId: "tt0000001", title: "Alien", votes: 900_000 },
    { imdbId: "tt0000002", title: "Aliens", votes: 750_000 },
    { imdbId: "tt0000003", title: "Alien: Romulus", votes: 150_000 },
    { imdbId: "tt0000004", title: "Cowboys & Aliens", votes: 230_000 },
    { imdbId: "tt0000005", title: "Resident Alien", kind: "series", votes: 40_000 },
    { imdbId: "tt0000006", title: "Amélie", votes: 800_000 },
    { imdbId: "tt1375666", title: "Inception", votes: 2_600_000 },
  ]);
});
afterEach(async () => {
  await app.close();
});

const search = async (query: string) =>
  (await app.inject({ url: `/lantern-api/v1/search?${query}`, headers: { cookie } })).json<SearchResponse>().results;
const titles = (results: SearchResponse["results"]) => results.map((item) => item.title.title);

describe("search", () => {
  it("puts the exact title first, then titles starting with it, then the rest, most-voted first", async () => {
    expect(titles(await search("q=alien"))).toEqual(["Alien", "Aliens", "Alien: Romulus", "Cowboys & Aliens", "Resident Alien"]);
  });

  it("ignores case, accents and punctuation, and needs every word", async () => {
    expect(titles(await search("q=AMELIE"))).toEqual(["Amélie"]);
    expect(titles(await search("q=cowboys%20%26%20aliens"))).toEqual(["Cowboys & Aliens"]);
    expect(titles(await search("q=alien%20romulus"))).toEqual(["Alien: Romulus"]);
    expect(await search("q=%25%25")).toEqual([]);
    expect(await search("q=")).toEqual([]);
  });

  it("filters by kind", async () => {
    expect(titles(await search("q=alien&kind=series"))).toEqual(["Resident Alien"]);
    expect((await app.inject({ url: "/lantern-api/v1/search?q=alien&kind=tv", headers: { cookie } })).statusCode).toBe(400);
  });

  it("says each title's state and whether a poster is kept, without asking OMDb", async () => {
    await app.inject({ method: "PUT", url: "/lantern-api/v1/titles/tt1375666/state", headers: { cookie, origin: TEST_ORIGIN }, payload: { state: "amazing" } });
    expect((await search("q=inception"))[0]).toMatchObject({ state: "amazing", poster: false });
    await app.records.get("tt1375666");
    expect((await search("q=inception"))[0]!.poster).toBe(true);
  });

  it("is behind sign-in", async () => {
    expect((await app.inject({ url: "/lantern-api/v1/search?q=alien" })).statusCode).toBe(401);
  });
});

describe("a title from the pool", () => {
  it("answers its facts and state, or 404", async () => {
    const res = await app.inject({ url: "/lantern-api/v1/titles/tt0000005", headers: { cookie } });
    expect(res.json<TitleItem>()).toMatchObject({ title: { imdbId: "tt0000005", kind: "series", title: "Resident Alien", genres: ["Drama"] }, state: null, poster: false });
    expect((await app.inject({ url: "/lantern-api/v1/titles/tt9999999", headers: { cookie } })).statusCode).toBe(404);
    expect((await app.inject({ url: "/lantern-api/v1/titles/603", headers: { cookie } })).statusCode).toBe(400);
  });
});
