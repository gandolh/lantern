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
