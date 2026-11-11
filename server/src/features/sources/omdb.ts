import type { OmdbRecord, Scores } from "@lantern/shared";
import { getJson, NoKeyError, SourceError, type FetchLike } from "./http.js";
import { createQueue, OMDB_SPACING_MS, type Queue } from "./queue.js";
import { array, record, text } from "./read.js";

/**
 * OMDb (https://www.omdbapi.com/), asked by IMDb id for a title's whole
 * record: poster, plot, people, runtime and the three scores. The key is
 * `OMDB_API_KEY`, sent as `apikey`; it never reaches a log line or an error
 * message. A free key allows 1,000 requests a day, so OMDb is asked only for a
 * title shown in full, once.
 */

export const OMDB_API = "https://www.omdbapi.com/";

/** The hosts a poster URL may point at; anything else is dropped. */
export const POSTER_HOSTS: ReadonlySet<string> = new Set(["m.media-amazon.com"]);

export interface OmdbClient {
  readonly enabled: boolean;
  /** OMDb's answer for an IMDb id, as it came. */
  byImdbId(imdbId: string): Promise<unknown>;
}

export interface OmdbOptions {
  apiKey: string | undefined;
  fetch?: FetchLike;
  queue?: Queue;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

export function createOmdbClient(options: OmdbOptions): OmdbClient {
  const { apiKey } = options;
  const fetch = options.fetch ?? globalThis.fetch;
  const queue = options.queue ?? createQueue(OMDB_SPACING_MS);
  return {
    enabled: apiKey !== undefined,
    byImdbId(imdbId) {
      if (apiKey === undefined) return Promise.reject(new NoKeyError("OMDb"));
      const url = new URL(OMDB_API);
      url.searchParams.set("i", imdbId);
      url.searchParams.set("plot", "full");
      url.searchParams.set("apikey", apiKey);
      // OMDb answers a bad key or a spent day with 401 and a JSON body saying which.
      return queue.run(
        async () =>
          (await getJson("OMDb", url, { fetch, timeoutMs: options.timeoutMs, sleep: options.sleep }, [401])).body,
      );
    },
  };
}

/** The record as the server keeps it: the page's shape plus the poster's URL, which only the server uses. */
export type StoredRecord = OmdbRecord & { posterUrl: string | null };

export type OmdbReading = { outcome: "found"; record: StoredRecord } | { outcome: "not_found" };

/** OMDb writes `N/A` for what it doesn't know. */
function known(value: unknown, max = 300): string | null {
  const read = text(value, max);
  return read === null || read === "N/A" ? null : read;
}

/** "8.8/10" → 8.8; "87%" → 87; "74/100" → 74. Null for "N/A" or anything else. */
function number(value: unknown, pattern: RegExp): number | null {
  const match = typeof value === "string" ? pattern.exec(value.trim()) : null;
  return match ? Number(match[1]) : null;
}

/** "Jonathan Nolan (screenplay), Christopher Nolan (story)" → the names, once each, without the notes. */
export function names(value: unknown, max = 20): string[] {
  const list = known(value, 2000);
  if (list === null) return [];
  const seen = new Set<string>();
  for (const part of list.split(",")) {
    const name = part.replace(/\([^)]*\)/g, "").trim();
    if (name !== "" && !seen.has(name)) seen.add(name);
    if (seen.size === max) break;
  }
  return [...seen];
}

/** "2010", "2011–2019", "2019–" (an en dash, sometimes a hyphen). */
function years(value: unknown): { year: number | null; endYear: number | null; ongoing: boolean } {
  const match = typeof value === "string" ? /^(\d{4})(?:\s*[–-]\s*(\d{4})?)?$/.exec(value.trim()) : null;
  if (!match) return { year: null, endYear: null, ongoing: false };
  const dash = /[–-]/.test(value as string);
  return { year: Number(match[1]), endYear: match[2] ? Number(match[2]) : null, ongoing: dash && !match[2] };
}

/** An https poster on an allowed host, or null. */
function posterUrl(value: unknown): string | null {
  const raw = known(value, 500);
  if (raw === null || !URL.canParse(raw)) return null;
  const url = new URL(raw);
  return url.protocol === "https:" && POSTER_HOSTS.has(url.hostname) && url.port === "" ? url.href : null;
}

function scoresOf(answer: Record<string, unknown>): Scores {
  const ratings = new Map(
    array(answer.Ratings)
      .map((item) => record(item))
      .filter((item) => item !== undefined)
      .map((item) => [item.Source, item.Value] as const),
  );
  const imdbRating =
    number(answer.imdbRating, /^(\d+(?:\.\d+)?)$/) ??
    number(ratings.get("Internet Movie Database"), /^(\d+(?:\.\d+)?)\/10$/);
  const votes = typeof answer.imdbVotes === "string" ? Number(answer.imdbVotes.replace(/,/g, "")) : NaN;
  return {
    imdb:
      imdbRating === null ? null : { rating: imdbRating, votes: Number.isInteger(votes) && votes >= 0 ? votes : null },
    rottenTomatoes: number(ratings.get("Rotten Tomatoes"), /^(\d{1,3})%$/),
    metacritic: number(answer.Metascore, /^(\d{1,3})$/) ?? number(ratings.get("Metacritic"), /^(\d{1,3})\/100$/),
  };
}

/**
 * OMDb's answer read into a record. `Response: "False"` with "not found" or
 * "Incorrect IMDb ID" is a not-found; any other refusal (a bad key, the daily
 * limit) throws, so it is never cached and the next view asks again.
 */
export function readOmdb(value: unknown, imdbId: string): OmdbReading {
  const answer = record(value);
  if (answer?.Response !== "True") {
    const error = text(answer?.Error, 200) ?? "no answer";
    if (/not found|incorrect imdb id/i.test(error)) return { outcome: "not_found" };
    throw new SourceError("refused", `OMDb refused: ${error}`);
  }
  const title = known(answer.Title, 300);
  if (title === null) return { outcome: "not_found" };
  const poster = posterUrl(answer.Poster);
  const seasons = number(answer.totalSeasons, /^(\d{1,3})$/);
  return {
    outcome: "found",
    record: {
      imdbId,
      title,
      type: known(answer.Type, 20),
      ...years(answer.Year),
      rated: known(answer.Rated, 20),
      released: known(answer.Released, 40),
      runtime: number(answer.Runtime, /^(\d{1,4}) min$/),
      genres: names(answer.Genre, 10),
      directors: names(answer.Director),
      writers: names(answer.Writer),
      actors: names(answer.Actors),
      plot: known(answer.Plot, 4000),
      language: known(answer.Language, 200),
      country: known(answer.Country, 200),
      awards: known(answer.Awards, 300),
      hasPoster: poster !== null,
      posterUrl: poster,
      seasons: seasons !== null && seasons > 0 ? seasons : null,
      scores: scoresOf(answer),
    },
  };
}

/** The record without the poster's URL, as the page gets it. */
export function forPage(stored: StoredRecord): OmdbRecord {
  const { posterUrl: _posterUrl, ...page } = stored;
  return page;
}
