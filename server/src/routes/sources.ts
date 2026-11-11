import { imdbIdSchema, POSTER_SIZES, type PosterSize, type SourcesResponse } from "@lantern/shared";
import type { FastifyInstance, FastifyReply } from "fastify";
import { fail } from "../plugins/errors.js";
import { NoKeyError, SourceError, type FetchLike } from "../sources/http.js";
import { fetchPoster, POSTER_CACHE_CONTROL, posterUrlFor } from "../sources/posters.js";
import type { Records } from "../sources/records.js";

/**
 * A source's failure in the contract's shape: no key is a 503 `no_key`,
 * anything else from a source a 502 `source_failed` (the daily limit
 * included, which the message says). The message names the source, never a
 * key. Anything else is rethrown for the 500 handler.
 */
export function sourceFailure(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof NoKeyError) return fail(reply, 503, { code: "no_key", message: error.message });
  if (error instanceof SourceError) {
    reply.log.warn({ failure: error.failure, status: error.status }, error.message);
    return fail(reply, 502, { code: "source_failed", message: error.message });
  }
  throw error;
}

/**
 *   GET /v1/sources                  whether OMDb's key is set
 *   GET /v1/posters/:id?size=        a title's poster, from its kept OMDb record only
 */
export function registerSourceRoutes(app: FastifyInstance, records: Records, posterFetch: FetchLike): void {
  app.get("/v1/sources", async (): Promise<SourcesResponse> => records.status);

  app.get<{ Params: { id: string }; Querystring: { size?: string } }>("/v1/posters/:id", async (request, reply) => {
    const id = imdbIdSchema.safeParse(request.params.id);
    const size = request.query.size ?? "normal";
    if (!id.success || !(POSTER_SIZES as readonly string[]).includes(size)) {
      return fail(reply, 404, { code: "not_found", message: "no such poster" });
    }
    // Never asks OMDb: a poster is served only for a title whose record is kept.
    const posterUrl = records.cached(id.data)?.posterUrl;
    if (!posterUrl) return fail(reply, 404, { code: "not_found", message: "no poster kept for this title" });
    let poster = await fetchPoster(posterFetch, posterUrlFor(posterUrl, size as PosterSize));
    if (!poster.ok && size === "large") poster = await fetchPoster(posterFetch, posterUrl);
    if (!poster.ok)
      return fail(reply, poster.status, {
        code: poster.status === 404 ? "not_found" : "source_failed",
        message: poster.reason,
      });
    return reply.header("cache-control", POSTER_CACHE_CONTROL).type(poster.type).send(poster.bytes);
  });
}
