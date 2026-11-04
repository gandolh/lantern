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
export const MIGRATIONS: string[] = [
  // The owner's own data: a title's state per user, and the skipped cards.
  // A title is its media type and TMDB's id; no TMDB fact is stored here, so
  // nothing in these tables falls under TMDB's six-month cache rule.
  `
  CREATE TABLE title_states (
    user_id TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
    tmdb_id INTEGER NOT NULL CHECK (tmdb_id > 0),
    state TEXT NOT NULL CHECK (state IN ('awful', 'meh', 'good', 'amazing', 'not_interested', 'want_to_watch')),
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, media_type, tmdb_id)
  ) WITHOUT ROWID;
  CREATE INDEX title_states_by_time ON title_states (user_id, updated_at DESC, media_type DESC, tmdb_id DESC);
  CREATE INDEX title_states_by_state ON title_states (user_id, state, updated_at DESC);
  CREATE TABLE card_skips (
    user_id TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
    tmdb_id INTEGER NOT NULL CHECK (tmdb_id > 0),
    skipped_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, media_type, tmdb_id)
  ) WITHOUT ROWID;
  `,
  // The cache of what TMDB and OMDb answered, already trimmed by the readers.
  // TMDB's rows are deleted once 180 days old (its terms allow six months);
  // OMDb's found answers are kept, since a title's scores are asked once.
  `
  CREATE TABLE tmdb_cache (
    key TEXT PRIMARY KEY,
    body TEXT NOT NULL,
    fetched_at INTEGER NOT NULL
  );
  CREATE INDEX tmdb_cache_by_age ON tmdb_cache (fetched_at);
  CREATE TABLE omdb_cache (
    imdb_id TEXT PRIMARY KEY,
    outcome TEXT NOT NULL CHECK (outcome IN ('found', 'not_found')),
    body TEXT NOT NULL,
    fetched_at INTEGER NOT NULL
  );
  `,
];

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
