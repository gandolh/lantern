import type { RecordResponse, SearchResponse, TitleItem } from "@lantern/shared";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createOmdbClient } from "../sources/index.js";
import { fakeFetch, fixture, immediateQueue, json, type FakeFetch } from "../sources/index.js";
import { seedPool, signIn, TEST_ORIGIN, buildTestApp, type TestApp } from "../../testing.js";

let app: FastifyInstance;
let t: TestApp;
let cookie: string;
let omdbFetch: FakeFetch;
let omdbAnswer: () => Response;

beforeEach(async () => {
  omdbAnswer = () => json(fixture("omdb-found"));
  omdbFetch = fakeFetch(() => omdbAnswer());
  t = await buildTestApp({
    omdb: createOmdbClient({ apiKey: "omdb-test-key", fetch: omdbFetch, queue: immediateQueue() }),
  });
  app = t.app;
  cookie = await signIn(t);
  seedPool(t.db, [
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
    expect(titles(await search("q=alien"))).toEqual([
      "Alien",
      "Aliens",
      "Alien: Romulus",
      "Cowboys & Aliens",
      "Resident Alien",
    ]);
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
    expect((await app.inject({ url: "/lantern-api/v1/search?q=alien&kind=tv", headers: { cookie } })).statusCode).toBe(
      400,
    );
  });

  it("says each title's state and whether a poster is kept, without asking OMDb", async () => {
    await app.inject({
      method: "PUT",
      url: "/lantern-api/v1/titles/tt1375666/state",
      headers: { cookie, origin: TEST_ORIGIN },
      payload: { state: "amazing" },
    });
    expect((await search("q=inception"))[0]).toMatchObject({ state: "amazing", poster: false });
    await t.records.get("tt1375666");
    expect((await search("q=inception"))[0]!.poster).toBe(true);
  });

  it("is behind sign-in", async () => {
    expect((await app.inject({ url: "/lantern-api/v1/search?q=alien" })).statusCode).toBe(401);
  });
});

describe("a title from the pool", () => {
  it("answers its facts and state, or 404", async () => {
    const res = await app.inject({ url: "/lantern-api/v1/titles/tt0000005", headers: { cookie } });
    expect(res.json<TitleItem>()).toMatchObject({
      title: { imdbId: "tt0000005", kind: "series", title: "Resident Alien", genres: ["Drama"] },
      state: null,
      poster: false,
    });
    expect((await app.inject({ url: "/lantern-api/v1/titles/tt9999999", headers: { cookie } })).statusCode).toBe(404);
    expect((await app.inject({ url: "/lantern-api/v1/titles/603", headers: { cookie } })).statusCode).toBe(400);
  });
});

describe("a title's OMDb record", () => {
  const record = async (id: string) => app.inject({ url: `/lantern-api/v1/titles/${id}/record`, headers: { cookie } });

  it("asks OMDb once, then answers from what it kept, without the poster's URL", async () => {
    const first = await record("tt1375666");
    expect(first.statusCode).toBe(200);
    expect(first.json<RecordResponse>().record).toMatchObject({
      title: "Inception",
      hasPoster: true,
      scores: { rottenTomatoes: 87 },
    });
    expect(first.body).not.toContain("media-amazon");
    await record("tt1375666");
    expect(omdbFetch.calls).toHaveLength(1);
  });

  it("answers null when OMDb doesn't know the title", async () => {
    omdbAnswer = () => json(fixture("omdb-not-found"));
    expect((await record("tt0000009")).json()).toEqual({ record: null });
  });

  it("answers 502 on a refusal, which is never kept, and 400 on a bad id", async () => {
    omdbAnswer = () => json(fixture("omdb-limit"));
    const refused = await record("tt0000009");
    expect(refused.statusCode).toBe(502);
    expect(refused.json().message).toMatch(/Request limit reached/);
    expect((await record("603")).statusCode).toBe(400);
  });
});

describe("without an OMDb key", () => {
  it("answers 503 no_key", async () => {
    const keyless = await buildTestApp();
    const keylessCookie = await signIn(keyless);
    const res = await keyless.app.inject({
      url: "/lantern-api/v1/titles/tt1375666/record",
      headers: { cookie: keylessCookie },
    });
    expect(res.statusCode).toBe(503);
    expect(res.json().code).toBe("no_key");
    await keyless.app.close();
  });
});

describe("the titles routes' schemas", () => {
  it("answers a bad id and an unknown query key with a 400 naming the field", async () => {
    const badId = await app.inject({ url: "/lantern-api/v1/titles/603", headers: { cookie } });
    expect(badId.statusCode).toBe(400);
    expect(badId.json()).toEqual({ code: "invalid_request", message: "id: must be an IMDb id such as tt0111161" });
    const unknownKey = await app.inject({ url: "/lantern-api/v1/search?q=alien&foo=1", headers: { cookie } });
    expect(unknownKey.statusCode).toBe(400);
    expect(unknownKey.json().message).toBe('request: Unrecognized key: "foo"');
  });

  it("strips a field a pool row carries that the schema does not name", async () => {
    const row = t.pool.get("tt0000001");
    if (!row) throw new Error("the seeded title is missing");
    const leaky = await buildTestApp({ pool: { ...t.pool, get: () => ({ ...row, internal: "kept" }) } });
    const res = await leaky.app.inject({
      url: "/lantern-api/v1/titles/tt0000001",
      headers: { cookie: await signIn(leaky) },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).not.toContain("internal");
    expect(res.json().title.title).toBe("Alien");
    await leaky.app.close();
  });
});
