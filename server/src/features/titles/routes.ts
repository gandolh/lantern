import {
  MAX_SEARCH_RESULTS,
  searchQuerySchema,
  titleParamsSchema,
  type RecordResponse,
  type SearchResponse,
  type TitleItem,
} from "@lantern/shared";
import type { FastifyInstance } from "fastify";
import { toPoolTitle, type Pool, type PoolRow } from "../pool/index.js";
import { fail, parse } from "../../plugins/errors.js";
import { forPage } from "../sources/index.js";
import type { Records } from "../sources/index.js";
import type { StatesStore } from "../states/index.js";
import { sourceFailure } from "../sources/index.js";
import { currentUserId } from "../../plugins/auth/index.js";

/**
 * Titles from the pool, with this user's state and whether a poster is kept,
 * and a title's OMDb record. Only the record route ever asks OMDb, and only
 * for a title it doesn't keep yet.
 *
 *   GET /v1/search?q=&kind=     at most 30 pool titles matching every word
 *   GET /v1/titles/:id          one pool title; 404 when the pool lacks it
 *   GET /v1/titles/:id/record   OMDb's record, kept or asked once; null when OMDb doesn't know it
 */
export function registerTitleRoutes(
  app: FastifyInstance,
  deps: { pool: Pool; states: StatesStore; records: Records },
): void {
  const { pool, states, records } = deps;

  /** Pool rows as items for one user: their states and kept posters in one query each. */
  const items = (userId: string, rows: readonly PoolRow[]): TitleItem[] => {
    const ids = rows.map((row) => row.imdbId);
    const stated = states.statesOf(userId, ids);
    const posters = records.withPosters(ids);
    return rows.map((row) => ({
      title: toPoolTitle(row),
      state: stated.get(row.imdbId) ?? null,
      poster: posters.has(row.imdbId),
    }));
  };

  app.get("/v1/search", async (request, reply) => {
    const query = parse(searchQuerySchema, request.query, reply);
    if (!query) return reply;
    const rows = pool.search(query.q, { kind: query.kind, limit: MAX_SEARCH_RESULTS });
    const body: SearchResponse = { results: items(currentUserId(request), rows) };
    return body;
  });

  app.get("/v1/titles/:id", async (request, reply) => {
    const params = parse(titleParamsSchema, request.params, reply);
    if (!params) return reply;
    const row = pool.get(params.id);
    if (!row) return fail(reply, 404, { code: "not_found", message: "this title isn't in Lantern's title list" });
    const [item] = items(currentUserId(request), [row]);
    return item;
  });

  app.get("/v1/titles/:id/record", async (request, reply) => {
    const params = parse(titleParamsSchema, request.params, reply);
    if (!params) return reply;
    try {
      const record = await records.get(params.id);
      const body: RecordResponse = { record: record === null ? null : forPage(record) };
      return body;
    } catch (error) {
      return sourceFailure(reply, error);
    }
  });
}
