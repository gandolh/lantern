import { z } from "zod";

/**
 * Lantern's API contract: what each route answers, as zod schemas the server
 * builds its answers from and the page parses them with. A server that
 * drifted from this shows as an error on the page, not as a half-drawn one.
 */

/** `GET /v1/health`, open to anyone: the deploy's check. */
export const healthResponseSchema = z.object({ ok: z.literal(true) });
export type HealthResponse = z.infer<typeof healthResponseSchema>;

/** Every refusal and failure under `/v1`: a machine code and a sentence for people. */
export const errorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
});
export type ErrorBody = z.infer<typeof errorBodySchema>;

/** A title is a film or a series, as TMDB files it. */
export const MEDIA_TYPES = ["movie", "tv"] as const;
export const mediaTypeSchema = z.enum(MEDIA_TYPES);
export type MediaType = z.infer<typeof mediaTypeSchema>;
