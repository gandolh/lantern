import { suggestionsQuerySchema, type SuggestionsResponse } from "@lantern/shared";
import type { FastifyInstance } from "fastify";
import { toPoolTitle, type Pool } from "../pool/index.js";
import { parse } from "../../plugins/errors.js";
import type { Records } from "../sources/index.js";
import type { Suggester } from "./service.js";
import { currentUserId } from "../../plugins/auth/index.js";

const DEFAULT_SUGGESTIONS = 30;

/**
 *   GET /v1/suggestions?kind=&limit=    the pool ranked by this user's taste; never asks OMDb
 */
export function registerSuggestionRoutes(
  app: FastifyInstance,
  deps: { suggester: Suggester; pool: Pool; records: Records },
): void {
  app.get("/v1/suggestions", async (request, reply) => {
    const query = parse(suggestionsQuerySchema, request.query, reply);
    if (!query) return reply;
    const { ranked, rated, liked } = deps.suggester.suggest(currentUserId(request), {
      kind: query.kind,
      limit: query.limit ?? DEFAULT_SUGGESTIONS,
    });
    const ids = ranked.map((item) => item.imdbId);
    const rows = deps.pool.getMany(ids);
    const posters = deps.records.withPosters(ids);
    const body: SuggestionsResponse = {
      suggestions: ranked.flatMap((item) => {
        const row = rows.get(item.imdbId);
        return row ? [{ title: toPoolTitle(row), poster: posters.has(item.imdbId), because: item.reason }] : [];
      }),
      rated,
      liked,
    };
    return body;
  });
}
