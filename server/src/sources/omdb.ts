import type { Scores } from "@lantern/shared";
import { getJson, NoKeyError, SourceError, type FetchLike } from "./http.js";
import { createQueue, OMDB_SPACING_MS, type Queue } from "./queue.js";
import { array, record, text } from "./read.js";

/**
 * OMDb (https://www.omdbapi.com/), asked by IMDb id for the three scores:
 * IMDb, Rotten Tomatoes and Metacritic. The key is `OMDB_API_KEY`, sent as
 * `apikey`; it never reaches a log line or an error message. A free key
 * allows 1,000 requests a day.
 */

export const OMDB_API = "https://www.omdbapi.com/";

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
      url.searchParams.set("apikey", apiKey);
      // OMDb answers a bad key or a spent day with 401 and a JSON body saying which.
      return queue.run(async () => (await getJson("OMDb", url, { fetch, timeoutMs: options.timeoutMs, sleep: options.sleep }, [401])).body);
    },
  };
}

export type OmdbReading = { outcome: "found"; scores: Scores } | { outcome: "not_found" };

/** "8.8/10" → 8.8; "87%" → 87; "74/100" → 74. Null for "N/A" or anything else. */
function number(value: unknown, pattern: RegExp): number | null {
  const match = typeof value === "string" ? pattern.exec(value.trim()) : null;
  return match ? Number(match[1]) : null;
}

/**
 * OMDb's answer read into the three scores. `Response: "False"` with "not
 * found" or "Incorrect IMDb ID" is a not-found; any other refusal (a bad
 * key, the daily limit) throws, so it is never cached and the next view asks
 * again.
 */
export function readOmdb(value: unknown): OmdbReading {
  const answer = record(value);
  if (answer?.Response !== "True") {
    const error = text(answer?.Error, 200) ?? "no answer";
    if (/not found|incorrect imdb id/i.test(error)) return { outcome: "not_found" };
    throw new SourceError("refused", `OMDb refused: ${error}`);
  }
  const ratings = new Map(
    array(answer.Ratings)
      .map((item) => record(item))
      .filter((item) => item !== undefined)
      .map((item) => [item.Source, item.Value] as const),
  );
  const imdbRating = number(answer.imdbRating, /^(\d+(?:\.\d+)?)$/) ?? number(ratings.get("Internet Movie Database"), /^(\d+(?:\.\d+)?)\/10$/);
  const votes = typeof answer.imdbVotes === "string" ? Number(answer.imdbVotes.replace(/,/g, "")) : NaN;
  const metacritic = number(answer.Metascore, /^(\d{1,3})$/) ?? number(ratings.get("Metacritic"), /^(\d{1,3})\/100$/);
  return {
    outcome: "found",
    scores: {
      imdb: imdbRating === null ? null : { rating: imdbRating, votes: Number.isInteger(votes) && votes >= 0 ? votes : null },
      rottenTomatoes: number(ratings.get("Rotten Tomatoes"), /^(\d{1,3})%$/),
      metacritic,
    },
  };
}
