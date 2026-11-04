import { z } from "zod";

/**
 * What Lantern keeps of OMDb's answer for a title: only the fields it shows,
 * in English. Built by the server's reader, cached on the server once found,
 * and sent to the page as is.
 */

/** OMDb's three scores for a title; each null when OMDb doesn't have it. */
export const scoresSchema = z.object({
  /** IMDb's rating out of 10, and how many voted. */
  imdb: z.object({ rating: z.number(), votes: z.number().int().nullable() }).nullable(),
  /** Rotten Tomatoes' Tomatometer, a percentage. */
  rottenTomatoes: z.number().int().nullable(),
  /** Metacritic's Metascore, out of 100. */
  metacritic: z.number().int().nullable(),
});
export type Scores = z.infer<typeof scoresSchema>;

/** One title's OMDb record. */
export const omdbRecordSchema = z.object({
  imdbId: z.string(),
  title: z.string(),
  /** OMDb's `Type`: `movie`, `series`, `episode`, or something else. */
  type: z.string().nullable(),
  year: z.number().int().nullable(),
  /** A series' last year; null while it runs or for a film. */
  endYear: z.number().int().nullable(),
  /** A series still running (`2019–`). */
  ongoing: z.boolean(),
  rated: z.string().nullable(),
  /** As OMDb gives it, such as `16 Jul 2010`. */
  released: z.string().nullable(),
  /** Minutes: a film's runtime, a series' usual episode. */
  runtime: z.number().int().nullable(),
  genres: z.array(z.string()),
  directors: z.array(z.string()),
  writers: z.array(z.string()),
  actors: z.array(z.string()),
  plot: z.string().nullable(),
  language: z.string().nullable(),
  country: z.string().nullable(),
  awards: z.string().nullable(),
  /** Whether OMDb gave a poster; the page asks for it through `/v1/posters/:id`. */
  hasPoster: z.boolean(),
  seasons: z.number().int().nullable(),
  scores: scoresSchema,
});
export type OmdbRecord = z.infer<typeof omdbRecordSchema>;

/** `GET /v1/sources`: whether OMDb's key is set, so the page can say why something is missing. */
export const sourcesResponseSchema = z.object({ omdb: z.boolean() });
export type SourcesResponse = z.infer<typeof sourcesResponseSchema>;

/** The poster sizes the proxy serves: OMDb's own (300 pixels wide) and a larger one. */
export const POSTER_SIZES = ["normal", "large"] as const;
export type PosterSize = (typeof POSTER_SIZES)[number];

/** `GET /v1/titles/:id/record`: OMDb's record, or null when OMDb doesn't know the title. */
export const recordResponseSchema = z.object({ record: omdbRecordSchema.nullable() });
export type RecordResponse = z.infer<typeof recordResponseSchema>;
