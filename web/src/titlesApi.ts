import {
  clearStateResponseSchema,
  recordResponseSchema,
  searchResponseSchema,
  stateRowSchema,
  titleItemSchema,
  type RecordResponse,
  type SearchResponse,
  type TitleItem,
  type TitleKind,
  type TitleState,
} from "@lantern/shared";
import { request } from "./api";

/** The page's requests about titles and their states. */

export function searchTitles(query: string, kind: TitleKind | undefined, signal?: AbortSignal): Promise<SearchResponse> {
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
