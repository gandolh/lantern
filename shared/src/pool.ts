import { z } from "zod";
import { titleKindSchema } from "./api.js";

/**
 * The title pool: films and series from IMDb's non-commercial files, kept on
 * the server and searched, dealt and ranked there. What the page gets of a
 * pool title. IMDb's terms ask for the credit line below wherever its data
 * shows.
 */

export const IMDB_CREDIT = "Information courtesy of IMDb (https://www.imdb.com). Used with permission.";

export const poolTitleSchema = z.object({
  imdbId: z.string(),
  kind: titleKindSchema,
  /** IMDb's own type: `movie`, `tvMovie`, `tvSeries` or `tvMiniSeries`. */
  imdbType: z.string(),
  title: z.string(),
  year: z.number().int().nullable(),
  /** A series' last year; null while it runs, or for a film. */
  endYear: z.number().int().nullable(),
  /** Minutes: a film's runtime, a series' usual episode. */
  runtime: z.number().int().nullable(),
  genres: z.array(z.string()),
  /** IMDb's rating out of 10, and how many voted. */
  rating: z.number(),
  votes: z.number().int(),
});
export type PoolTitle = z.infer<typeof poolTitleSchema>;

/** `GET /v1/pool`: what the last import left, or zeros before the first. */
export const poolInfoSchema = z.object({
  titles: z.number().int(),
  movies: z.number().int(),
  series: z.number().int(),
  importedAt: z.number().int().nullable(),
  minVotes: z.number().int().nullable(),
});
export type PoolInfo = z.infer<typeof poolInfoSchema>;

/** A pool title with this user's state, and whether a poster is kept for it. */
export const titleItemSchema = z.object({
  title: poolTitleSchema,
  state: z.enum(["awful", "meh", "good", "amazing", "not_interested", "want_to_watch"]).nullable(),
  /** A poster can be asked of `/v1/posters/:id` without costing an OMDb call. */
  poster: z.boolean(),
});
export type TitleItem = z.infer<typeof titleItemSchema>;

export const MAX_SEARCH_RESULTS = 30;

/** `GET /v1/search?q=&kind=`. */
export const searchQuerySchema = z.strictObject({
  q: z.string().max(200),
  kind: titleKindSchema.optional(),
});

export const searchResponseSchema = z.object({ results: z.array(titleItemSchema) });
export type SearchResponse = z.infer<typeof searchResponseSchema>;

export const MAX_SUGGESTIONS = 50;

/** `GET /v1/suggestions?kind=&limit=`. */
export const suggestionsQuerySchema = z.strictObject({
  kind: titleKindSchema.optional(),
  limit: z.coerce.number<string>().int().min(1).max(MAX_SUGGESTIONS).optional(),
});

export const suggestionSchema = z.object({
  title: poolTitleSchema,
  poster: z.boolean(),
  /** The liked title that adds the most to this one's score: "because you liked X". */
  because: z.object({ imdbId: z.string(), title: z.string() }),
});
export type Suggestion = z.infer<typeof suggestionSchema>;

export const suggestionsResponseSchema = z.object({
  suggestions: z.array(suggestionSchema),
  /** How many rated titles the profile was built from, and how many of them were liked. */
  rated: z.number().int(),
  liked: z.number().int(),
});
export type SuggestionsResponse = z.infer<typeof suggestionsResponseSchema>;
