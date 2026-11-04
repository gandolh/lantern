import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";

/**
 * Lantern's one SQLite file. The schema is versioned with `PRAGMA
 * user_version`: each migration runs once, in order, inside a transaction,
 * and bumps the version. Times are epoch milliseconds.
 */
export type Db = Database.Database;

/** Append only: a migration that has shipped is never edited. */
export const MIGRATIONS: string[] = [];

function migrate(db: Db, migrations: readonly string[]): void {
  const current = db.pragma("user_version", { simple: true }) as number;
  if (current > migrations.length) {
    throw new Error(`the database is at schema ${current}, newer than this server knows (${migrations.length})`);
  }
  for (let version = current; version < migrations.length; version++) {
    db.transaction(() => {
      db.exec(migrations[version]!);
      db.pragma(`user_version = ${version + 1}`);
    })();
  }
}

/** Open (or create) the file at `path`, or `:memory:` for tests, and bring its schema up to date. */
export function openDatabase(path: string, migrations: readonly string[] = MIGRATIONS): Db {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db, migrations);
  return db;
}
