import { generateKeyPairSync } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildTestApp, signIn, TEST_PASSWORD, type TestApp } from "../../testing.js";

const ISSUER = "https://ward.example.com/ward-api/oidc";
const PREFIX = "/lantern-api/auth";

/** A client key Ward would have issued: an Ed25519 private JWK, base64url. */
function clientKey(): string {
  const jwk = { ...generateKeyPairSync("ed25519").privateKey.export({ format: "jwk" }), kid: "test-key" };
  return Buffer.from(JSON.stringify(jwk)).toString("base64url");
}

/** Ward's discovery document, the only thing a link start asks of Ward. */
const fakeWard: typeof fetch = (input) => {
  const url = String(input instanceof Request ? input.url : input);
  if (!url.endsWith("/.well-known/openid-configuration")) return Promise.resolve(new Response("{}", { status: 404 }));
  return Promise.resolve(
    Response.json({
      issuer: ISSUER,
      authorization_endpoint: `${ISSUER}/auth`,
      token_endpoint: `${ISSUER}/token`,
      jwks_uri: `${ISSUER}/jwks`,
      id_token_signing_alg_values_supported: ["EdDSA"],
    }),
  );
};

let t: TestApp;
let app: FastifyInstance;

beforeEach(async () => {
  t = await buildTestApp({
    ward: {
      issuer: ISSUER,
      clientId: "lantern",
      clientKey: clientKey(),
      redirectUri: "http://localhost:5180/lantern-api/auth/ward/callback",
      fetch: fakeWard,
    },
  });
  app = t.app;
});
afterEach(async () => {
  await app.close();
});

function link(cookie: string, payload?: unknown) {
  return app.inject({ method: "POST", url: `${PREFIX}/ward/link`, headers: { cookie }, payload: payload ?? {} });
}

describe("linking Ward", () => {
  it("asks for the password again", async () => {
    const cookie = await signIn(t);
    const res = await link(cookie);
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: "invalid_request" });
  });

  it("refuses a wrong password", async () => {
    const cookie = await signIn(t);
    const res = await link(cookie, { currentPassword: "not-the-password" });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ error: "invalid_credentials" });
  });

  it("slows down a run of wrong passwords", async () => {
    const cookie = await signIn(t);
    for (let i = 0; i < 5; i++) await link(cookie, { currentPassword: "not-the-password" });
    const res = await link(cookie, { currentPassword: "not-the-password" });
    expect(res.statusCode).toBe(429);
    expect(res.json()).toMatchObject({ error: "too_many_attempts" });
  });

  it("sends the browser to Ward with the right password", async () => {
    const cookie = await signIn(t);
    const res = await link(cookie, { currentPassword: TEST_PASSWORD });
    expect(res.statusCode).toBe(200);
    expect(JSON.stringify(res.json())).toContain(`${ISSUER}/auth`);
  });

  it("answers a signed-out request with 401", async () => {
    const res = await app.inject({ method: "POST", url: `${PREFIX}/ward/link`, payload: { currentPassword: "x" } });
    expect(res.statusCode).toBe(401);
  });
});
