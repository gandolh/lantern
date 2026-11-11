import {
  RATINGS,
  TITLE_STATES,
  type StateCountsResponse,
  type StateFilter,
  type StateRow,
  type TitleKind,
  type TitleState,
} from "@lantern/shared";
import type { Db } from "../../db.js";

/**
 * The states store: the only module that runs SQL on `title_states` and
 * `card_skips`. Every call is scoped to one user; a title is its IMDb id. A
 * title has at most one state; setting one replaces the one before (rating
 * a title on the watchlist takes it off) and drops a skip of that title.
 */

export interface ListOptions {
  state?: StateFilter;
  /** Only titles of this kind in the pool; a title the pool lacks then drops out. */
  kind?: TitleKind;
  limit: number;
  /** The `next` of the page before. */
  cursor?: string;
}

export interface StatesStore {
  get(userId: string, imdbId: string): StateRow | undefined;
  set(userId: string, imdbId: string, state: TitleState): StateRow;
  /** False when the title had no state. */
  clear(userId: string, imdbId: string): boolean;
  /** Newest first, a page at a time; `next` is null at the end. */
  list(userId: string, options: ListOptions): { rows: StateRow[]; next: string | null };
  counts(userId: string): StateCountsResponse["counts"];
  /** The states of many titles at once; untouched titles are absent. */
  statesOf(userId: string, imdbIds: readonly string[]): Map<string, TitleState>;
  /** Every title with a state. */
  allStated(userId: string): Map<string, TitleState>;
  /** True when the title wasn't skipped already. */
  skip(userId: string, imdbId: string): boolean;
  /** False when the title wasn't skipped. */
  unskip(userId: string, imdbId: string): boolean;
  /** Every skipped title. */
  skipped(userId: string): Set<string>;
}

const COLUMNS = "imdb_id AS imdbId, state, updated_at AS updatedAt";

/** Keeps each query small. */
const BATCH = 300;

const cursorOf = (row: StateRow): string => `${row.updatedAt}.${row.imdbId}`;

function parseCursor(cursor: string): [number, string] {
  const dot = cursor.indexOf(".");
  return [Number(cursor.slice(0, dot)), cursor.slice(dot + 1)];
}

export function createStatesStore(db: Db, now: () => number = Date.now): StatesStore {
  const selectOne = db.prepare<[string, string], StateRow>(
    `SELECT ${COLUMNS} FROM title_states WHERE user_id = ? AND imdb_id = ?`,
  );
  const upsert = db.prepare<[string, string, string, number]>(`
    INSERT INTO title_states (user_id, imdb_id, state, updated_at) VALUES (?, ?, ?, ?)
    ON CONFLICT (user_id, imdb_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`);
  const deleteOne = db.prepare<[string, string]>("DELETE FROM title_states WHERE user_id = ? AND imdb_id = ?");
  const insertSkip = db.prepare<[string, string, number]>(
    "INSERT OR IGNORE INTO card_skips (user_id, imdb_id, skipped_at) VALUES (?, ?, ?)",
  );
  const deleteSkip = db.prepare<[string, string]>("DELETE FROM card_skips WHERE user_id = ? AND imdb_id = ?");
  const selectSkipped = db.prepare<[string], { imdbId: string }>(
    "SELECT imdb_id AS imdbId FROM card_skips WHERE user_id = ?",
  );
  const selectAll = db.prepare<[string], StateRow>(`SELECT ${COLUMNS} FROM title_states WHERE user_id = ?`);
  const selectCounts = db.prepare<[string], { state: TitleState; n: number }>(
    "SELECT state, count(*) AS n FROM title_states WHERE user_id = ? GROUP BY state",
  );

  const set = db.transaction((userId: string, imdbId: string, state: TitleState): StateRow => {
    const updatedAt = now();
    upsert.run(userId, imdbId, state, updatedAt);
    deleteSkip.run(userId, imdbId);
    return { imdbId, state, updatedAt };
  });

  return {
    get: (userId, imdbId) => selectOne.get(userId, imdbId),
    set: (userId, imdbId, state) => set(userId, imdbId, state),
    clear: (userId, imdbId) => deleteOne.run(userId, imdbId).changes > 0,

    list(userId, { state, kind, limit, cursor }) {
      const where = ["user_id = ?"];
      const params: (string | number)[] = [userId];
      if (state === "rated") {
        where.push(`state IN (${RATINGS.map(() => "?").join(", ")})`);
        params.push(...RATINGS);
      } else if (state !== undefined) {
        where.push("state = ?");
        params.push(state);
      }
      if (kind !== undefined) {
        where.push("imdb_id IN (SELECT imdb_id FROM titles WHERE kind = ?)");
        params.push(kind);
      }
      if (cursor !== undefined) {
        where.push("(updated_at, imdb_id) < (?, ?)");
        params.push(...parseCursor(cursor));
      }
      // One more than asked, to know whether a next page exists.
      const rows = db
        .prepare<(string | number)[], StateRow>(
          `SELECT ${COLUMNS} FROM title_states WHERE ${where.join(" AND ")} ORDER BY updated_at DESC, imdb_id DESC LIMIT ?`,
        )
        .all(...params, limit + 1);
      const page = rows.slice(0, limit);
      const last = page[page.length - 1];
      return { rows: page, next: rows.length > limit && last !== undefined ? cursorOf(last) : null };
    },

    counts(userId) {
      const counts = Object.fromEntries(TITLE_STATES.map((state) => [state, 0])) as StateCountsResponse["counts"];
      for (const { state, n } of selectCounts.all(userId)) counts[state] = n;
      return counts;
    },

    statesOf(userId, imdbIds) {
      const found = new Map<string, TitleState>();
      for (let start = 0; start < imdbIds.length; start += BATCH) {
        const batch = imdbIds.slice(start, start + BATCH);
        const rows = db
          .prepare<string[], StateRow>(
            `SELECT ${COLUMNS} FROM title_states WHERE user_id = ? AND imdb_id IN (${batch.map(() => "?").join(", ")})`,
          )
          .all(userId, ...batch);
        for (const row of rows) found.set(row.imdbId, row.state);
      }
      return found;
    },

    allStated: (userId) => new Map(selectAll.all(userId).map((row) => [row.imdbId, row.state])),
    skip: (userId, imdbId) => insertSkip.run(userId, imdbId, now()).changes > 0,
    unskip: (userId, imdbId) => deleteSkip.run(userId, imdbId).changes > 0,
    skipped: (userId) => new Set(selectSkipped.all(userId).map((row) => row.imdbId)),
  };
}
