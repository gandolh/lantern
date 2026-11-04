import { z } from "zod";
import { mediaTypeSchema } from "./api.js";

/**
 * A title's state for one user: one of the four ratings, not interested, or
 * want to watch. At most one at a time; none means untouched. Skips from the
 * rating cards are kept apart and are not a state.
 */
export const RATINGS = ["awful", "meh", "good", "amazing"] as const;
export const TITLE_STATES = [...RATINGS, "not_interested", "want_to_watch"] as const;

export const ratingSchema = z.enum(RATINGS);
export type Rating = z.infer<typeof ratingSchema>;
export const titleStateSchema = z.enum(TITLE_STATES);
export type TitleState = z.infer<typeof titleStateSchema>;

export function isRating(state: TitleState): state is Rating {
  return (RATINGS as readonly string[]).includes(state);
}

/** TMDB's ids are positive 32-bit integers. */
export const tmdbIdSchema = z.coerce.number<string | number>().int().min(1).max(2_147_483_647);

/** `:type/:id` in a title's routes. */
export const titleParamsSchema = z.object({ type: mediaTypeSchema, id: tmdbIdSchema });
export type TitleParams = z.infer<typeof titleParamsSchema>;

/** One title's state for the signed-in user. Times are epoch milliseconds. */
export const stateRowSchema = z.object({
  mediaType: mediaTypeSchema,
  tmdbId: z.number().int(),
  state: titleStateSchema,
  updatedAt: z.number().int(),
});
export type StateRow = z.infer<typeof stateRowSchema>;

/** `PUT /v1/titles/:type/:id/state`. */
export const setStateRequestSchema = z.strictObject({ state: titleStateSchema });
export type SetStateRequest = z.infer<typeof setStateRequestSchema>;

/** `GET /v1/titles/:type/:id/state`. */
export const titleStateResponseSchema = z.object({ row: stateRowSchema.nullable() });
export type TitleStateResponse = z.infer<typeof titleStateResponseSchema>;

/** `DELETE /v1/titles/:type/:id/state`: false when there was nothing to clear. */
export const clearStateResponseSchema = z.object({ cleared: z.boolean() });
export type ClearStateResponse = z.infer<typeof clearStateResponseSchema>;

/** `POST` and `DELETE /v1/titles/:type/:id/skip`. */
export const skipResponseSchema = z.object({ skipped: z.boolean() });
export type SkipResponse = z.infer<typeof skipResponseSchema>;

/** A list filter: one state, or `rated` for any of the four ratings. */
export const stateFilterSchema = z.union([titleStateSchema, z.literal("rated")]);
export type StateFilter = z.infer<typeof stateFilterSchema>;

export const MAX_STATES_PAGE = 200;

/** `GET /v1/states`: newest first; `cursor` is the `next` of the page before. */
export const statesQuerySchema = z.strictObject({
  state: stateFilterSchema.optional(),
  type: mediaTypeSchema.optional(),
  limit: z.coerce.number<string>().int().min(1).max(MAX_STATES_PAGE).optional(),
  cursor: z.string().regex(/^\d+\.(movie|tv)\.\d+$/, { message: "cursor must be the next value of the page before" }).optional(),
});
export type StatesQuery = z.infer<typeof statesQuerySchema>;

export const statesResponseSchema = z.object({
  rows: z.array(stateRowSchema),
  /** The cursor for the next page, or null at the end. */
  next: z.string().nullable(),
});
export type StatesResponse = z.infer<typeof statesResponseSchema>;

const perType = z.object({ movie: z.number().int(), tv: z.number().int() });

/** `GET /v1/states/counts`: how many titles are in each state, by media type. */
export const stateCountsResponseSchema = z.object({
  counts: z.object(Object.fromEntries(TITLE_STATES.map((state) => [state, perType])) as Record<TitleState, typeof perType>),
});
export type StateCountsResponse = z.infer<typeof stateCountsResponseSchema>;
