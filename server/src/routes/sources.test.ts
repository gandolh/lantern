import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { NoKeyError, SourceError } from "../sources/http.js";
import { createOmdbClient } from "../sources/omdb.js";
import { MAX_POSTER_BYTES, POSTER_CACHE_CONTROL, posterUrlFor } from "../sources/posters.js";
import { fakeFetch, fixture, immediateQueue, json, type FakeFetch } from "../sources/testing.js";
import { signIn, TEST_ORIGIN } from "../testing.js";
import { sourceFailure } from "./sources.js";

let app: FastifyInstance | undefined;
afterEach(async () => {
  await app?.close();
  app = undefined;
});

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
const POSTER = "/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg";

function posterHost(answers: Record<string, () => Response> = {}): FakeFetch {
  return fakeFetch((url) => {
    const answer = answers[url.pathname];
    if (answer) return answer();
    if (url.pathname === POSTER) return new Response(JPEG, { headers: { "content-type": "image/jpeg" } });
    return new Response("", { status: 404 });
  });
}

async function start(posterFetch: FakeFetch, omdbAnswer: unknown = fixture("omdb-found")) {
  const omdbFetch = fakeFetch(() => json(omdbAnswer));
  app = await buildApp({
    dbPath: ":memory:",
    publicOrigin: TEST_ORIGIN,
    posterFetch,
    omdb: createOmdbClient({ apiKey: "omdb-test-key", fetch: omdbFetch, queue: immediateQueue() }),
  });
  return { app, cookie: await signIn(app), omdbFetch };
}

describe("the poster proxy", () => {
  it("serves only a kept record's poster, and never asks OMDb for one", async () => {
    const fetch = posterHost();
    const { app, cookie, omdbFetch } = await start(fetch);
    expect((await app.inject({ url: "/lantern-api/v1/posters/tt1375666", headers: { cookie } })).statusCode).toBe(404);
    expect(omdbFetch.calls).toHaveLength(0);

    await app.records.get("tt1375666");
    const res = await app.inject({ url: "/lantern-api/v1/posters/tt1375666", headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("image/jpeg");
    expect(res.headers["cache-control"]).toBe(POSTER_CACHE_CONTROL);
    expect(res.rawPayload.equals(JPEG)).toBe(true);
    expect(fetch.calls[0]!.url.hostname).toBe("m.media-amazon.com");
    expect(fetch.calls[0]!.redirect).toBe("error");
  });

  it("asks for the large size, and falls back to OMDb's own", async () => {
    const fetch = posterHost();
    const { app, cookie } = await start(fetch);
    await app.records.get("tt1375666");
    const res = await app.inject({ url: "/lantern-api/v1/posters/tt1375666?size=large", headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(fetch.calls.map((call) => call.url.pathname)).toEqual([POSTER.replace("_SX300", "_SX760"), POSTER]);
    expect(posterUrlFor("https://m.media-amazon.com/a.jpg", "large")).toBe("https://m.media-amazon.com/a.jpg");
    expect(posterUrlFor("https://m.media-amazon.com/images/M/MV5Bx@._V1_QL75_UX380_CR0,0,380,562_.jpg", "large")).toBe(
      "https://m.media-amazon.com/images/M/MV5Bx@._V1_SX760.jpg",
    );
  });

  it("refuses a bad id or size, what isn't an image, and what is too large", async () => {
    const { app, cookie } = await start(
      posterHost({
        [POSTER]: () => new Response(new Uint8Array(MAX_POSTER_BYTES + 1), { headers: { "content-type": "image/jpeg" } }),
      }),
    );
    await app.records.get("tt1375666");
    expect((await app.inject({ url: "/lantern-api/v1/posters/603", headers: { cookie } })).statusCode).toBe(404);
    expect((await app.inject({ url: "/lantern-api/v1/posters/tt1375666?size=huge", headers: { cookie } })).statusCode).toBe(404);
    expect((await app.inject({ url: "/lantern-api/v1/posters/tt1375666", headers: { cookie } })).statusCode).toBe(502);

    const page = await start(posterHost({ [POSTER]: () => new Response("<html>", { headers: { "content-type": "text/html" } }) }));
    await page.app.records.get("tt1375666");
    expect((await page.app.inject({ url: "/lantern-api/v1/posters/tt1375666", headers: { cookie: page.cookie } })).statusCode).toBe(502);
  });

  it("is behind sign-in", async () => {
    const fetch = posterHost();
    const { app } = await start(fetch);
    await app.records.get("tt1375666");
    expect((await app.inject({ url: "/lantern-api/v1/posters/tt1375666" })).statusCode).toBe(401);
    expect(fetch.calls).toHaveLength(0);
  });
});

describe("GET /v1/sources", () => {
  it("says whether the key is set, never its value", async () => {
    const { app, cookie } = await start(posterHost());
    const res = await app.inject({ url: "/lantern-api/v1/sources", headers: { cookie } });
    expect(res.json()).toEqual({ omdb: true });
    expect(res.body).not.toContain("omdb-test-key");
  });
});

describe("sourceFailure", () => {
  it("maps no key to 503 and a source's failure to 502", async () => {
    const server = Fastify();
    const errors: Record<string, Error> = {
      nokey: new NoKeyError("OMDb"),
      failed: new SourceError("refused", "OMDb refused: Request limit reached!"),
      other: new Error("a bug"),
    };
    server.get<{ Params: { kind: string } }>("/:kind", async (request, reply) => sourceFailure(reply, errors[request.params.kind]));
    const status = async (kind: string) => {
      const res = await server.inject({ url: `/${kind}` });
      return [res.statusCode, res.json().code];
    };
    expect(await status("nokey")).toEqual([503, "no_key"]);
    expect(await status("failed")).toEqual([502, "source_failed"]);
    expect((await server.inject({ url: "/other" })).statusCode).toBe(500);
    await server.close();
  });
});
