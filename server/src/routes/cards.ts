import { cardsQuerySchema, type CardsResponse } from "@lantern/shared";
import type { FastifyInstance } from "fastify";
import { dealCards } from "../cards.js";
import type { Db } from "../db.js";
import { toPoolTitle } from "../pool/pool.js";
import { parse } from "../reply.js";
import { forPage } from "../sources/omdb.js";
import type { Records } from "../sources/records.js";
import { userIdOf } from "./states.js";

/** Cards a page asks for when it doesn't say. */
const DEFAULT_CARDS = 10;

/**
 *   GET /v1/cards?kind=&count=&exclude=    the next cards; never asks OMDb
 */
export function registerCardRoutes(app: FastifyInstance, deps: { db: Db; records: Records }): void {
  app.get("/v1/cards", async (request, reply) => {
    const query = parse(cardsQuerySchema, request.query, reply);
    if (!query) return reply;
    const rows = dealCards(deps.db, userIdOf(request), {
      kind: query.kind,
      count: query.count ?? DEFAULT_CARDS,
      exclude: query.exclude?.split(","),
    });
    const body: CardsResponse = {
      cards: rows.map((row) => {
        const kept = deps.records.cached(row.imdbId);
        return { title: toPoolTitle(row), poster: kept?.posterUrl != null, record: kept ? forPage(kept) : null };
      }),
    };
    return body;
  });
}
