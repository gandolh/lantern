import type { ErrorBody, StateCountsResponse, StateRow, StatesResponse, TitleStateResponse } from "@lantern/shared";
import type { FastifyInstance, InjectOptions } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { signIn, TEST_ORIGIN } from "./testing.js";

let app: FastifyInstance;
let clock: number;
let cookie: string;

beforeEach(async () => {
  clock = Date.UTC(2026, 10, 4, 12);
  app = await buildApp({ dbPath: ":memory:", publicOrigin: TEST_ORIGIN, now: () => clock });
  cookie = await signIn(app);
});
afterEach(async () => {
  await app.close();
});

const call = (options: InjectOptions, as = cookie) =>
  app.inject({ ...options, headers: { cookie: as, origin: TEST_ORIGIN, ...options.headers } });
const setState = (type: string, id: number | string, state: string, as?: string) =>
  call({ method: "PUT", url: `/lantern-api/v1/titles/${type}/${id}/state`, payload: { state } }, as);
const getState = async (type: string, id: number, as?: string) =>
  (await call({ url: `/lantern-api/v1/titles/${type}/${id}/state` }, as)).json<TitleStateResponse>().row;
const list = async (query = "", as?: string) => (await call({ url: `/lantern-api/v1/states${query}` }, as)).json<StatesResponse>();

describe("a title's state", () => {
  it("is set, replaced and cleared", async () => {
    expect(await getState("movie", 603)).toBeNull();
    const set = await setState("movie", 603, "good");
    expect(set.statusCode).toBe(200);
    expect(set.json<StateRow>()).toEqual({ mediaType: "movie", tmdbId: 603, state: "good", updatedAt: clock });

    clock += 1000;
    await setState("movie", 603, "amazing");
    expect(await getState("movie", 603)).toEqual({ mediaType: "movie", tmdbId: 603, state: "amazing", updatedAt: clock });

    const cleared = await call({ method: "DELETE", url: "/lantern-api/v1/titles/movie/603/state" });
    expect(cleared.json()).toEqual({ cleared: true });
    expect((await call({ method: "DELETE", url: "/lantern-api/v1/titles/movie/603/state" })).json()).toEqual({ cleared: false });
    expect(await getState("movie", 603)).toBeNull();
  });

  it("is one at a time: rating a title on the watchlist takes it off", async () => {
    await setState("tv", 1399, "want_to_watch");
    expect((await list("?state=want_to_watch")).rows).toHaveLength(1);
    await setState("tv", 1399, "meh");
    expect((await list("?state=want_to_watch")).rows).toHaveLength(0);
    expect((await list("?state=rated")).rows.map((row) => row.state)).toEqual(["meh"]);
  });

  it("keeps a film and a series with the same id apart", async () => {
    await setState("movie", 1399, "awful");
    await setState("tv", 1399, "amazing");
    expect((await getState("movie", 1399))?.state).toBe("awful");
    expect((await getState("tv", 1399))?.state).toBe("amazing");
  });

  it("refuses a bad type, id or state, naming the field", async () => {
    for (const [type, id, state, field] of [
      ["book", 1, "good", "type"],
      ["movie", 0, "good", "id"],
      ["movie", "abc", "good", "id"],
      ["movie", 1, "great", "state"],
    ] as const) {
      const res = await setState(type, id, state);
      expect(res.statusCode, `${type}/${id}/${state}`).toBe(400);
      expect(res.json<ErrorBody>().message.startsWith(field)).toBe(true);
    }
    const extra = await call({ method: "PUT", url: "/lantern-api/v1/titles/movie/1/state", payload: { state: "good", note: "x" } });
    expect(extra.statusCode).toBe(400);
  });
});

describe("skips", () => {
  it("are kept apart from states, and a state drops one", async () => {
    expect((await call({ method: "POST", url: "/lantern-api/v1/titles/movie/11/skip" })).json()).toEqual({ skipped: true });
    await call({ method: "POST", url: "/lantern-api/v1/titles/movie/12/skip" });
    const skippedNow = () => [...app.states.skipped(firstUserId())].sort();
    expect(skippedNow()).toEqual(["movie:11", "movie:12"]);
    expect((await list()).rows).toHaveLength(0);

    await setState("movie", 11, "good");
    expect(skippedNow()).toEqual(["movie:12"]);
    expect((await call({ method: "DELETE", url: "/lantern-api/v1/titles/movie/12/skip" })).json()).toEqual({ skipped: false });
    expect(skippedNow()).toEqual([]);
  });
});

/** The only user's id, read straight from the library's table. */
function firstUserId(): string {
  return (app.db.prepare("SELECT id FROM auth_users LIMIT 1").get() as { id: string }).id;
}

describe("the list", () => {
  it("pages newest first, with filters", async () => {
    const titles: [string, number, string][] = [
      ["movie", 1, "good"],
      ["tv", 2, "awful"],
      ["movie", 3, "not_interested"],
      ["movie", 4, "want_to_watch"],
      ["tv", 5, "amazing"],
    ];
    for (const [type, id, state] of titles) {
      clock += 1000;
      await setState(type, id, state);
    }
    const first = await list("?limit=2");
    expect(first.rows.map((row) => row.tmdbId)).toEqual([5, 4]);
    const second = await list(`?limit=2&cursor=${first.next}`);
    expect(second.rows.map((row) => row.tmdbId)).toEqual([3, 2]);
    const third = await list(`?limit=2&cursor=${second.next}`);
    expect(third.rows.map((row) => row.tmdbId)).toEqual([1]);
    expect(third.next).toBeNull();

    expect((await list("?state=rated")).rows.map((row) => row.tmdbId)).toEqual([5, 2, 1]);
    expect((await list("?state=rated&type=tv")).rows.map((row) => row.tmdbId)).toEqual([5, 2]);
    expect((await list("?state=not_interested")).rows.map((row) => row.tmdbId)).toEqual([3]);
    expect((await call({ url: "/lantern-api/v1/states?state=liked" })).statusCode).toBe(400);
    expect((await call({ url: "/lantern-api/v1/states?cursor=nope" })).statusCode).toBe(400);
  });

  it("pages through titles set in the same millisecond without losing one", async () => {
    for (let id = 1; id <= 5; id++) await setState("movie", id, "good");
    const seen: number[] = [];
    let cursor: string | null = null;
    do {
      const page: StatesResponse = await list(`?limit=2${cursor ? `&cursor=${cursor}` : ""}`);
      seen.push(...page.rows.map((row) => row.tmdbId));
      cursor = page.next;
    } while (cursor !== null);
    expect(seen.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("counts per state and media type", async () => {
    await setState("movie", 1, "good");
    await setState("movie", 2, "good");
    await setState("tv", 3, "good");
    await setState("tv", 4, "want_to_watch");
    const { counts } = (await call({ url: "/lantern-api/v1/states/counts" })).json<StateCountsResponse>();
    expect(counts.good).toEqual({ movie: 2, tv: 1 });
    expect(counts.want_to_watch).toEqual({ movie: 0, tv: 1 });
    expect(counts.awful).toEqual({ movie: 0, tv: 0 });
  });

  it("finds the states of many titles at once", async () => {
    await setState("movie", 1, "good");
    await setState("tv", 2, "not_interested");
    const found = app.states.statesOf(firstUserId(), [
      { mediaType: "movie", tmdbId: 1 },
      { mediaType: "tv", tmdbId: 2 },
      { mediaType: "tv", tmdbId: 1 },
    ]);
    expect(Object.fromEntries(found)).toEqual({ "movie:1": "good", "tv:2": "not_interested" });
    expect(Object.fromEntries(app.states.allStated(firstUserId()))).toEqual({ "movie:1": "good", "tv:2": "not_interested" });
  });
});

describe("users and guards", () => {
  it("never shows one user's rows to another", async () => {
    const other = await signIn(app, "guest");
    await setState("movie", 603, "amazing");
    expect(await getState("movie", 603, other)).toBeNull();
    expect((await list("", other)).rows).toEqual([]);
    await setState("movie", 603, "awful", other);
    expect((await getState("movie", 603))?.state).toBe("amazing");
  });

  it("refuses a signed-out request and a cross-site write", async () => {
    const signedOut = await app.inject({ method: "PUT", url: "/lantern-api/v1/titles/movie/603/state", payload: { state: "good" } });
    expect(signedOut.statusCode).toBe(401);
    expect((await app.inject({ url: "/lantern-api/v1/states" })).statusCode).toBe(401);
    const crossSite = await call({
      method: "PUT",
      url: "/lantern-api/v1/titles/movie/603/state",
      payload: { state: "good" },
      headers: { origin: "https://elsewhere.example" },
    });
    expect(crossSite.statusCode).toBe(403);
    expect(await getState("movie", 603)).toBeNull();
  });
});
