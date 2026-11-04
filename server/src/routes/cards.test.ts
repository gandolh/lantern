import type { CardsResponse } from "@lantern/shared";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { createOmdbClient } from "../sources/omdb.js";
import { fakeFetch, fixture, immediateQueue, json, type FakeFetch } from "../sources/testing.js";
import { seedPool, signIn, TEST_ORIGIN } from "../testing.js";

let app: FastifyInstance;
let cookie: string;
let omdbFetch: FakeFetch;

beforeEach(async () => {
  omdbFetch = fakeFetch(() => json(fixture("omdb-found")));
  app = await buildApp({ dbPath: ":memory:", publicOrigin: TEST_ORIGIN, omdb: createOmdbClient({ apiKey: "k", fetch: omdbFetch, queue: immediateQueue() }) });
  cookie = await signIn(app);
  seedPool(app.db, [
    { imdbId: "tt0000001", title: "One", votes: 100 },
    { imdbId: "tt0000002", title: "Two", votes: 500, kind: "series" },
    { imdbId: "tt0000003", title: "Three", votes: 300 },
    { imdbId: "tt1375666", title: "Inception", votes: 900 },
    { imdbId: "tt0000005", title: "Five", votes: 700, kind: "series" },
  ]);
});
afterEach(async () => {
  await app.close();
});

const deal = async (query = "") => (await app.inject({ url: `/lantern-api/v1/cards${query}`, headers: { cookie } })).json<CardsResponse>().cards;
const ids = (cards: CardsResponse["cards"]) => cards.map((card) => card.title.imdbId);
const write = (method: "PUT" | "POST", url: string, payload?: object) =>
  app.inject({ method, url: `/lantern-api/v1/titles/${url}`, headers: { cookie, origin: TEST_ORIGIN }, payload });

describe("the deck", () => {
  it("deals the most-voted first, in the count asked", async () => {
    expect(ids(await deal("?count=3"))).toEqual(["tt1375666", "tt0000005", "tt0000002"]);
  });

  it("leaves out titles with a state, skipped ones, and those the page already holds", async () => {
    await write("PUT", "tt1375666/state", { state: "good" });
    await write("PUT", "tt0000002/state", { state: "not_interested" });
    await write("POST", "tt0000005/skip");
    expect(ids(await deal())).toEqual(["tt0000003", "tt0000001"]);
    expect(ids(await deal("?exclude=tt0000003"))).toEqual(["tt0000001"]);
  });

  it("deals one kind", async () => {
    expect(ids(await deal("?kind=series"))).toEqual(["tt0000005", "tt0000002"]);
  });

  it("carries OMDb's record only when it is kept, and never asks for one", async () => {
    expect((await deal("?count=1"))[0]).toMatchObject({ record: null, poster: false });
    expect(omdbFetch.calls).toHaveLength(0);
    await app.records.get("tt1375666");
    expect((await deal("?count=1"))[0]).toMatchObject({ record: { title: "Inception" }, poster: true });
    expect(omdbFetch.calls).toHaveLength(1);
  });

  it("refuses a bad query", async () => {
    for (const query of ["?count=0", "?count=21", "?kind=tv", "?exclude=603"]) {
      expect((await app.inject({ url: `/lantern-api/v1/cards${query}`, headers: { cookie } })).statusCode, query).toBe(400);
    }
  });
});
