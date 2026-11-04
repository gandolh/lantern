import type { Scores } from "@lantern/shared";
import type { Db } from "../db.js";

/**
 * The cache of what the sources answered, already trimmed by the readers,
 * so a page asked again costs no request.
 *
 * TMDB: each row is fresh for a while (`FRESH_FOR`), then refreshed the next
 * time it is used, and never served once `MAX_AGE_MS` old: TMDB's terms
 * allow caching its data for six months at most. Such rows are deleted when
 * the server starts and, at most hourly, when the cache is read; nothing runs
 * on a timer. Keys carry the readers' version, so a changed reader never
 * reads an old shape.
 *
 * OMDb: a found answer is kept for good (a title's scores are asked once); a
 * not-found one for 30 days; a refusal or a failure is never stored.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;
/** 180 days, under TMDB's six months. */
export const MAX_AGE_MS = 180 * DAY_MS;
export const FRESH_FOR = {
  details: 90 * DAY_MS,
  list: DAY_MS,
  search: DAY_MS,
  genres: 30 * DAY_MS,
} as const;
export const OMDB_NOT_FOUND_FOR_MS = 30 * DAY_MS;
const PURGE_EVERY_MS = 60 * 60 * 1000;

/** Bump when a reader's output changes shape; old rows then simply miss. */
export const READER_VERSION = 1;

export interface CacheHit<T> {
  value: T;
  fetchedAt: number;
  /** Younger than its kind's freshness: no need to ask again. */
  fresh: boolean;
}

export type OmdbCached = { outcome: "found"; scores: Scores } | { outcome: "not_found" };

export interface SourceCache {
  /** A TMDB row younger than `MAX_AGE_MS`, with whether it is still fresh. */
  get<T>(key: string, freshForMs: number): CacheHit<T> | undefined;
  put(key: string, value: unknown): void;
  delete(key: string): void;
  /** Delete every TMDB row `MAX_AGE_MS` old or older. Returns how many went. */
  purge(): number;
  /** `purge`, unless one ran in the last hour. */
  maybePurge(): void;
  getOmdb(imdbId: string): OmdbCached | undefined;
  putOmdb(imdbId: string, reading: OmdbCached): void;
}

export function cacheKey(...parts: (string | number)[]): string {
  return [`v${READER_VERSION}`, ...parts].join(":");
}

export function createSourceCache(db: Db, now: () => number = Date.now): SourceCache {
  const select = db.prepare<[string], { body: string; fetchedAt: number }>(
    "SELECT body, fetched_at AS fetchedAt FROM tmdb_cache WHERE key = ?",
  );
  const upsert = db.prepare<[string, string, number]>(`
    INSERT INTO tmdb_cache (key, body, fetched_at) VALUES (?, ?, ?)
    ON CONFLICT (key) DO UPDATE SET body = excluded.body, fetched_at = excluded.fetched_at`);
  const remove = db.prepare<[string]>("DELETE FROM tmdb_cache WHERE key = ?");
  const removeOld = db.prepare<[number]>("DELETE FROM tmdb_cache WHERE fetched_at <= ?");
  const selectOmdb = db.prepare<[string], { outcome: "found" | "not_found"; body: string; fetchedAt: number }>(
    "SELECT outcome, body, fetched_at AS fetchedAt FROM omdb_cache WHERE imdb_id = ?",
  );
  const upsertOmdb = db.prepare<[string, string, string, number]>(`
    INSERT INTO omdb_cache (imdb_id, outcome, body, fetched_at) VALUES (?, ?, ?, ?)
    ON CONFLICT (imdb_id) DO UPDATE SET outcome = excluded.outcome, body = excluded.body, fetched_at = excluded.fetched_at`);
  let lastPurge = Number.NEGATIVE_INFINITY;

  const cache: SourceCache = {
    get<T>(key: string, freshForMs: number) {
      const row = select.get(key);
      if (!row) return undefined;
      const age = now() - row.fetchedAt;
      if (age >= MAX_AGE_MS) return undefined;
      return { value: JSON.parse(row.body) as T, fetchedAt: row.fetchedAt, fresh: age < freshForMs };
    },
    put(key, value) {
      upsert.run(key, JSON.stringify(value), now());
    },
    delete(key) {
      remove.run(key);
    },
    purge() {
      lastPurge = now();
      return removeOld.run(lastPurge - MAX_AGE_MS).changes;
    },
    maybePurge() {
      if (now() - lastPurge >= PURGE_EVERY_MS) cache.purge();
    },
    getOmdb(imdbId) {
      const row = selectOmdb.get(imdbId);
      if (!row) return undefined;
      if (row.outcome === "not_found") return now() - row.fetchedAt < OMDB_NOT_FOUND_FOR_MS ? { outcome: "not_found" } : undefined;
      return { outcome: "found", scores: JSON.parse(row.body) as Scores };
    },
    putOmdb(imdbId, reading) {
      upsertOmdb.run(imdbId, reading.outcome, JSON.stringify(reading.outcome === "found" ? reading.scores : null), now());
    },
  };
  return cache;
}
