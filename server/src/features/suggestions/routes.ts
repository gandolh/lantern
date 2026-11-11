import { suggestionsQuerySchema, suggestionsResponseSchema } from "@lantern/shared";
import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { toPoolTitle, type Pool } from "../pool/index.js";
import type { Records } from "../sources/index.js";
import type { Suggester } from "./service.js";
import { currentUserId } from "../../plugins/auth/index.js";

const DEFAULT_SUGGESTIONS = 30;

/**
 *   GET /v1/suggestions?kind=&limit=    the pool ranked by this user's taste; never asks OMDb
 */
export const suggestionRoutes: FastifyPluginAsyncZod<{ suggester: Suggester; pool: Pool; records: Records }> = async (
  app,
  deps,
) => {
  app.get(
    "/v1/suggestions",
    { schema: { querystring: suggestionsQuerySchema, response: { 200: suggestionsResponseSchema } } },
    async (request) => {
      const query = request.query;
      const { ranked, rated, liked } = deps.suggester.suggest(currentUserId(request), {
        kind: query.kind,
        limit: query.limit ?? DEFAULT_SUGGESTIONS,
      });
      const ids = ranked.map((item) => item.imdbId);
      const rows = deps.pool.getMany(ids);
      const posters = deps.records.withPosters(ids);
      return {
        suggestions: ranked.flatMap((item) => {
          const row = rows.get(item.imdbId);
          return row ? [{ title: toPoolTitle(row), poster: posters.has(item.imdbId), because: item.reason }] : [];
        }),
        rated,
        liked,
      };
    },
  );
};
