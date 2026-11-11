import {
  cardsResponseSchema,
  clearStateResponseSchema,
  skipResponseSchema,
  recordResponseSchema,
  searchResponseSchema,
  stateRowSchema,
  titleItemSchema,
  type CardsResponse,
  type RecordResponse,
  type SearchResponse,
  type TitleItem,
  type TitleKind,
  type TitleState,
} from "@lantern/shared";
import { request } from "./api";

/** The page's requests about titles and their states. */

export function searchTitles(
  query: string,
  kind: TitleKind | undefined,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query });
  if (kind) params.set("kind", kind);
  return request("GET", `/v1/search?${params}`, (v) => searchResponseSchema.parse(v), { signal });
}

export function getTitle(imdbId: string, signal?: AbortSignal): Promise<TitleItem> {
  return request("GET", `/v1/titles/${imdbId}`, (v) => titleItemSchema.parse(v), { signal });
}

/** Set a title's state, or clear it with null. */
export async function saveState(imdbId: string, state: TitleState | null): Promise<void> {
  if (state === null) await request("DELETE", `/v1/titles/${imdbId}/state`, (v) => clearStateResponseSchema.parse(v));
  else await request("PUT", `/v1/titles/${imdbId}/state`, (v) => stateRowSchema.parse(v), { body: { state } });
}

/** A title's OMDb record: kept on the server, or asked of OMDb once (one call of the day's 1,000). */
export function getRecord(imdbId: string, signal?: AbortSignal): Promise<RecordResponse> {
  return request("GET", `/v1/titles/${imdbId}/record`, (v) => recordResponseSchema.parse(v), { signal });
}

/** The next cards, leaving out those the page already holds. */
export function dealCards(
  kind: TitleKind | undefined,
  exclude: readonly string[],
  count = 10,
  signal?: AbortSignal,
): Promise<CardsResponse> {
  const params = new URLSearchParams({ count: String(count) });
  if (kind) params.set("kind", kind);
  if (exclude.length > 0) params.set("exclude", exclude.slice(0, 50).join(","));
  return request("GET", `/v1/cards?${params}`, (v) => cardsResponseSchema.parse(v), { signal });
}

/** Skip a card, or take the skip back. */
export async function saveSkip(imdbId: string, skipped: boolean): Promise<void> {
  await request(skipped ? "POST" : "DELETE", `/v1/titles/${imdbId}/skip`, (v) => skipResponseSchema.parse(v));
}
