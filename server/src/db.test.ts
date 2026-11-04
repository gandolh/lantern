import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "./db.js";

let scratch: string | undefined;
afterEach(() => {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
  scratch = undefined;
});

describe("openDatabase", () => {
  it("runs each migration once, in order, and records the version", () => {
    scratch = mkdtempSync(join(tmpdir(), "lantern-db-"));
    const path = join(scratch, "nested", "lantern.sqlite");
    const migrations = ["CREATE TABLE a (x INTEGER);", "INSERT INTO a (x) VALUES (1);"];
    openDatabase(path, migrations).close();
    const db = openDatabase(path, migrations);
    expect(db.pragma("user_version", { simple: true })).toBe(2);
    expect(db.prepare("SELECT count(*) AS n FROM a").get()).toEqual({ n: 1 });
    db.close();
  });

  it("refuses a file whose schema is newer than the server", () => {
    scratch = mkdtempSync(join(tmpdir(), "lantern-db-"));
    const path = join(scratch, "lantern.sqlite");
    openDatabase(path, ["CREATE TABLE a (x INTEGER);"]).close();
    expect(() => openDatabase(path, [])).toThrow(/newer than this server knows/);
  });
});
