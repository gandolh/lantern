import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ConfigError, DEV_ORIGIN, loadConfig, loadEnvFile, loadSeedConfig, repoRoot, resolveDbPath } from "./config.js";

describe("loadConfig", () => {
  it("has defaults for local development", () => {
    expect(loadConfig({})).toEqual({
      host: "127.0.0.1",
      port: 8810,
      dbPath: undefined,
      publicOrigin: DEV_ORIGIN,
      apiPrefix: "/lantern-api",
      webBase: "/lantern/",
      ward: undefined,
      trustedProxies: [],
      omdbApiKey: undefined,
    });
  });

  it("treats an empty value as unset", () => {
    const config = loadConfig({ HOST: "", PORT: " ", LANTERN_DB: "", PUBLIC_ORIGIN: "", LANTERN_BASE: "" });
    expect(config.host).toBe("127.0.0.1");
    expect(config.port).toBe(8810);
    expect(config.dbPath).toBeUndefined();
    expect(config.webBase).toBe("/lantern/");
  });

  it("reads what is set", () => {
    const config = loadConfig({
      HOST: "0.0.0.0",
      PORT: "9000",
      LANTERN_DB: "/data/lantern.sqlite",
      PUBLIC_ORIGIN: "https://example.com",
      LANTERN_API_PREFIX: "/films-api",
      LANTERN_BASE: "/films/",
      AUTH_TRUSTED_PROXIES: " 10.0.0.0/8, ,172.16.0.1 ",
    });
    expect(config).toEqual({
      host: "0.0.0.0",
      port: 9000,
      dbPath: "/data/lantern.sqlite",
      publicOrigin: "https://example.com",
      apiPrefix: "/films-api",
      webBase: "/films/",
      ward: undefined,
      trustedProxies: ["10.0.0.0/8", "172.16.0.1"],
      omdbApiKey: undefined,
    });
  });

  it("reads the key trimmed, and never repeats it in an error", () => {
    expect(loadConfig({ OMDB_API_KEY: " omdb-test-key " }).omdbApiKey).toBe("omdb-test-key");
    expect(loadConfig({ OMDB_API_KEY: "  " }).omdbApiKey).toBeUndefined();
    let message = "";
    try {
      loadConfig({ OMDB_API_KEY: "two words-secret-ish" });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/^OMDB_API_KEY must be one value/);
    expect(message).not.toContain("secret-ish");
  });

  it("names every variable at fault, one line each", () => {
    let error: unknown;
    try {
      loadConfig({ PORT: "eighty", PUBLIC_ORIGIN: "https://example.com/lantern", LANTERN_BASE: "/lantern" });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(ConfigError);
    const lines = (error as Error).message.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines.some((line) => line.startsWith("PORT"))).toBe(true);
    expect(lines.some((line) => line.startsWith("PUBLIC_ORIGIN"))).toBe(true);
    expect(lines.some((line) => line.startsWith("LANTERN_BASE"))).toBe(true);
  });

  it("refuses a port out of range", () => {
    expect(() => loadConfig({ PORT: "70000" })).toThrow(/PORT must be a port number/);
  });
});

describe("the Ward settings", () => {
  const ward = {
    WARD_OIDC_ISSUER: "https://ward.example.com",
    WARD_OIDC_CLIENT_ID: "lantern",
    // Not a usable key; config only checks it is set, the client imports it at start.
    WARD_OIDC_CLIENT_KEY: "not-checked-here",
    WARD_OIDC_POST_LOGOUT_REDIRECT_URI: "https://example.com/lantern/",
  };

  it("are off when the issuer is empty", () => {
    expect(loadConfig({ WARD_OIDC_ISSUER: "" }).ward).toBeUndefined();
  });

  it("refuse a half-set Ward", () => {
    expect(() => loadConfig({ WARD_OIDC_ISSUER: "https://ward.example.com" })).toThrow(/WARD_OIDC_ISSUER empty/);
  });

  it("want Ward's callback under the API prefix, and never repeat the key", () => {
    let message = "";
    try {
      loadConfig({ ...ward, WARD_OIDC_REDIRECT_URI: "https://example.com/auth/ward/callback" });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/\/lantern-api\/auth\/ward\/callback/);
    expect(message).not.toContain("not-checked-here");
    const config = loadConfig({
      ...ward,
      WARD_OIDC_REDIRECT_URI: "https://example.com/lantern-api/auth/ward/callback",
    });
    expect(config.ward?.clientId).toBe("lantern");
  });
});

describe("repoRoot", () => {
  it("is the repo: its package.json is lantern's, beside the lockfile", () => {
    const root = repoRoot();
    expect((JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { name: string }).name).toBe("lantern");
    expect(readFileSync(join(root, "package-lock.json"), "utf8")).toContain('"name": "lantern"');
  });
});

describe("resolveDbPath", () => {
  it("is LANTERN_DB, else data/lantern.sqlite under the repo root, and keeps :memory:", () => {
    expect(resolveDbPath(loadConfig({ LANTERN_DB: "/tmp/x.sqlite" }))).toBe("/tmp/x.sqlite");
    expect(resolveDbPath(loadConfig({}))).toBe(resolve(repoRoot(), "data/lantern.sqlite"));
    expect(resolveDbPath(loadConfig({ LANTERN_DB: ":memory:" }))).toBe(":memory:");
  });
});

describe("loadSeedConfig", () => {
  it("reads the two seed variables, trimming the name and keeping the password as given", () => {
    expect(loadSeedConfig({ SEED_USERNAME: " owner ", SEED_PASSWORD: " a b " })).toEqual({
      username: "owner",
      password: " a b ",
    });
    expect(loadSeedConfig({})).toEqual({ username: undefined, password: undefined });
  });
});

describe("loadEnvFile", () => {
  let scratch: string | undefined;
  afterEach(() => {
    if (scratch) rmSync(scratch, { recursive: true, force: true });
    scratch = undefined;
    delete process.env.LANTERN_TEST_ENV_FILE;
  });

  it("reads a .env into the environment, and says so when there is none", () => {
    scratch = mkdtempSync(join(tmpdir(), "lantern-env-"));
    const file = join(scratch, ".env");
    writeFileSync(file, "LANTERN_TEST_ENV_FILE=from-file\n");
    expect(loadEnvFile(file)).toBe(true);
    expect(process.env.LANTERN_TEST_ENV_FILE).toBe("from-file");
    expect(loadEnvFile(join(scratch, "missing.env"))).toBe(false);
  });
});
