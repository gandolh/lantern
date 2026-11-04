import type { MediaType } from "@lantern/shared";
import { getJson, NoKeyError, type FetchLike } from "./http.js";
import { createQueue, TMDB_SPACING_MS, type Queue } from "./queue.js";

/**
 * TMDB's API v3 (https://developer.themoviedb.org/docs), English only. Each
 * method returns TMDB's answer as it came; the readers in `tmdbReaders.ts`
 * keep what Lantern uses. Every call goes through one queue.
 *
 * The key is `TMDB_API_KEY`: TMDB's settings page shows an "API Key" (sent as
 * the `api_key` query parameter) and a longer "API Read Access Token" (a JWT,
 * sent as `Authorization: Bearer`). Either works; the shape decides which.
 * Neither ever reaches a log line or an error message.
 */

export const TMDB_API = "https://api.themoviedb.org/3";
const LANGUAGE = "en-US";

/** One call per title: the details with keywords, people, the IMDb id and recommendations appended. */
export const APPEND: Record<MediaType, string> = {
  movie: "keywords,credits,recommendations",
  tv: "keywords,aggregate_credits,external_ids,recommendations",
};

/** Which list deals the rating cards: TMDB's popular list, or the titles most voted on. */
export type DeckList = "popular" | "best_known";

export interface TmdbClient {
  readonly enabled: boolean;
  search(query: string, page: number): Promise<unknown>;
  details(mediaType: MediaType, id: number): Promise<unknown>;
  list(list: DeckList, mediaType: MediaType, page: number): Promise<unknown>;
  genres(mediaType: MediaType): Promise<unknown>;
}

export interface TmdbOptions {
  /** `TMDB_API_KEY`; unset, every call fails with `NoKeyError`. */
  apiKey: string | undefined;
  fetch?: FetchLike;
  queue?: Queue;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

/** A read access token is a JWT: three base64url parts, the first `eyJ`. */
export function isReadAccessToken(key: string): boolean {
  return /^eyJ[\w-]*\.[\w-]+\.[\w-]+$/.test(key);
}

export function createTmdbClient(options: TmdbOptions): TmdbClient {
  const { apiKey } = options;
  const fetch = options.fetch ?? globalThis.fetch;
  const queue = options.queue ?? createQueue(TMDB_SPACING_MS);
  const bearer = apiKey !== undefined && isReadAccessToken(apiKey);

  function get(path: string, params: Record<string, string>): Promise<unknown> {
    if (apiKey === undefined) return Promise.reject(new NoKeyError("TMDB"));
    const url = new URL(`${TMDB_API}${path}`);
    for (const [name, value] of Object.entries({ language: LANGUAGE, ...params })) url.searchParams.set(name, value);
    if (!bearer) url.searchParams.set("api_key", apiKey);
    const headers: Record<string, string> = bearer ? { authorization: `Bearer ${apiKey}` } : {};
    return queue.run(async () => (await getJson("TMDB", url, { fetch, headers, timeoutMs: options.timeoutMs, sleep: options.sleep })).body);
  }

  return {
    enabled: apiKey !== undefined,
    search: (query, page) => get("/search/multi", { query, page: String(page), include_adult: "false" }),
    details: (mediaType, id) => get(`/${mediaType}/${id}`, { append_to_response: APPEND[mediaType] }),
    list: (list, mediaType, page) =>
      list === "popular"
        ? get(`/${mediaType}/popular`, { page: String(page) })
        : get(`/discover/${mediaType}`, { sort_by: "vote_count.desc", include_adult: "false", page: String(page) }),
    genres: (mediaType) => get(`/genre/${mediaType}/list`, {}),
  };
}
