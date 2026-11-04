import type { PoolInfo, PoolTitle, TitleKind } from "@lantern/shared";
import type { Db } from "../db.js";
import { normaliseTitle } from "./normalise.js";

/**
 * Reads of the title pool. The import (`import.ts`) is the only writer; the
 * server only reads. Directors and writers are ids, never shown, used for
 * the suggestions.
 */

export interface PoolRow {
  imdbId: string;
  kind: TitleKind;
  imdbType: string;
  title: string;
  startYear: number | null;
  endYear: number | null;
  runtime: number | null;
  genres: string;
  rating: number;
  votes: number;
  directors: string;
  writers: string;
}

export const POOL_COLUMNS = `imdb_id AS imdbId, kind, imdb_type AS imdbType, title, start_year AS startYear, end_year AS endYear,
  runtime, genres, rating, votes, directors, writers`;

/** A pool row as the page gets it. */
export function toPoolTitle(row: PoolRow): PoolTitle {
  return {
    imdbId: row.imdbId,
    kind: row.kind,
    imdbType: row.imdbType,
    title: row.title,
    year: row.startYear,
    endYear: row.endYear,
    runtime: row.runtime,
    genres: row.genres === "" ? [] : row.genres.split(","),
    rating: row.rating,
    votes: row.votes,
  };
}

export interface Pool {
  info(): PoolInfo;
  get(imdbId: string): PoolRow | undefined;
  /** Many titles at once, by id; missing ones are absent. */
  getMany(imdbIds: readonly string[]): Map<string, PoolRow>;
  /**
   * Titles whose normalised title holds every word of the query: the exact
   * title first, then titles starting with the query, then the rest, each
   * group most-voted first.
   */
  search(query: string, options: { kind?: TitleKind; limit: number }): PoolRow[];
}

const BATCH = 300;

export function createPool(db: Db): Pool {
  const counts = db.prepare<[], { kind: TitleKind; n: number }>("SELECT kind, count(*) AS n FROM titles GROUP BY kind");
  const last = db.prepare<[], { importedAt: number; minVotes: number }>(
    "SELECT imported_at AS importedAt, min_votes AS minVotes FROM pool_imports ORDER BY id DESC LIMIT 1",
  );
  const one = db.prepare<[string], PoolRow>(`SELECT ${POOL_COLUMNS} FROM titles WHERE imdb_id = ?`);
  return {
    info() {
      const byKind = Object.fromEntries(counts.all().map((row) => [row.kind, row.n]));
      const movies = byKind.movie ?? 0;
      const series = byKind.series ?? 0;
      const run = last.get();
      return { titles: movies + series, movies, series, importedAt: run?.importedAt ?? null, minVotes: run?.minVotes ?? null };
    },
    get: (imdbId) => one.get(imdbId),
    search(query, { kind, limit }) {
      const normalised = normaliseTitle(query);
      const words = normalised.split(" ").filter((word) => word !== "");
      if (words.length === 0) return [];
      // The normaliser leaves letters, digits and spaces only, so no LIKE wildcard gets through.
      const where = words.map(() => "search_title LIKE ?");
      const params: (string | number)[] = words.map((word) => `%${word}%`);
      if (kind !== undefined) {
        where.push("kind = ?");
        params.push(kind);
      }
      return db
        .prepare<(string | number)[], PoolRow>(
          `SELECT ${POOL_COLUMNS} FROM titles WHERE ${where.join(" AND ")}
           ORDER BY search_title = ? DESC, search_title LIKE ? DESC, votes DESC LIMIT ?`,
        )
        .all(...params, normalised, `${normalised}%`, limit);
    },
    getMany(imdbIds) {
      const found = new Map<string, PoolRow>();
      for (let start = 0; start < imdbIds.length; start += BATCH) {
        const batch = imdbIds.slice(start, start + BATCH);
        for (const row of db.prepare<string[], PoolRow>(`SELECT ${POOL_COLUMNS} FROM titles WHERE imdb_id IN (${batch.map(() => "?").join(", ")})`).all(...batch)) {
          found.set(row.imdbId, row);
        }
      }
      return found;
    },
  };
}
