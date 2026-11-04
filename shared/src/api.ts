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

/** A title is a film or a series. Films include IMDb's TV movies; series include mini-series. */
export const TITLE_KINDS = ["movie", "series"] as const;
export const titleKindSchema = z.enum(TITLE_KINDS);
export type TitleKind = z.infer<typeof titleKindSchema>;

/** A title's IMDb id: `tt` and 7 to 10 digits. Every title in Lantern is known by it. */
export const imdbIdSchema = z.string().regex(/^tt\d{7,10}$/, { message: "must be an IMDb id such as tt0111161" });
export type ImdbId = z.infer<typeof imdbIdSchema>;
