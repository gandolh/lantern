import { describe, expect, it } from "vitest";
import { ConfigError, DEV_ORIGIN, loadConfig } from "./config.js";

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
      tmdbApiKey: undefined,
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
      tmdbApiKey: undefined,
      omdbApiKey: undefined,
    });
  });

  it("reads the keys trimmed, and never repeats one in an error", () => {
    const config = loadConfig({ TMDB_API_KEY: " tmdb-test-key ", OMDB_API_KEY: "omdb-test-key" });
    expect(config.tmdbApiKey).toBe("tmdb-test-key");
    expect(config.omdbApiKey).toBe("omdb-test-key");
    expect(loadConfig({ TMDB_API_KEY: "", OMDB_API_KEY: "  " }).tmdbApiKey).toBeUndefined();
    let message = "";
    try {
      loadConfig({ TMDB_API_KEY: "two words-secret-ish" });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/^TMDB_API_KEY must be one value/);
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
    const config = loadConfig({ ...ward, WARD_OIDC_REDIRECT_URI: "https://example.com/lantern-api/auth/ward/callback" });
    expect(config.ward?.clientId).toBe("lantern");
  });
});
