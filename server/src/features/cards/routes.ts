import { cardsQuerySchema, cardsResponseSchema } from "@lantern/shared";
import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { dealCards } from "./deal.js";
import type { Db } from "../../db.js";
import { toPoolTitle } from "../pool/index.js";
import { forPage } from "../sources/index.js";
import type { Records } from "../sources/index.js";
import { currentUserId } from "../../plugins/auth/index.js";

/** Cards a page asks for when it doesn't say. */
const DEFAULT_CARDS = 10;

/**
 *   GET /v1/cards?kind=&count=&exclude=    the next cards; never asks OMDb
 */
export const cardRoutes: FastifyPluginAsyncZod<{ db: Db; records: Records }> = async (app, deps) => {
  app.get(
    "/v1/cards",
    { schema: { querystring: cardsQuerySchema, response: { 200: cardsResponseSchema } } },
    async (request) => {
      const query = request.query;
      const rows = dealCards(deps.db, currentUserId(request), {
        kind: query.kind,
        count: query.count ?? DEFAULT_CARDS,
        exclude: query.exclude?.split(","),
      });
      return {
        cards: rows.map((row) => {
          const kept = deps.records.cached(row.imdbId);
          return { title: toPoolTitle(row), poster: kept?.posterUrl != null, record: kept ? forPage(kept) : null };
        }),
      };
    },
  );
};
