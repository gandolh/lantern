import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { ErrorBody } from "@lantern/shared";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openAccounts, seedUser } from "./accounts.js";
import { buildApp, SESSION_COOKIE } from "./app.js";
import { openDatabase } from "./db.js";

const ORIGIN = "http://localhost:5180";
const PASSWORD = "p".repeat(12);

let app: FastifyInstance;

beforeEach(async () => {
  app = await buildApp({ dbPath: ":memory:", publicOrigin: ORIGIN });
});
afterEach(async () => {
  await app.close();
});

/** Seed the owner and sign in; the session cookie, ready for a `cookie` header. */
async function signIn(): Promise<string> {
  await seedUser(app.accounts, { username: "owner", password: PASSWORD });
  const res = await app.inject({ method: "POST", url: "/lantern-api/auth/login", payload: { username: "owner", password: PASSWORD } });
  expect(res.statusCode).toBe(200);
  const header = res.headers["set-cookie"];
  const lines = header === undefined ? [] : Array.isArray(header) ? header : [header];
  const line = lines.find((l) => l.startsWith(`${SESSION_COOKIE}=`));
  expect(line).toContain("Path=/lantern-api");
  expect(line).toContain("SameSite=Lax");
  expect(line).toContain("HttpOnly");
  return line!.split(";")[0]!;
}

describe("the guard", () => {
  it("leaves health open", async () => {
    expect((await app.inject({ url: "/lantern-api/v1/health" })).json()).toEqual({ ok: true });
  });

  it("refuses a signed-out request under /v1, in the API's error shape", async () => {
    for (const method of ["GET", "PUT", "DELETE"] as const) {
      const res = await app.inject({ method, url: "/lantern-api/v1/states" });
      expect(res.statusCode, method).toBe(401);
      expect(res.json<ErrorBody>()).toEqual({ code: "unauthorized", message: "sign in to Lantern first" });
    }
  });

  it("lets a signed-in session through", async () => {
    const cookie = await signIn();
    const res = await app.inject({ url: "/lantern-api/v1/nothing-here", headers: { cookie } });
    expect(res.statusCode).toBe(404);
    const session = await app.inject({ url: "/lantern-api/auth/session", headers: { cookie } });
    expect(session.statusCode).toBe(200);
    expect(JSON.stringify(session.json())).toContain("owner");
  });

  it("refuses a wrong password", async () => {
    await seedUser(app.accounts, { username: "owner", password: PASSWORD });
    const res = await app.inject({ method: "POST", url: "/lantern-api/auth/login", payload: { username: "owner", password: "wrong-password" } });
    expect(res.statusCode).toBe(401);
    expect(res.headers["set-cookie"] ?? "").not.toContain(`${SESSION_COOKIE}=`);
  });

  it("refuses a write from another site, but not from this one or from a script", async () => {
    const cookie = await signIn();
    const url = "/lantern-api/v1/nothing-here";
    const other = await app.inject({ method: "POST", url, headers: { cookie, origin: "https://elsewhere.example" }, payload: {} });
    expect(other.statusCode).toBe(403);
    expect(other.json<ErrorBody>().code).toBe("cross_site");
    const crossFetch = await app.inject({ method: "DELETE", url, headers: { cookie, "sec-fetch-site": "cross-site" } });
    expect(crossFetch.statusCode).toBe(403);
    expect((await app.inject({ method: "POST", url, headers: { cookie, origin: ORIGIN }, payload: {} })).statusCode).toBe(404);
    expect((await app.inject({ method: "POST", url, headers: { cookie }, payload: {} })).statusCode).toBe(404);
  });

  it("has no rename and no sign-up", async () => {
    const cookie = await signIn();
    const rename = await app.inject({ method: "POST", url: "/lantern-api/auth/username", headers: { cookie }, payload: { username: "someone" } });
    expect(rename.statusCode).toBe(404);
    const payload = { username: "x", password: PASSWORD };
    // Signed out, the guard refuses it before the router can say it doesn't exist.
    expect((await app.inject({ method: "POST", url: "/lantern-api/auth/register", payload })).statusCode).toBe(401);
    expect((await app.inject({ method: "POST", url: "/lantern-api/auth/register", headers: { cookie }, payload })).statusCode).toBe(404);
  });

  it("says Ward is off when it isn't set up", async () => {
    const session = await app.inject({ url: "/lantern-api/auth/session" });
    expect(JSON.stringify(session.json())).toMatch(/"enabled":false/);
  });
});

describe("the seed", () => {
  it("creates a user once, then leaves it alone", async () => {
    const db = openDatabase(":memory:");
    const accounts = openAccounts(db);
    expect(await seedUser(accounts, { username: "Owner", password: PASSWORD })).toBe(true);
    expect(await seedUser(accounts, { username: "owner", password: "another-password" })).toBe(false);
    db.close();
  });

  it("runs as a command against a scratch database, from the environment, with no prompt", () => {
    const scratch = mkdtempSync(join(tmpdir(), "lantern-seed-"));
    try {
      const run = () =>
        spawnSync(process.execPath, ["--import", "tsx", fileURLToPath(new URL("./seed.ts", import.meta.url))], {
          env: { ...process.env, LANTERN_DB: join(scratch, "seed.sqlite"), SEED_USERNAME: "owner", SEED_PASSWORD: PASSWORD },
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        });
      const first = run();
      expect(first.status, first.stderr).toBe(0);
      expect(first.stdout).toContain("Created owner.");
      const second = run();
      expect(second.stdout).toContain("owner already exists; left as it was.");
      expect(first.stdout + second.stdout + first.stderr + second.stderr).not.toContain(PASSWORD);
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  });
});
