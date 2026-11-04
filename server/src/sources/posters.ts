import type { PosterSize } from "@lantern/shared";
import type { FetchLike } from "./http.js";
import { POSTER_HOSTS } from "./omdb.js";

/**
 * Posters through Lantern: the browser asks `/v1/posters/:id` and the server
 * fetches the image from the URL in the title's kept OMDb record, so the
 * browser never talks to an outside host. Nothing is stored on the server;
 * the browser keeps a private copy for 30 days.
 */

export const MAX_POSTER_BYTES = 5 * 1024 * 1024;
export const POSTER_TIMEOUT_MS = 10_000;
export const POSTER_CACHE_CONTROL = "private, max-age=2592000, immutable";
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * OMDb's poster URLs end in Amazon's size modifier (`._V1_SX300.jpg`, 300
 * pixels wide). The large size asks for the same image 600 wide; a URL in
 * another form is used as it is.
 */
export function posterUrlFor(url: string, size: PosterSize): string {
  return size === "large" ? url.replace(/_SX300(\.(?:jpg|png))$/, "_SX600$1") : url;
}

export type PosterResult = { ok: true; type: string; bytes: Buffer } | { ok: false; status: 404 | 502; reason: string };

/** Fetch one poster, from an allowed host only, at most `MAX_POSTER_BYTES` and `POSTER_TIMEOUT_MS`. */
export async function fetchPoster(fetch: FetchLike, url: string, timeoutMs = POSTER_TIMEOUT_MS): Promise<PosterResult> {
  const target = new URL(url);
  if (target.protocol !== "https:" || !POSTER_HOSTS.has(target.hostname)) return { ok: false, status: 404, reason: "not an allowed poster host" };
  let response: Response;
  try {
    // No redirects: an answer from anywhere but the allowed host is not taken.
    response = await fetch(target, { redirect: "error", signal: AbortSignal.timeout(timeoutMs) });
  } catch {
    return { ok: false, status: 502, reason: "the poster host didn't answer" };
  }
  if (response.status === 404) return { ok: false, status: 404, reason: "no such poster" };
  if (!response.ok) return { ok: false, status: 502, reason: `the poster host answered ${response.status}` };
  const type = (response.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
  if (!TYPES.has(type)) return { ok: false, status: 502, reason: "the poster host sent something that isn't an image" };
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_POSTER_BYTES) return { ok: false, status: 502, reason: "the poster is too large" };
  if (!response.body) return { ok: false, status: 502, reason: "the poster is empty" };
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    for await (const chunk of response.body) {
      total += chunk.byteLength;
      if (total > MAX_POSTER_BYTES) return { ok: false, status: 502, reason: "the poster is too large" };
      chunks.push(Buffer.from(chunk));
    }
  } catch {
    return { ok: false, status: 502, reason: "the poster stopped halfway" };
  }
  return { ok: true, type, bytes: Buffer.concat(chunks) };
}
