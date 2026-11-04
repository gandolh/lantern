import type { CastMember, MediaType, Named, TitleDetails, TitleSummary } from "@lantern/shared";
import { array, date, imagePath, int, num, positiveInt, record, text, yearOf } from "./read.js";

/**
 * TMDB's answers read into Lantern's shapes, keeping only what Lantern shows
 * or scores. English titles only: `title` (films) or `name` (series) as TMDB
 * gives them for `en-US`; the original-language title is never read. Adult
 * titles and people are dropped from every list.
 */

export const MAX_KEYWORDS = 30;
export const MAX_CAST = 10;
export const MAX_RECOMMENDATIONS = 20;
const OVERVIEW_MAX = 2000;

/** One list item as a summary; null for a person, an adult title, or an item without an id or a title. */
export function readSummary(value: unknown, mediaType?: MediaType): TitleSummary | null {
  const item = record(value);
  if (!item || item.adult === true) return null;
  const type = item.media_type ?? mediaType;
  if (type !== "movie" && type !== "tv") return null;
  const tmdbId = positiveInt(item.id);
  const title = text(type === "movie" ? item.title : item.name);
  if (tmdbId === null || title === null) return null;
  return {
    mediaType: type,
    tmdbId,
    title,
    year: yearOf(date(type === "movie" ? item.release_date : item.first_air_date)),
    posterPath: imagePath(item.poster_path),
    genreIds: array(item.genre_ids).map(positiveInt).filter((id) => id !== null),
    overview: text(item.overview, OVERVIEW_MAX) ?? "",
    voteAverage: num(item.vote_average),
    voteCount: Math.max(0, int(item.vote_count) ?? 0),
    popularity: num(item.popularity),
  };
}

export interface ListPage {
  page: number;
  totalPages: number;
  results: TitleSummary[];
}

/** A paged list (search, popular, discover, recommendations). `mediaType` for lists whose items don't say. */
export function readListPage(value: unknown, mediaType?: MediaType): ListPage {
  const answer = record(value);
  const results = array(answer?.results)
    .map((item) => readSummary(item, mediaType))
    .filter((summary) => summary !== null);
  // The same title twice in one page (TMDB has sent that) would show twice.
  const seen = new Set<string>();
  const unique = results.filter((summary) => {
    const key = `${summary.mediaType}:${summary.tmdbId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { page: positiveInt(answer?.page) ?? 1, totalPages: positiveInt(answer?.total_pages) ?? 1, results: unique };
}

function named(value: unknown): Named | null {
  const item = record(value);
  const id = positiveInt(item?.id);
  const name = text(item?.name, 120);
  return id === null || name === null ? null : { id, name };
}

function namedList(values: unknown[], max: number): Named[] {
  const seen = new Set<number>();
  const out: Named[] = [];
  for (const value of values) {
    const item = named(value);
    if (item === null || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
    if (out.length === max) break;
  }
  return out;
}

/** Films: `credits.cast`, in billing order. */
function movieCast(credits: Record<string, unknown> | undefined): CastMember[] {
  return array(credits?.cast)
    .map((value) => record(value))
    .filter((item) => item !== undefined)
    .sort((a, b) => (int(a.order) ?? 999) - (int(b.order) ?? 999))
    .map((item) => ({ ...named(item), character: text(item.character, 120) ?? "" }))
    .filter((member): member is CastMember => typeof member.id === "number" && typeof member.name === "string")
    .slice(0, MAX_CAST);
}

/** Series: `aggregate_credits.cast` covers every season; each member's roles carry the characters. */
function seriesCast(credits: Record<string, unknown> | undefined): CastMember[] {
  return array(credits?.cast)
    .map((value) => record(value))
    .filter((item) => item !== undefined)
    .sort((a, b) => (int(a.order) ?? 999) - (int(b.order) ?? 999) || (int(b.total_episode_count) ?? 0) - (int(a.total_episode_count) ?? 0))
    .map((item) => ({ ...named(item), character: text(record(array(item.roles)[0])?.character, 120) ?? "" }))
    .filter((member): member is CastMember => typeof member.id === "number" && typeof member.name === "string")
    .slice(0, MAX_CAST);
}

/** The details of a film or a series, with what was appended; null when the answer has no id or title. */
export function readDetails(mediaType: MediaType, value: unknown): TitleDetails | null {
  const answer = record(value);
  if (!answer) return null;
  const summary = readSummary({ ...answer, media_type: mediaType, adult: false });
  if (summary === null) return null;
  const genres = namedList(array(answer.genres), 20);
  const releaseDate = date(mediaType === "movie" ? answer.release_date : answer.first_air_date);
  const keywordsAnswer = record(answer.keywords);
  // Films keep keywords under `keywords`, series under `results`.
  const keywords = namedList(array(mediaType === "movie" ? keywordsAnswer?.keywords : keywordsAnswer?.results), MAX_KEYWORDS);
  const cast = mediaType === "movie" ? movieCast(record(answer.credits)) : seriesCast(record(answer.aggregate_credits));
  const directors =
    mediaType === "movie"
      ? namedList(
          array(record(answer.credits)?.crew).filter((member) => record(member)?.job === "Director"),
          5,
        )
      : namedList(array(answer.created_by), 5);
  const imdb = text(mediaType === "movie" ? answer.imdb_id : record(answer.external_ids)?.imdb_id, 20);
  const runtime =
    mediaType === "movie"
      ? positiveInt(answer.runtime)
      : (positiveInt(array(answer.episode_run_time)[0]) ?? positiveInt(record(answer.last_episode_to_air)?.runtime));
  const recommendations = readListPage(answer.recommendations, undefined)
    .results.filter((rec) => !(rec.mediaType === mediaType && rec.tmdbId === summary.tmdbId))
    .slice(0, MAX_RECOMMENDATIONS);
  return {
    ...summary,
    genreIds: genres.map((genre) => genre.id),
    genres,
    releaseDate,
    endYear: mediaType === "tv" ? yearOf(date(answer.last_air_date)) : null,
    runtime,
    seasons: mediaType === "tv" ? positiveInt(answer.number_of_seasons) : null,
    episodes: mediaType === "tv" ? positiveInt(answer.number_of_episodes) : null,
    status: text(answer.status, 60),
    tagline: text(answer.tagline, 300),
    backdropPath: imagePath(answer.backdrop_path),
    imdbId: imdb !== null && /^tt\d{5,10}$/.test(imdb) ? imdb : null,
    keywords,
    cast,
    directors,
    recommendations,
  };
}

/** `/genre/<type>/list`: `{ genres: [{ id, name }] }`. */
export function readGenres(value: unknown): Named[] {
  return namedList(array(record(value)?.genres), 100);
}
