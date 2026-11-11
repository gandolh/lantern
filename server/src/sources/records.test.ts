import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type Db } from "../db.js";
import { DAY_MS, createRecordCache } from "./cache.js";
import { NoKeyError } from "./http.js";
import { createOmdbClient } from "./omdb.js";
import { createRecords } from "./records.js";
import { fakeFetch, fixture, immediateQueue, json, type FakeFetch } from "./testing.js";

let db: Db;
let clock: number;
let fetch: FakeFetch;
let answer: unknown;

const records = ({ apiKey }: { apiKey: string | undefined } = { apiKey: "omdb-test-key" }) =>
  createRecords({
    omdb: createOmdbClient({ apiKey, fetch, queue: immediateQueue() }),
    cache: createRecordCache(db, () => clock),
  });

beforeEach(() => {
  db = openDatabase(":memory:");
  clock = Date.UTC(2026, 10, 4, 12);
  answer = fixture("omdb-found");
  fetch = fakeFetch(() => json(answer));
});
afterEach(() => {
  db.close();
});

describe("OMDb's records", () => {
  it("asks once per title and keeps a found record for good", async () => {
    const r = records();
    expect(r.cached("tt1375666")).toBeUndefined();
    expect((await r.get("tt1375666"))?.title).toBe("Inception");
    clock += 400 * DAY_MS;
    await r.get("tt1375666");
    expect(fetch.calls).toHaveLength(1);
    expect(r.cached("tt1375666")?.title).toBe("Inception");
  });

  it("shares one call between callers asking at once", async () => {
    const r = records();
    await Promise.all([r.get("tt1375666"), r.get("tt1375666")]);
    expect(fetch.calls).toHaveLength(1);
  });

  it("keeps a not-found answer 30 days, and never a refusal", async () => {
    answer = fixture("omdb-not-found");
    const r = records();
    expect(await r.get("tt0000002")).toBeNull();
    expect(r.cached("tt0000002")).toBeNull();
    clock += 29 * DAY_MS;
    await r.get("tt0000002");
    expect(fetch.calls).toHaveLength(1);
    clock += DAY_MS;
    answer = fixture("omdb-limit");
    await expect(r.get("tt0000002")).rejects.toThrow(/Request limit reached/);
    await expect(r.get("tt0000002")).rejects.toThrow(/Request limit reached/);
    expect(fetch.calls).toHaveLength(3);
    expect(r.cached("tt0000002")).toBeUndefined();
  });

  it("knows which kept records have a poster", async () => {
    const r = records();
    await r.get("tt1375666");
    answer = fixture("omdb-na");
    await r.get("tt0000001");
    expect([...r.withPosters(["tt1375666", "tt0000001", "tt0000003"])]).toEqual(["tt1375666"]);
  });

  it("says no key without one", async () => {
    const r = records({ apiKey: undefined });
    expect(r.status).toEqual({ omdb: false });
    await expect(r.get("tt1375666")).rejects.toBeInstanceOf(NoKeyError);
  });
});
