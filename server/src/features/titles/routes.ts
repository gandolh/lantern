import {
  errorBodySchema,
  MAX_SEARCH_RESULTS,
  recordResponseSchema,
  searchQuerySchema,
  searchResponseSchema,
  titleItemSchema,
  titleParamsSchema,
  type TitleItem,
} from "@lantern/shared";
import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { toPoolTitle, type Pool, type PoolRow } from "../pool/index.js";
import { fail } from "../../plugins/errors.js";
import { forPage, sourceFailure, type Records } from "../sources/index.js";
import type { StatesStore } from "../states/index.js";
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
export const titleRoutes: FastifyPluginAsyncZod<{ pool: Pool; states: StatesStore; records: Records }> = async (
  app,
  { pool, states, records },
) => {
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

  app.get(
    "/v1/search",
    { schema: { querystring: searchQuerySchema, response: { 200: searchResponseSchema } } },
    async (request) => {
      const query = request.query;
      const rows = pool.search(query.q, { kind: query.kind, limit: MAX_SEARCH_RESULTS });
      return { results: items(currentUserId(request), rows) };
    },
  );

  app.get(
    "/v1/titles/:id",
    { schema: { params: titleParamsSchema, response: { 200: titleItemSchema, 404: errorBodySchema } } },
    async (request, reply) => {
      const row = pool.get(request.params.id);
      if (!row) return fail(reply, 404, { code: "not_found", message: "this title isn't in Lantern's title list" });
      const [item] = items(currentUserId(request), [row]);
      return item;
    },
  );

  app.get(
    "/v1/titles/:id/record",
    {
      schema: {
        params: titleParamsSchema,
        response: { 200: recordResponseSchema, 502: errorBodySchema, 503: errorBodySchema },
      },
    },
    async (request, reply) => {
      try {
        const record = await records.get(request.params.id);
        return { record: record === null ? null : forPage(record) };
      } catch (error) {
        return sourceFailure(reply, error);
      }
    },
  );
};
