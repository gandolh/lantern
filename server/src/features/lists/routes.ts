import {
  listQuerySchema,
  LISTS,
  type ListName,
  type ListResponse,
  type PoolTitle,
  type StateFilter,
} from "@lantern/shared";
import type { FastifyInstance } from "fastify";
import { toPoolTitle, type Pool } from "../pool/index.js";
import { fail, parse } from "../../plugins/errors.js";
import type { StoredRecord } from "../sources/index.js";
import type { Records } from "../sources/index.js";
import type { StatesStore } from "../states/index.js";
import { currentUserId } from "../../plugins/auth/index.js";

const PAGE = 50;

/** A title the pool no longer holds, told from OMDb's kept record, or by its id alone. */
function fromRecord(imdbId: string, record: StoredRecord | null | undefined): PoolTitle {
  return {
    imdbId,
    kind: record?.type === "series" ? "series" : "movie",
    imdbType: record?.type ?? "unknown",
    title: record?.title ?? imdbId,
    year: record?.year ?? null,
    endYear: record?.endYear ?? null,
    runtime: record?.runtime ?? null,
    genres: record?.genres ?? [],
    rating: record?.scores.imdb?.rating ?? 0,
    votes: record?.scores.imdb?.votes ?? 0,
  };
}

/**
 *   GET /v1/lists/:list?kind=&rating=&cursor=
 *
 * `:list` is `watchlist`, `ratings` (one step with `rating`, or all four) or
 * `not-interested`: newest first, 50 at a time, joined with the pool's facts
 * and, for a title the latest import dropped, OMDb's kept record. Never asks
 * OMDb.
 */
export function registerListRoutes(
  app: FastifyInstance,
  deps: { states: StatesStore; pool: Pool; records: Records },
): void {
  app.get<{ Params: { list: string } }>("/v1/lists/:list", async (request, reply) => {
    const list = request.params.list as ListName;
    if (!LISTS.includes(list))
      return fail(reply, 404, { code: "not_found", message: `no list ${request.params.list}` });
    const query = parse(listQuerySchema, request.query, reply);
    if (!query) return reply;
    const userId = currentUserId(request);
    const state: StateFilter =
      list === "watchlist" ? "want_to_watch" : list === "not-interested" ? "not_interested" : (query.rating ?? "rated");
    const page = deps.states.list(userId, { state, kind: query.kind, limit: PAGE, cursor: query.cursor });
    const ids = page.rows.map((row) => row.imdbId);
    const pooled = deps.pool.getMany(ids);
    const posters = deps.records.withPosters(ids);
    const body: ListResponse = {
      rows: page.rows.map((row) => {
        const inPool = pooled.get(row.imdbId);
        return {
          title: inPool ? toPoolTitle(inPool) : fromRecord(row.imdbId, deps.records.cached(row.imdbId)),
          state: row.state,
          updatedAt: row.updatedAt,
          poster: posters.has(row.imdbId),
          inPool: inPool !== undefined,
        };
      }),
      next: page.next,
      counts: deps.states.counts(userId),
    };
    return body;
  });
}
