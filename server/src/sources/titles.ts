import type { MediaType, Scores, TitleDetails, TitleSummary } from "@lantern/shared";
import { cacheKey, FRESH_FOR, type SourceCache } from "./cache.js";
import { SourceError } from "./http.js";
import { readOmdb, type OmdbClient } from "./omdb.js";
import { singleFlight } from "./queue.js";
import type { DeckList, TmdbClient } from "./tmdb.js";
import { readDetails, readGenres, readListPage, type ListPage } from "./tmdbReaders.js";

/**
 * The one door to the outside sources for the routes: each method answers
 * from the cache when it can and asks the source through its queue when it
 * must, storing what the reader kept. A stale row is refreshed when it is
 * used, and served as it is if the refresh fails; a row past TMDB's six
 * months is never served. Nothing here runs unless a request asks.
 */

export interface TitleRef {
  mediaType: MediaType;
  tmdbId: number;
}

/** TMDB has no such title (a 404, or an answer without one). Routes answer 404. */
export class TitleNotFoundError extends Error {
  override readonly name = "TitleNotFoundError";
}

export type ScoresResult = { status: "found"; scores: Scores } | { status: "none"; reason: "no_imdb_id" | "not_found" };

export interface Summaries {
  /** By `movie:603`. */
  found: Map<string, TitleSummary>;
  /** How many asked for are still missing because the fetch budget ran out or a fetch failed. */
  pending: number;
}

export interface Sources {
  readonly status: { tmdb: boolean; omdb: boolean };
  details(mediaType: MediaType, id: number): Promise<TitleDetails>;
  search(query: string, page: number): Promise<ListPage>;
  list(list: DeckList, mediaType: MediaType, page: number): Promise<ListPage>;
  /** Genre names by id. */
  genres(mediaType: MediaType): Promise<Map<number, string>>;
  /**
   * Summaries of many titles, for a list page: from cached details, fetching
   * at most `maxFetch` missing (first) or stale ones.
   */
  summaries(titles: readonly TitleRef[], maxFetch: number): Promise<Summaries>;
  /** OMDb's scores for a title, by the IMDb id in its TMDB details. */
  scores(mediaType: MediaType, id: number): Promise<ScoresResult>;
}

/** The highest search page asked for: further than anyone pages a search. */
export const MAX_SEARCH_PAGE = 20;
export const MAX_QUERY_LENGTH = 100;

export const titleKey = (title: TitleRef): string => `${title.mediaType}:${title.tmdbId}`;

/** A query as a cache key: trimmed, spaces collapsed, lower case. */
export function normaliseQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLowerCase().slice(0, MAX_QUERY_LENGTH);
}

export function toSummary(details: TitleDetails): TitleSummary {
  const { mediaType, tmdbId, title, year, posterPath, genreIds, overview, voteAverage, voteCount, popularity } = details;
  return { mediaType, tmdbId, title, year, posterPath, genreIds, overview, voteAverage, voteCount, popularity };
}

export interface SourcesOptions {
  tmdb: TmdbClient;
  omdb: OmdbClient;
  cache: SourceCache;
}

export function createSources({ tmdb, omdb, cache }: SourcesOptions): Sources {
  const flight = singleFlight<unknown>();
  // Rows past six months go when the server starts; then at most hourly as the cache is read.
  cache.purge();

  /** From the cache when fresh; else asked, stored, and on failure the stale row if there is one. */
  async function cached<T>(key: string, freshForMs: number, load: () => Promise<T>): Promise<T> {
    cache.maybePurge();
    const hit = cache.get<T>(key, freshForMs);
    if (hit?.fresh) return hit.value;
    try {
      return (await flight(key, async () => {
        const value = await load();
        cache.put(key, value);
        return value;
      })) as T;
    } catch (error) {
      if (error instanceof TitleNotFoundError) {
        cache.delete(key);
        throw error;
      }
      if (hit) return hit.value;
      throw error;
    }
  }

  async function details(mediaType: MediaType, id: number): Promise<TitleDetails> {
    return cached(cacheKey("details", mediaType, id), FRESH_FOR.details, async () => {
      let answer: unknown;
      try {
        answer = await tmdb.details(mediaType, id);
      } catch (error) {
        if (error instanceof SourceError && error.failure === "not_found") throw new TitleNotFoundError(`TMDB has no ${mediaType} ${id}`);
        throw error;
      }
      const read = readDetails(mediaType, answer);
      if (read === null) throw new TitleNotFoundError(`TMDB's answer for ${mediaType} ${id} has no title`);
      return read;
    });
  }

  return {
    get status() {
      return { tmdb: tmdb.enabled, omdb: omdb.enabled };
    },

    details,

    search(query, page) {
      const normalised = normaliseQuery(query);
      return cached(cacheKey("search", page, normalised), FRESH_FOR.search, async () => readListPage(await tmdb.search(normalised, page)));
    },

    list(list, mediaType, page) {
      return cached(cacheKey("list", list, mediaType, page), FRESH_FOR.list, async () =>
        readListPage(await tmdb.list(list, mediaType, page), mediaType),
      );
    },

    async genres(mediaType) {
      const named = await cached(cacheKey("genres", mediaType), FRESH_FOR.genres, async () => readGenres(await tmdb.genres(mediaType)));
      return new Map(named.map((genre) => [genre.id, genre.name]));
    },

    async summaries(titles, maxFetch) {
      const found = new Map<string, TitleSummary>();
      const missing: TitleRef[] = [];
      const stale: TitleRef[] = [];
      for (const title of titles) {
        const key = titleKey(title);
        if (found.has(key)) continue;
        const hit = cache.get<TitleDetails>(cacheKey("details", title.mediaType, title.tmdbId), FRESH_FOR.details);
        if (hit) found.set(key, toSummary(hit.value));
        if (!hit) missing.push(title);
        else if (!hit.fresh) stale.push(title);
      }
      let budget = maxFetch;
      for (const title of [...missing, ...stale]) {
        if (budget <= 0) break;
        budget--;
        try {
          found.set(titleKey(title), toSummary(await details(title.mediaType, title.tmdbId)));
        } catch {
          // A title that fails stays as it was: missing, or served stale.
        }
      }
      const pending = missing.filter((title) => !found.has(titleKey(title))).length;
      return { found, pending };
    },

    async scores(mediaType, id) {
      const { imdbId } = await details(mediaType, id);
      if (imdbId === null) return { status: "none", reason: "no_imdb_id" };
      const hit = cache.getOmdb(imdbId);
      const reading =
        hit ??
        ((await flight(`omdb:${imdbId}`, async () => {
          const read = readOmdb(await omdb.byImdbId(imdbId));
          cache.putOmdb(imdbId, read);
          return read;
        })) as ReturnType<typeof readOmdb>);
      return reading.outcome === "found" ? { status: "found", scores: reading.scores } : { status: "none", reason: "not_found" };
    },
  };
}
