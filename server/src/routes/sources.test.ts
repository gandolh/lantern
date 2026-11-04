import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { NoKeyError, SourceError } from "../sources/http.js";
import { IMAGE_CACHE_CONTROL, MAX_IMAGE_BYTES } from "../sources/images.js";
import { fakeFetch, type FakeFetch } from "../sources/testing.js";
import { TitleNotFoundError } from "../sources/titles.js";
import { signIn, TEST_ORIGIN } from "../testing.js";
import { sourceFailure } from "./sources.js";

let app: FastifyInstance | undefined;
afterEach(async () => {
  await app?.close();
  app = undefined;
});

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);

function imageHost(): FakeFetch {
  return fakeFetch((url) => {
    if (url.pathname === "/t/p/w342/poster.jpg") return new Response(JPEG, { headers: { "content-type": "image/jpeg", "content-length": String(JPEG.length) } });
    if (url.pathname === "/t/p/w342/page.jpg") return new Response("<html>", { headers: { "content-type": "text/html" } });
    if (url.pathname === "/t/p/w342/huge.jpg") return new Response(new Uint8Array(MAX_IMAGE_BYTES + 1), { headers: { "content-type": "image/jpeg" } });
    return new Response("", { status: 404 });
  });
}

async function start(imageFetch: FakeFetch, keys: { tmdbApiKey?: string; omdbApiKey?: string } = {}) {
  app = await buildApp({ dbPath: ":memory:", publicOrigin: TEST_ORIGIN, imageFetch, ...keys });
  return { app, cookie: await signIn(app) };
}

describe("the poster proxy", () => {
  it("passes a TMDB poster on, with a private browser cache", async () => {
    const fetch = imageHost();
    const { app, cookie } = await start(fetch);
    const res = await app.inject({ url: "/lantern-api/v1/images/w342/poster.jpg", headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("image/jpeg");
    expect(res.headers["cache-control"]).toBe(IMAGE_CACHE_CONTROL);
    expect(res.rawPayload.equals(JPEG)).toBe(true);
    expect(fetch.calls[0]!.url.href).toBe("https://image.tmdb.org/t/p/w342/poster.jpg");
    expect(fetch.calls[0]!.redirect).toBe("error");
  });

  it("asks only for allowed sizes and TMDB file names", async () => {
    const fetch = imageHost();
    const { app, cookie } = await start(fetch);
    for (const url of [
      "/lantern-api/v1/images/original/poster.jpg",
      "/lantern-api/v1/images/w342/poster.svg",
      "/lantern-api/v1/images/w342/..%2Fposter.jpg",
      "/lantern-api/v1/images/w342/a.b.jpg",
    ]) {
      expect((await app.inject({ url, headers: { cookie } })).statusCode, url).toBe(404);
    }
    expect(fetch.calls).toHaveLength(0);
  });

  it("refuses what isn't an image, is too large, or isn't there", async () => {
    const { app, cookie } = await start(imageHost());
    expect((await app.inject({ url: "/lantern-api/v1/images/w342/page.jpg", headers: { cookie } })).statusCode).toBe(502);
    expect((await app.inject({ url: "/lantern-api/v1/images/w342/huge.jpg", headers: { cookie } })).statusCode).toBe(502);
    expect((await app.inject({ url: "/lantern-api/v1/images/w342/gone.jpg", headers: { cookie } })).statusCode).toBe(404);
  });

  it("is behind sign-in", async () => {
    const fetch = imageHost();
    const { app } = await start(fetch);
    expect((await app.inject({ url: "/lantern-api/v1/images/w342/poster.jpg" })).statusCode).toBe(401);
    expect(fetch.calls).toHaveLength(0);
  });
});

describe("GET /v1/sources", () => {
  it("says which keys are set, never their values", async () => {
    const { app, cookie } = await start(imageHost(), { tmdbApiKey: "tmdb-test-key" });
    const res = await app.inject({ url: "/lantern-api/v1/sources", headers: { cookie } });
    expect(res.json()).toEqual({ tmdb: true, omdb: false });
    expect(res.body).not.toContain("tmdb-test-key");
  });
});

describe("sourceFailure", () => {
  it("maps no key to 503, a missing title to 404 and a source's failure to 502", async () => {
    const server = Fastify();
    const errors: Record<string, Error> = {
      nokey: new NoKeyError("TMDB"),
      missing: new TitleNotFoundError("TMDB has no movie 1"),
      failed: new SourceError("timeout", "TMDB /3/movie/1: no answer in time"),
      other: new Error("a bug"),
    };
    server.get<{ Params: { kind: string } }>("/:kind", async (request, reply) => sourceFailure(reply, errors[request.params.kind]));
    const status = async (kind: string) => {
      const res = await server.inject({ url: `/${kind}` });
      return [res.statusCode, res.json().code];
    };
    expect(await status("nokey")).toEqual([503, "no_key"]);
    expect(await status("missing")).toEqual([404, "not_found"]);
    expect(await status("failed")).toEqual([502, "source_failed"]);
    expect((await server.inject({ url: "/other" })).statusCode).toBe(500);
    await server.close();
  });
});
