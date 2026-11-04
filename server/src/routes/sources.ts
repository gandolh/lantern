import type { SourcesResponse } from "@lantern/shared";
import type { FastifyInstance, FastifyReply } from "fastify";
import { fail } from "../reply.js";
import { NoKeyError, SourceError, type FetchLike } from "../sources/http.js";
import { fetchImage, IMAGE_CACHE_CONTROL, isImageFile, isImageSize } from "../sources/images.js";
import { TitleNotFoundError, type Sources } from "../sources/titles.js";

/**
 * A source's failure in the contract's shape: no key is a 503 `no_key`, a
 * title TMDB doesn't have a 404, anything else from a source a 502
 * `source_failed`. The message names the source and the path, never a key.
 * Anything else is rethrown for the 500 handler.
 */
export function sourceFailure(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof NoKeyError) return fail(reply, 503, { code: "no_key", message: error.message });
  if (error instanceof TitleNotFoundError) return fail(reply, 404, { code: "not_found", message: error.message });
  if (error instanceof SourceError) {
    reply.log.warn({ failure: error.failure, status: error.status }, error.message);
    return fail(reply, 502, { code: "source_failed", message: error.message });
  }
  throw error;
}

/**
 *   GET /v1/sources                whether each key is set
 *   GET /v1/images/:size/:file     a TMDB poster, through the server
 */
export function registerSourceRoutes(app: FastifyInstance, sources: Sources, imageFetch: FetchLike): void {
  app.get("/v1/sources", async (): Promise<SourcesResponse> => sources.status);

  app.get<{ Params: { size: string; file: string } }>("/v1/images/:size/:file", async (request, reply) => {
    const { size, file } = request.params;
    if (!isImageSize(size) || !isImageFile(file)) {
      return fail(reply, 404, { code: "not_found", message: "no such image size or file" });
    }
    const image = await fetchImage(imageFetch, size, file);
    if (!image.ok) return fail(reply, image.status, { code: image.status === 404 ? "not_found" : "source_failed", message: image.reason });
    return reply.header("cache-control", IMAGE_CACHE_CONTROL).type(image.type).send(image.bytes);
  });
}
