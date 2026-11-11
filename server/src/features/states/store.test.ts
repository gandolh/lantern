import type { ErrorBody, StateCountsResponse, StateRow, StatesResponse, TitleStateResponse } from "@lantern/shared";
import type { FastifyInstance, InjectOptions } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signIn, TEST_ORIGIN, buildTestApp, type TestApp } from "../../testing.js";

let app: FastifyInstance;
let t: TestApp;
let clock: number;
let cookie: string;

beforeEach(async () => {
  clock = Date.UTC(2026, 10, 4, 12);
  t = await buildTestApp({ now: () => clock });
  app = t.app;
  cookie = await signIn(t);
});
afterEach(async () => {
  await app.close();
});

const tt = (n: number) => `tt${String(n).padStart(7, "0")}`;
const call = (options: InjectOptions, as = cookie) =>
  app.inject({ ...options, headers: { cookie: as, origin: TEST_ORIGIN, ...options.headers } });
const setState = (id: string, state: string, as?: string) =>
  call({ method: "PUT", url: `/lantern-api/v1/titles/${id}/state`, payload: { state } }, as);
const getState = async (id: string, as?: string) =>
  (await call({ url: `/lantern-api/v1/titles/${id}/state` }, as)).json<TitleStateResponse>().row;
const list = async (query = "", as?: string) =>
  (await call({ url: `/lantern-api/v1/states${query}` }, as)).json<StatesResponse>();

/** The only user's id, read straight from the library's table. */
function firstUserId(): string {
  return (t.db.prepare("SELECT id FROM auth_users LIMIT 1").get() as { id: string }).id;
}

describe("a title's state", () => {
  it("is set, replaced and cleared", async () => {
    expect(await getState("tt1375666")).toBeNull();
    const set = await setState("tt1375666", "good");
    expect(set.statusCode).toBe(200);
    expect(set.json<StateRow>()).toEqual({ imdbId: "tt1375666", state: "good", updatedAt: clock });
    clock += 1000;
    await setState("tt1375666", "amazing");
    expect(await getState("tt1375666")).toEqual({ imdbId: "tt1375666", state: "amazing", updatedAt: clock });
    expect((await call({ method: "DELETE", url: "/lantern-api/v1/titles/tt1375666/state" })).json()).toEqual({
      cleared: true,
    });
    expect((await call({ method: "DELETE", url: "/lantern-api/v1/titles/tt1375666/state" })).json()).toEqual({
      cleared: false,
    });
    expect(await getState("tt1375666")).toBeNull();
  });

  it("is one at a time: rating a title on the watchlist takes it off", async () => {
    await setState("tt0944947", "want_to_watch");
    expect((await list("?state=want_to_watch")).rows).toHaveLength(1);
    await setState("tt0944947", "meh");
    expect((await list("?state=want_to_watch")).rows).toHaveLength(0);
    expect((await list("?state=rated")).rows.map((row) => row.state)).toEqual(["meh"]);
  });

  it("refuses a bad id or state, naming the field", async () => {
    for (const [id, state, field] of [
      ["603", "good", "id"],
      ["tt12", "good", "id"],
      ["nm0634240", "good", "id"],
      ["tt1375666", "great", "state"],
    ] as const) {
      const res = await setState(id, state);
      expect(res.statusCode, `${id}/${state}`).toBe(400);
      expect(res.json<ErrorBody>().message.startsWith(field)).toBe(true);
    }
    const extra = await call({
      method: "PUT",
      url: "/lantern-api/v1/titles/tt1375666/state",
      payload: { state: "good", note: "x" },
    });
    expect(extra.statusCode).toBe(400);
  });
});

describe("skips", () => {
  it("are kept apart from states, and a state drops one", async () => {
    expect((await call({ method: "POST", url: `/lantern-api/v1/titles/${tt(11)}/skip` })).json()).toEqual({
      skipped: true,
    });
    await call({ method: "POST", url: `/lantern-api/v1/titles/${tt(12)}/skip` });
    const skippedNow = () => [...t.states.skipped(firstUserId())].sort();
    expect(skippedNow()).toEqual([tt(11), tt(12)]);
    expect((await list()).rows).toHaveLength(0);
    await setState(tt(11), "good");
    expect(skippedNow()).toEqual([tt(12)]);
    expect((await call({ method: "DELETE", url: `/lantern-api/v1/titles/${tt(12)}/skip` })).json()).toEqual({
      skipped: false,
    });
    expect(skippedNow()).toEqual([]);
  });
});

describe("the list", () => {
  it("pages newest first, with filters", async () => {
    const titles: [number, string][] = [
      [1, "good"],
      [2, "awful"],
      [3, "not_interested"],
      [4, "want_to_watch"],
      [5, "amazing"],
    ];
    for (const [n, state] of titles) {
      clock += 1000;
      await setState(tt(n), state);
    }
    const first = await list("?limit=2");
    expect(first.rows.map((row) => row.imdbId)).toEqual([tt(5), tt(4)]);
    const second = await list(`?limit=2&cursor=${first.next}`);
    expect(second.rows.map((row) => row.imdbId)).toEqual([tt(3), tt(2)]);
    const third = await list(`?limit=2&cursor=${second.next}`);
    expect(third.rows.map((row) => row.imdbId)).toEqual([tt(1)]);
    expect(third.next).toBeNull();
    expect((await list("?state=rated")).rows.map((row) => row.imdbId)).toEqual([tt(5), tt(2), tt(1)]);
    expect((await list("?state=not_interested")).rows.map((row) => row.imdbId)).toEqual([tt(3)]);
    expect((await call({ url: "/lantern-api/v1/states?state=liked" })).statusCode).toBe(400);
    expect((await call({ url: "/lantern-api/v1/states?cursor=nope" })).statusCode).toBe(400);
  });

  it("pages through titles set in the same millisecond without losing one", async () => {
    for (let n = 1; n <= 5; n++) await setState(tt(n), "good");
    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const page: StatesResponse = await list(`?limit=2${cursor ? `&cursor=${cursor}` : ""}`);
      seen.push(...page.rows.map((row) => row.imdbId));
      cursor = page.next;
    } while (cursor !== null);
    expect(seen.sort()).toEqual([1, 2, 3, 4, 5].map(tt));
  });

  it("counts per state", async () => {
    await setState(tt(1), "good");
    await setState(tt(2), "good");
    await setState(tt(3), "want_to_watch");
    const { counts } = (await call({ url: "/lantern-api/v1/states/counts" })).json<StateCountsResponse>();
    expect(counts).toMatchObject({ good: 2, want_to_watch: 1, awful: 0 });
  });

  it("finds the states of many titles at once", async () => {
    await setState(tt(1), "good");
    await setState(tt(2), "not_interested");
    expect(Object.fromEntries(t.states.statesOf(firstUserId(), [tt(1), tt(2), tt(3)]))).toEqual({
      [tt(1)]: "good",
      [tt(2)]: "not_interested",
    });
    expect(Object.fromEntries(t.states.allStated(firstUserId()))).toEqual({
      [tt(1)]: "good",
      [tt(2)]: "not_interested",
    });
  });
});

describe("users and guards", () => {
  it("never shows one user's rows to another", async () => {
    const other = await signIn(t, "guest");
    await setState("tt1375666", "amazing");
    expect(await getState("tt1375666", other)).toBeNull();
    expect((await list("", other)).rows).toEqual([]);
    await setState("tt1375666", "awful", other);
    expect((await getState("tt1375666"))?.state).toBe("amazing");
  });

  it("refuses a signed-out request and a cross-site write", async () => {
    const signedOut = await app.inject({
      method: "PUT",
      url: "/lantern-api/v1/titles/tt1375666/state",
      payload: { state: "good" },
    });
    expect(signedOut.statusCode).toBe(401);
    const crossSite = await call({
      method: "PUT",
      url: "/lantern-api/v1/titles/tt1375666/state",
      payload: { state: "good" },
      headers: { origin: "https://elsewhere.example" },
    });
    expect(crossSite.statusCode).toBe(403);
    expect(await getState("tt1375666")).toBeNull();
  });
});
