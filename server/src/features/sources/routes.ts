import { imdbIdSchema, POSTER_SIZES, sourcesResponseSchema, type PosterSize } from "@lantern/shared";
import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import type { FastifyReply } from "fastify";
import { z } from "zod";
import { fail } from "../../plugins/errors.js";
import { NoKeyError, SourceError, type FetchLike } from "./http.js";
import { fetchPoster, POSTER_CACHE_CONTROL, posterUrlFor } from "./posters.js";
import type { Records } from "./records.js";

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

/** The poster route takes plain strings: a bad id or size is a 404 `not_found`, never a 400. */
const posterParams = z.object({ id: z.string() });
const posterQuery = z.object({ size: z.string().optional() });

/**
 *   GET /v1/sources                  whether OMDb's key is set
 *   GET /v1/posters/:id?size=        a title's poster, from its kept OMDb record only
 */
export const sourceRoutes: FastifyPluginAsyncZod<{ records: Records; posterFetch: FetchLike }> = async (
  app,
  { records, posterFetch },
) => {
  app.get("/v1/sources", { schema: { response: { 200: sourcesResponseSchema } } }, async () => records.status);

  // No response schema: the body is image bytes, with the upstream's content type and status.
  app.get("/v1/posters/:id", { schema: { params: posterParams, querystring: posterQuery } }, async (request, reply) => {
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
};
