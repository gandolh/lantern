import type { SuggestionsResponse } from "@lantern/shared";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { seedPool, signIn, TEST_ORIGIN, buildTestApp, type TestApp } from "../testing.js";

let app: FastifyInstance;
let t: TestApp;
let cookie: string;

beforeEach(async () => {
  t = await buildTestApp();
  app = t.app;
  cookie = await signIn(t);
  seedPool(t.db, [
    { imdbId: "tt0000001", title: "Liked", genres: "Sci-Fi,Thriller", directors: "nm0000001", writers: "nm0000001" },
    { imdbId: "tt0000002", title: "Same Director", genres: "Drama", directors: "nm0000001", votes: 500_000 },
    { imdbId: "tt0000003", title: "Same Director Series", kind: "series", genres: "Drama", writers: "nm0000001" },
    { imdbId: "tt0000004", title: "Unrelated", genres: "Comedy", directors: "nm0000009" },
    { imdbId: "tt0000005", title: "On The Watchlist", genres: "Drama", directors: "nm0000001" },
  ]);
});
afterEach(async () => {
  await app.close();
});

const setState = (id: string, state: string) =>
  app.inject({
    method: "PUT",
    url: `/lantern-api/v1/titles/${id}/state`,
    headers: { cookie, origin: TEST_ORIGIN },
    payload: { state },
  });
const suggest = async (query = "") =>
  (await app.inject({ url: `/lantern-api/v1/suggestions${query}`, headers: { cookie } })).json<SuggestionsResponse>();

describe("GET /v1/suggestions", () => {
  it("is empty until something is liked", async () => {
    expect(await suggest()).toEqual({ suggestions: [], rated: 0, liked: 0 });
    await setState("tt0000004", "meh");
    expect(await suggest()).toEqual({ suggestions: [], rated: 1, liked: 0 });
  });

  it("ranks the pool by taste, says why, and leaves out titles with a state", async () => {
    await setState("tt0000001", "amazing");
    await setState("tt0000005", "want_to_watch");
    const answer = await suggest();
    expect(answer.rated).toBe(1);
    expect(answer.suggestions.map((s) => s.title.title)).toEqual(["Same Director", "Same Director Series"]);
    expect(answer.suggestions[0]!.because).toEqual({ imdbId: "tt0000001", title: "Liked" });
    expect(answer.suggestions[0]!.poster).toBe(false);
  });

  it("filters by kind", async () => {
    await setState("tt0000001", "good");
    expect((await suggest("?kind=series")).suggestions.map((s) => s.title.imdbId)).toEqual(["tt0000003"]);
  });

  it("sees a re-import: the pool's features are read again", async () => {
    await setState("tt0000001", "good");
    expect((await suggest()).suggestions).toHaveLength(3);
    t.db.prepare("DELETE FROM titles WHERE imdb_id = 'tt0000002'").run();
    t.db
      .prepare("INSERT INTO pool_imports (imported_at, min_votes, movies, series, took_ms) VALUES (1, 1000, 1, 1, 1)")
      .run();
    expect((await suggest()).suggestions.map((s) => s.title.imdbId)).not.toContain("tt0000002");
  });
});
