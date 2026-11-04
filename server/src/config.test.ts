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
    });
    expect(config).toEqual({
      host: "0.0.0.0",
      port: 9000,
      dbPath: "/data/lantern.sqlite",
      publicOrigin: "https://example.com",
      apiPrefix: "/films-api",
      webBase: "/films/",
    });
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
