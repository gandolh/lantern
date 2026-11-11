import { errorBodySchema, poolInfoSchema } from "@lantern/shared";
import { afterEach, describe, expect, it } from "vitest";
import { buildTestApp, seedPool, signIn, type TestApp } from "../../testing.js";

let test: TestApp | undefined;
afterEach(async () => {
  await test?.app.close();
  test = undefined;
});

describe("GET /v1/pool", () => {
  it("counts the pool by kind", async () => {
    test = await buildTestApp();
    seedPool(test.db, [
      { imdbId: "tt0000001", title: "One" },
      { imdbId: "tt0000002", title: "Two", kind: "series" },
    ]);
    const cookie = await signIn(test);
    const res = await test.app.inject({ url: "/lantern-api/v1/pool", headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(poolInfoSchema.parse(res.json())).toMatchObject({ titles: 2, movies: 1, series: 1 });
  });

  it("strips a field the schema does not name, and a reply that breaks it is a 500 with no detail", async () => {
    const stub = (info: unknown) => ({
      info: () => info as never,
      get: () => undefined,
      getMany: () => new Map(),
      search: () => [],
    });
    test = await buildTestApp({
      pool: {
        ...stub({ titles: 1, movies: 1, series: 0, importedAt: null, minVotes: null, internalPath: "/secret" }),
      },
    });
    const cookie = await signIn(test);
    const res = await test.app.inject({ url: "/lantern-api/v1/pool", headers: { cookie } });
    expect(res.json()).toEqual({ titles: 1, movies: 1, series: 0, importedAt: null, minVotes: null });
    await test.app.close();

    test = await buildTestApp({ pool: stub({ titles: "many" }) });
    const broken = await test.app.inject({
      url: "/lantern-api/v1/pool",
      headers: { cookie: await signIn(test) },
    });
    expect(broken.statusCode).toBe(500);
    expect(errorBodySchema.parse(broken.json())).toEqual({
      code: "internal",
      message: "Lantern hit an error; see its log",
    });
  });
});
