import { z } from "zod";
import { mediaTypeSchema } from "./api.js";

/**
 * What Lantern keeps of TMDB's and OMDb's answers: only the fields it shows
 * or scores, in English. Built by the server's readers, cached on the server
 * (TMDB's data six months at most), and sent to the page as is.
 */

/** A title in a list: search results, the popular lists, recommendations. */
export const titleSummarySchema = z.object({
  mediaType: mediaTypeSchema,
  tmdbId: z.number().int(),
  title: z.string(),
  /** From the release date (films) or the first air date (series); null when TMDB has none. */
  year: z.number().int().nullable(),
  /** A TMDB image file such as `/abc.jpg`, shown through Lantern's poster proxy. */
  posterPath: z.string().nullable(),
  genreIds: z.array(z.number().int()),
  overview: z.string(),
  voteAverage: z.number(),
  voteCount: z.number().int(),
  popularity: z.number(),
});
export type TitleSummary = z.infer<typeof titleSummarySchema>;

export const namedSchema = z.object({ id: z.number().int(), name: z.string() });
export type Named = z.infer<typeof namedSchema>;

export const castMemberSchema = z.object({ id: z.number().int(), name: z.string(), character: z.string() });
export type CastMember = z.infer<typeof castMemberSchema>;

/** One title's page: one TMDB call with keywords, people, the IMDb id and recommendations appended. */
export const titleDetailsSchema = titleSummarySchema.extend({
  genres: z.array(namedSchema),
  /** Films: the release date; series: the first air date. `YYYY-MM-DD`. */
  releaseDate: z.string().nullable(),
  /** Series only: the year of the last air date. */
  endYear: z.number().int().nullable(),
  /** Minutes: a film's runtime, a series' usual episode. */
  runtime: z.number().int().nullable(),
  seasons: z.number().int().nullable(),
  episodes: z.number().int().nullable(),
  status: z.string().nullable(),
  tagline: z.string().nullable(),
  backdropPath: z.string().nullable(),
  imdbId: z.string().nullable(),
  keywords: z.array(namedSchema),
  /** The top of the billing, at most 10. */
  cast: z.array(castMemberSchema),
  /** Films: the directors; series: the creators. */
  directors: z.array(namedSchema),
  recommendations: z.array(titleSummarySchema),
});
export type TitleDetails = z.infer<typeof titleDetailsSchema>;

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

/** `GET /v1/sources`: whether each key is set, so the page can say why something is missing. */
export const sourcesResponseSchema = z.object({ tmdb: z.boolean(), omdb: z.boolean() });
export type SourcesResponse = z.infer<typeof sourcesResponseSchema>;

/** The poster sizes the proxy serves (TMDB's poster sizes, `original` left out). */
export const IMAGE_SIZES = ["w92", "w185", "w342", "w500", "w780"] as const;
export type ImageSize = (typeof IMAGE_SIZES)[number];
