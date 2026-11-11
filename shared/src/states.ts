import { z } from "zod";
import { imdbIdSchema } from "./api.js";

/**
 * A title's state for one user: one of the four ratings, not interested, or
 * want to watch. At most one at a time; none means untouched. Skips from the
 * rating cards are kept apart and are not a state. Titles are IMDb ids.
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

/** `:id` in a title's routes. */
export const titleParamsSchema = z.object({ id: imdbIdSchema });
export type TitleParams = z.infer<typeof titleParamsSchema>;

/** One title's state for the signed-in user. Times are epoch milliseconds. */
export const stateRowSchema = z.object({
  imdbId: z.string(),
  state: titleStateSchema,
  updatedAt: z.number().int(),
});
export type StateRow = z.infer<typeof stateRowSchema>;

/** `PUT /v1/titles/:id/state`. */
export const setStateRequestSchema = z.strictObject({ state: titleStateSchema });
export type SetStateRequest = z.infer<typeof setStateRequestSchema>;

/** `GET /v1/titles/:id/state`. */
export const titleStateResponseSchema = z.object({ row: stateRowSchema.nullable() });
export type TitleStateResponse = z.infer<typeof titleStateResponseSchema>;

/** `DELETE /v1/titles/:id/state`: false when there was nothing to clear. */
export const clearStateResponseSchema = z.object({ cleared: z.boolean() });
export type ClearStateResponse = z.infer<typeof clearStateResponseSchema>;

/** `POST` and `DELETE /v1/titles/:id/skip`. */
export const skipResponseSchema = z.object({ skipped: z.boolean() });
export type SkipResponse = z.infer<typeof skipResponseSchema>;

/** A list filter: one state, or `rated` for any of the four ratings. */
export const stateFilterSchema = z.union([titleStateSchema, z.literal("rated")]);
export type StateFilter = z.infer<typeof stateFilterSchema>;

export const MAX_STATES_PAGE = 200;

/** A page's cursor: the `next` of the page before. */
export const cursorSchema = z
  .string()
  .regex(/^\d+\.tt\d{7,10}$/, { message: "cursor must be the next value of the page before" });

/** `GET /v1/states`: newest first. */
export const statesQuerySchema = z.strictObject({
  state: stateFilterSchema.optional(),
  limit: z.coerce.number<string>().int().min(1).max(MAX_STATES_PAGE).optional(),
  cursor: cursorSchema.optional(),
});
export type StatesQuery = z.infer<typeof statesQuerySchema>;

export const statesResponseSchema = z.object({
  rows: z.array(stateRowSchema),
  /** The cursor for the next page, or null at the end. */
  next: z.string().nullable(),
});
export type StatesResponse = z.infer<typeof statesResponseSchema>;

/** `GET /v1/states/counts`: how many titles are in each state. */
export const stateCountsResponseSchema = z.object({
  counts: z.object(
    Object.fromEntries(TITLE_STATES.map((state) => [state, z.number().int()])) as Record<TitleState, z.ZodNumber>,
  ),
});
export type StateCountsResponse = z.infer<typeof stateCountsResponseSchema>;
