import { errorBodySchema, healthResponseSchema } from "@lantern/shared";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { buildTestApp, signIn } from "../../testing.js";

let app: FastifyInstance;
afterEach(async () => {
  await app.close();
});

describe("GET /v1/health", () => {
  it("is open to anyone, bare and under the API prefix", async () => {
    ({ app } = await buildTestApp());
    for (const url of ["/v1/health", "/lantern-api/v1/health"]) {
      const res = await app.inject({ method: "GET", url });
      expect(res.statusCode).toBe(200);
      expect(healthResponseSchema.parse(res.json())).toEqual({ ok: true });
    }
  });

  it("answers a 500 `internal`, with no detail, when a reply fails its response schema", async () => {
    const test = await buildTestApp();
    app = test.app;
    // A route stubbed to send the wrong shape under the same schema.
    app.get("/v1/health-wrong", { schema: { response: { 200: healthResponseSchema } } }, async () => ({ nope: 1 }));
    const cookie = await signIn(test);
    const res = await app.inject({ method: "GET", url: "/lantern-api/v1/health-wrong", headers: { cookie } });
    expect(res.statusCode).toBe(500);
    expect(errorBodySchema.parse(res.json())).toEqual({
      code: "internal",
      message: "Lantern hit an error; see its log",
    });
  });
});
