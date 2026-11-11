import type { ListResponse } from "@lantern/shared";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { createOmdbClient } from "../sources/omdb.js";
import { fakeFetch, fixture, immediateQueue, json } from "../sources/testing.js";
import { seedPool, signIn, TEST_ORIGIN } from "../testing.js";

let app: FastifyInstance;
let cookie: string;
let clock: number;

beforeEach(async () => {
  clock = Date.UTC(2026, 10, 4, 12);
  app = await buildApp({
    dbPath: ":memory:",
    publicOrigin: TEST_ORIGIN,
    now: () => clock,
    omdb: createOmdbClient({
      apiKey: "k",
      fetch: fakeFetch(() => json(fixture("omdb-found"))),
      queue: immediateQueue(),
    }),
  });
  cookie = await signIn(app);
  seedPool(app.db, [
    { imdbId: "tt0000001", title: "Film One" },
    { imdbId: "tt0000002", title: "Series Two", kind: "series" },
    { imdbId: "tt0000003", title: "Film Three" },
    { imdbId: "tt0000004", title: "Film Four" },
  ]);
});
afterEach(async () => {
  await app.close();
});

const setState = async (id: string, state: string) => {
  clock += 1000;
  await app.inject({
    method: "PUT",
    url: `/lantern-api/v1/titles/${id}/state`,
    headers: { cookie, origin: TEST_ORIGIN },
    payload: { state },
  });
};
const list = async (path: string) =>
  (await app.inject({ url: `/lantern-api/v1/lists/${path}`, headers: { cookie } })).json<ListResponse>();
const names = (answer: ListResponse) => answer.rows.map((row) => row.title.title);

describe("the lists", () => {
  beforeEach(async () => {
    await setState("tt0000001", "want_to_watch");
    await setState("tt0000002", "want_to_watch");
    await setState("tt0000003", "good");
    await setState("tt0000004", "awful");
  });

  it("show the watchlist newest first, with the pool's facts and counts per state", async () => {
    const answer = await list("watchlist");
    expect(names(answer)).toEqual(["Series Two", "Film One"]);
    expect(answer.rows[0]).toMatchObject({
      state: "want_to_watch",
      inPool: true,
      poster: false,
      title: { kind: "series" },
    });
    expect(answer.counts).toMatchObject({ want_to_watch: 2, good: 1, awful: 1, amazing: 0 });
  });

  it("show the ratings, all four or one step, and not interested", async () => {
    expect(names(await list("ratings"))).toEqual(["Film Four", "Film Three"]);
    expect(names(await list("ratings?rating=good"))).toEqual(["Film Three"]);
    await setState("tt0000003", "not_interested");
    expect(names(await list("not-interested"))).toEqual(["Film Three"]);
  });

  it("filter by kind", async () => {
    expect(names(await list("watchlist?kind=movie"))).toEqual(["Film One"]);
  });

  it("show a title the pool dropped from OMDb's kept record, or by its id", async () => {
    await setState("tt1375666", "amazing");
    await setState("tt9999999", "meh");
    await app.records.get("tt1375666");
    const rows = (await list("ratings")).rows;
    expect(rows[0]).toMatchObject({ inPool: false, title: { imdbId: "tt9999999", title: "tt9999999", votes: 0 } });
    expect(rows[1]).toMatchObject({
      inPool: false,
      poster: true,
      title: { title: "Inception", year: 2010, rating: 8.8 },
    });
  });

  it("refuse an unknown list or a bad query", async () => {
    expect((await app.inject({ url: "/lantern-api/v1/lists/favourites", headers: { cookie } })).statusCode).toBe(404);
    expect(
      (await app.inject({ url: "/lantern-api/v1/lists/ratings?rating=great", headers: { cookie } })).statusCode,
    ).toBe(400);
  });
});
