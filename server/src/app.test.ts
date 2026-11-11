import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { errorBodySchema, healthResponseSchema } from "@lantern/shared";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { stripApiPrefix } from "./app.js";
import { buildTestApp } from "./testing.js";

let app: FastifyInstance | undefined;
let scratch: string | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
  if (scratch) rmSync(scratch, { recursive: true, force: true });
  scratch = undefined;
});

describe("stripApiPrefix", () => {
  it("strips the prefix only when a path, a query or the end follows it", () => {
    expect(stripApiPrefix("/lantern-api/v1/health")).toBe("/v1/health");
    expect(stripApiPrefix("/lantern-api")).toBe("/");
    expect(stripApiPrefix("/lantern-api?x=1")).toBe("/?x=1");
    expect(stripApiPrefix("/lantern-apix/v1")).toBe("/lantern-apix/v1");
    expect(stripApiPrefix("/v1/health")).toBe("/v1/health");
  });
});

describe("the API", () => {
  it("answers health bare and under the API prefix", async () => {
    app = (await buildTestApp()).app;
    for (const url of ["/v1/health", "/lantern-api/v1/health"]) {
      const res = await app.inject({ method: "GET", url });
      expect(res.statusCode).toBe(200);
      expect(healthResponseSchema.parse(res.json())).toEqual({ ok: true });
    }
  });

  it("answers an unknown route outside /v1 with the contract's error shape", async () => {
    app = (await buildTestApp()).app;
    const res = await app.inject({ method: "GET", url: "/lantern-api/nothing" });
    expect(res.statusCode).toBe(404);
    expect(errorBodySchema.parse(res.json()).code).toBe("not_found");
  });

  it("serves the built page at the base, with a fallback for the page's own paths", async () => {
    scratch = mkdtempSync(join(tmpdir(), "lantern-web-"));
    mkdirSync(join(scratch, "assets"));
    writeFileSync(join(scratch, "index.html"), "<!doctype html><title>Lantern</title>");
    writeFileSync(join(scratch, "assets", "app.js"), "console.log(1)");
    app = (await buildTestApp({ webDist: scratch })).app;

    expect((await app.inject({ method: "GET", url: "/" })).headers.location).toBe("/lantern/");
    expect((await app.inject({ method: "GET", url: "/lantern" })).headers.location).toBe("/lantern/");
    const page = await app.inject({ method: "GET", url: "/lantern/movie/603" });
    expect(page.statusCode).toBe(200);
    expect(page.body).toContain("<title>Lantern</title>");
    expect((await app.inject({ method: "GET", url: "/lantern/assets/app.js" })).body).toBe("console.log(1)");
    // An unknown path outside the base is never the page.
    expect((await app.inject({ method: "GET", url: "/elsewhere" })).statusCode).toBe(404);
  });
});
