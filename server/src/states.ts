import { RATINGS, TITLE_STATES, type MediaType, type StateCountsResponse, type StateFilter, type StateRow, type TitleState } from "@lantern/shared";
import type { Db } from "./db.js";

/**
 * The states store: the only module that runs SQL on `title_states` and
 * `card_skips`. Every call is scoped to one user. A title has at most one
 * state; setting one replaces the one before (rating a title on the watchlist
 * takes it off) and drops a skip of that title.
 */

export interface TitleRef {
  mediaType: MediaType;
  tmdbId: number;
}

/** `movie:603`: a title as a map key. */
export const titleKey = (title: TitleRef): string => `${title.mediaType}:${title.tmdbId}`;

export interface ListOptions {
  state?: StateFilter;
  mediaType?: MediaType;
  limit: number;
  /** The `next` of the page before. */
  cursor?: string;
}

export interface StatesStore {
  get(userId: string, title: TitleRef): StateRow | undefined;
  set(userId: string, title: TitleRef, state: TitleState): StateRow;
  /** False when the title had no state. */
  clear(userId: string, title: TitleRef): boolean;
  /** Newest first, a page at a time; `next` is null at the end. */
  list(userId: string, options: ListOptions): { rows: StateRow[]; next: string | null };
  counts(userId: string): StateCountsResponse["counts"];
  /** The states of many titles at once, keyed by `titleKey`; untouched titles are absent. */
  statesOf(userId: string, titles: readonly TitleRef[]): Map<string, TitleState>;
  /** Every title with a state, keyed by `titleKey`. */
  allStated(userId: string): Map<string, TitleState>;
  /** True when the title wasn't skipped already. */
  skip(userId: string, title: TitleRef): boolean;
  /** False when the title wasn't skipped. */
  unskip(userId: string, title: TitleRef): boolean;
  /** Every skipped title, by `titleKey`. */
  skipped(userId: string): Set<string>;
}

interface Row {
  mediaType: MediaType;
  tmdbId: number;
  state: TitleState;
  updatedAt: number;
}

const COLUMNS = "media_type AS mediaType, tmdb_id AS tmdbId, state, updated_at AS updatedAt";

/** SQLite's limit on bound parameters is far above this; batches keep each query small. */
const BATCH = 200;

function cursorOf(row: Row): string {
  return `${row.updatedAt}.${row.mediaType}.${row.tmdbId}`;
}

function parseCursor(cursor: string): [number, string, number] {
  const [time, type, id] = cursor.split(".");
  return [Number(time), type!, Number(id)];
}

export function createStatesStore(db: Db, now: () => number = Date.now): StatesStore {
  const selectOne = db.prepare<[string, string, number], Row>(
    `SELECT ${COLUMNS} FROM title_states WHERE user_id = ? AND media_type = ? AND tmdb_id = ?`,
  );
  const upsert = db.prepare<[string, string, number, string, number]>(`
    INSERT INTO title_states (user_id, media_type, tmdb_id, state, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (user_id, media_type, tmdb_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`);
  const deleteOne = db.prepare<[string, string, number]>(
    "DELETE FROM title_states WHERE user_id = ? AND media_type = ? AND tmdb_id = ?",
  );
  const insertSkip = db.prepare<[string, string, number, number]>(
    "INSERT OR IGNORE INTO card_skips (user_id, media_type, tmdb_id, skipped_at) VALUES (?, ?, ?, ?)",
  );
  const deleteSkip = db.prepare<[string, string, number]>(
    "DELETE FROM card_skips WHERE user_id = ? AND media_type = ? AND tmdb_id = ?",
  );
  const selectSkipped = db.prepare<[string], { mediaType: MediaType; tmdbId: number }>(
    "SELECT media_type AS mediaType, tmdb_id AS tmdbId FROM card_skips WHERE user_id = ?",
  );
  const selectAll = db.prepare<[string], Row>(`SELECT ${COLUMNS} FROM title_states WHERE user_id = ?`);
  const selectCounts = db.prepare<[string], { state: TitleState; mediaType: MediaType; n: number }>(
    "SELECT state, media_type AS mediaType, count(*) AS n FROM title_states WHERE user_id = ? GROUP BY state, media_type",
  );

  const set = db.transaction((userId: string, title: TitleRef, state: TitleState): StateRow => {
    const updatedAt = now();
    upsert.run(userId, title.mediaType, title.tmdbId, state, updatedAt);
    deleteSkip.run(userId, title.mediaType, title.tmdbId);
    return { mediaType: title.mediaType, tmdbId: title.tmdbId, state, updatedAt };
  });

  return {
    get: (userId, title) => selectOne.get(userId, title.mediaType, title.tmdbId),
    set: (userId, title, state) => set(userId, title, state),
    clear: (userId, title) => deleteOne.run(userId, title.mediaType, title.tmdbId).changes > 0,

    list(userId, { state, mediaType, limit, cursor }) {
      const where = ["user_id = ?"];
      const params: (string | number)[] = [userId];
      if (state === "rated") {
        where.push(`state IN (${RATINGS.map(() => "?").join(", ")})`);
        params.push(...RATINGS);
      } else if (state !== undefined) {
        where.push("state = ?");
        params.push(state);
      }
      if (mediaType !== undefined) {
        where.push("media_type = ?");
        params.push(mediaType);
      }
      if (cursor !== undefined) {
        where.push("(updated_at, media_type, tmdb_id) < (?, ?, ?)");
        params.push(...parseCursor(cursor));
      }
      // One more than asked, to know whether a next page exists.
      const rows = db
        .prepare<(string | number)[], Row>(
          `SELECT ${COLUMNS} FROM title_states WHERE ${where.join(" AND ")}
           ORDER BY updated_at DESC, media_type DESC, tmdb_id DESC LIMIT ?`,
        )
        .all(...params, limit + 1);
      const page = rows.slice(0, limit);
      return { rows: page, next: rows.length > limit ? cursorOf(page[page.length - 1]!) : null };
    },

    counts(userId) {
      const counts = Object.fromEntries(TITLE_STATES.map((state) => [state, { movie: 0, tv: 0 }])) as StateCountsResponse["counts"];
      for (const { state, mediaType, n } of selectCounts.all(userId)) counts[state][mediaType] = n;
      return counts;
    },

    statesOf(userId, titles) {
      const found = new Map<string, TitleState>();
      for (let start = 0; start < titles.length; start += BATCH) {
        const batch = titles.slice(start, start + BATCH);
        const rows = db
          .prepare<(string | number)[], Row>(
            `SELECT ${COLUMNS} FROM title_states WHERE user_id = ? AND (media_type, tmdb_id) IN (VALUES ${batch.map(() => "(?, ?)").join(", ")})`,
          )
          .all(userId, ...batch.flatMap((title) => [title.mediaType, title.tmdbId]));
        for (const row of rows) found.set(titleKey(row), row.state);
      }
      return found;
    },

    allStated: (userId) => new Map(selectAll.all(userId).map((row) => [titleKey(row), row.state])),
    skip: (userId, title) => insertSkip.run(userId, title.mediaType, title.tmdbId, now()).changes > 0,
    unskip: (userId, title) => deleteSkip.run(userId, title.mediaType, title.tmdbId).changes > 0,
    skipped: (userId) => new Set(selectSkipped.all(userId).map(titleKey)),
  };
}
