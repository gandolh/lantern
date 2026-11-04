import { z } from "zod";
import { titleKindSchema } from "./api.js";
import { poolTitleSchema } from "./pool.js";
import { omdbRecordSchema } from "./titles.js";

/**
 * The rating cards: the pool's most-voted titles this user hasn't marked or
 * skipped, a few at a time. A card carries OMDb's record only when the
 * server already keeps it; the page asks for the rest as cards come up.
 */
export const MAX_CARDS = 20;

export const cardSchema = z.object({
  title: poolTitleSchema,
  poster: z.boolean(),
  record: omdbRecordSchema.nullable(),
});
export type Card = z.infer<typeof cardSchema>;

/** `GET /v1/cards?kind=&count=&exclude=`: `exclude` lists the ids the page already holds. */
export const cardsQuerySchema = z.strictObject({
  kind: titleKindSchema.optional(),
  count: z.coerce.number<string>().int().min(1).max(MAX_CARDS).optional(),
  exclude: z
    .string()
    .regex(/^(tt\d{7,10})(,tt\d{7,10}){0,49}$/, { message: "exclude must be up to 50 IMDb ids, comma-separated" })
    .optional(),
});

export const cardsResponseSchema = z.object({ cards: z.array(cardSchema) });
export type CardsResponse = z.infer<typeof cardsResponseSchema>;
