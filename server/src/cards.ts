import type { TitleKind } from "@lantern/shared";
import type { Db } from "./db.js";
import { POOL_COLUMNS, type PoolRow } from "./pool/pool.js";

/**
 * The deck: the pool's most-voted titles that this user has neither given a
 * state nor skipped, films and series together or one kind. Well-known
 * titles first, since those are the likeliest to have been seen. Walks the
 * votes index, skipping marked titles, so it stays quick however many are
 * marked.
 */
export function dealCards(db: Db, userId: string, options: { kind?: TitleKind; count: number; exclude?: readonly string[] }): PoolRow[] {
  const where = [
    "NOT EXISTS (SELECT 1 FROM title_states s WHERE s.user_id = ? AND s.imdb_id = t.imdb_id)",
    "NOT EXISTS (SELECT 1 FROM card_skips k WHERE k.user_id = ? AND k.imdb_id = t.imdb_id)",
  ];
  const params: (string | number)[] = [userId, userId];
  if (options.kind !== undefined) {
    where.push("t.kind = ?");
    params.push(options.kind);
  }
  const exclude = options.exclude ?? [];
  if (exclude.length > 0) {
    where.push(`t.imdb_id NOT IN (${exclude.map(() => "?").join(", ")})`);
    params.push(...exclude);
  }
  return db
    .prepare<(string | number)[], PoolRow>(`SELECT ${POOL_COLUMNS} FROM titles t WHERE ${where.join(" AND ")} ORDER BY t.votes DESC LIMIT ?`)
    .all(...params, options.count);
}
