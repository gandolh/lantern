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
  // The owner dropped TMDB for OMDb plus IMDb's files: titles are IMDb ids now.
  // No real data existed under TMDB's ids, so the states tables are rebuilt
  // rather than converted. OMDb's whole record is kept per title, found for
  // good; `poster` says whether it has one, for lists that show it only then.
  `
  DROP TABLE title_states;
  DROP TABLE card_skips;
  DROP TABLE tmdb_cache;
  DROP TABLE omdb_cache;
  CREATE TABLE title_states (
    user_id TEXT NOT NULL,
    imdb_id TEXT NOT NULL CHECK (imdb_id GLOB 'tt[0-9]*'),
    state TEXT NOT NULL CHECK (state IN ('awful', 'meh', 'good', 'amazing', 'not_interested', 'want_to_watch')),
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, imdb_id)
  ) WITHOUT ROWID;
  CREATE INDEX title_states_by_time ON title_states (user_id, updated_at DESC, imdb_id DESC);
  CREATE INDEX title_states_by_state ON title_states (user_id, state, updated_at DESC);
  CREATE TABLE card_skips (
    user_id TEXT NOT NULL,
    imdb_id TEXT NOT NULL CHECK (imdb_id GLOB 'tt[0-9]*'),
    skipped_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, imdb_id)
  ) WITHOUT ROWID;
  CREATE TABLE omdb_records (
    imdb_id TEXT PRIMARY KEY,
    outcome TEXT NOT NULL CHECK (outcome IN ('found', 'not_found')),
    body TEXT NOT NULL,
    poster INTEGER NOT NULL DEFAULT 0,
    fetched_at INTEGER NOT NULL
  );
  `,
  // The title pool, built from IMDb's non-commercial files by the import
  // command and replaced whole by each run; and a line per run.
  `
  CREATE TABLE titles (
    imdb_id TEXT PRIMARY KEY CHECK (imdb_id GLOB 'tt[0-9]*'),
    kind TEXT NOT NULL CHECK (kind IN ('movie', 'series')),
    imdb_type TEXT NOT NULL,
    title TEXT NOT NULL,
    search_title TEXT NOT NULL,
    start_year INTEGER,
    end_year INTEGER,
    runtime INTEGER,
    genres TEXT NOT NULL DEFAULT '',
    rating REAL NOT NULL,
    votes INTEGER NOT NULL,
    directors TEXT NOT NULL DEFAULT '',
    writers TEXT NOT NULL DEFAULT ''
  ) WITHOUT ROWID;
  CREATE INDEX titles_by_votes ON titles (votes DESC);
  CREATE INDEX titles_by_kind ON titles (kind, votes DESC);
  CREATE TABLE pool_imports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imported_at INTEGER NOT NULL,
    min_votes INTEGER NOT NULL,
    movies INTEGER NOT NULL,
    series INTEGER NOT NULL,
    took_ms INTEGER NOT NULL
  );
  `,
];

function migrate(db: Db, migrations: readonly string[]): void {
  const current = db.pragma("user_version", { simple: true }) as number;
  if (current > migrations.length) {
    throw new Error(`the database is at schema ${current}, newer than this server knows (${migrations.length})`);
  }
  for (const [offset, sql] of migrations.slice(current).entries()) {
    db.transaction(() => {
      db.exec(sql);
      db.pragma(`user_version = ${current + offset + 1}`);
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
