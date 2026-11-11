import type { Db } from "../db.js";
import type { StoredRecord } from "./omdb.js";

/**
 * OMDb's records, kept so a title shown again costs no call: a found record
 * for good (a title's details are asked once), a not-found answer for 30
 * days (OMDb may add the title), a refusal or a failure never.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;
export const NOT_FOUND_FOR_MS = 30 * DAY_MS;

export type CachedReading = { outcome: "found"; record: StoredRecord } | { outcome: "not_found" };

export interface RecordCache {
  /** The kept answer, or undefined when there is none (or a not-found one has expired). */
  get(imdbId: string): CachedReading | undefined;
  put(imdbId: string, reading: CachedReading): void;
  /** Of these titles, the ones whose kept record has a poster. */
  withPosters(imdbIds: readonly string[]): Set<string>;
}

/** Keeps each query small. */
const BATCH = 300;

export function createRecordCache(db: Db, now: () => number = Date.now): RecordCache {
  const select = db.prepare<[string], { outcome: "found" | "not_found"; body: string; fetchedAt: number }>(
    "SELECT outcome, body, fetched_at AS fetchedAt FROM omdb_records WHERE imdb_id = ?",
  );
  const upsert = db.prepare<[string, string, string, number, number]>(`
    INSERT INTO omdb_records (imdb_id, outcome, body, poster, fetched_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (imdb_id) DO UPDATE
      SET outcome = excluded.outcome, body = excluded.body, poster = excluded.poster, fetched_at = excluded.fetched_at`);

  return {
    get(imdbId) {
      const row = select.get(imdbId);
      if (!row) return undefined;
      if (row.outcome === "not_found")
        return now() - row.fetchedAt < NOT_FOUND_FOR_MS ? { outcome: "not_found" } : undefined;
      return { outcome: "found", record: JSON.parse(row.body) as StoredRecord };
    },
    put(imdbId, reading) {
      const found = reading.outcome === "found";
      upsert.run(
        imdbId,
        reading.outcome,
        JSON.stringify(found ? reading.record : null),
        found && reading.record.posterUrl !== null ? 1 : 0,
        now(),
      );
    },
    withPosters(imdbIds) {
      const found = new Set<string>();
      for (let start = 0; start < imdbIds.length; start += BATCH) {
        const batch = imdbIds.slice(start, start + BATCH);
        const rows = db
          .prepare<string[], { imdbId: string }>(
            `SELECT imdb_id AS imdbId FROM omdb_records WHERE poster = 1 AND imdb_id IN (${batch.map(() => "?").join(", ")})`,
          )
          .all(...batch);
        for (const row of rows) found.add(row.imdbId);
      }
      return found;
    },
  };
}
