import { IMAGE_SIZES, type ImageSize } from "@lantern/shared";
import type { FetchLike } from "./http.js";

/**
 * Posters through Lantern: the browser asks `/v1/images/:size/:file` and the
 * server fetches it from TMDB's image host, so the browser never talks to an
 * outside host. Nothing is stored on the server; the browser keeps a private
 * copy for 30 days (TMDB's image paths change when the image does).
 */

export const IMAGE_HOST = "https://image.tmdb.org/t/p/";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TIMEOUT_MS = 10_000;
export const IMAGE_CACHE_CONTROL = "private, max-age=2592000, immutable";
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isImageSize(value: string): value is ImageSize {
  return (IMAGE_SIZES as readonly string[]).includes(value);
}

/** A TMDB image file name, without the leading slash: letters, digits, `-`, `_`, and an image extension. */
export function isImageFile(value: string): boolean {
  return /^[A-Za-z0-9_-]{1,64}\.(jpg|jpeg|png|webp)$/.test(value);
}

export type ImageResult = { ok: true; type: string; bytes: Buffer } | { ok: false; status: 404 | 502; reason: string };

/** Fetch one image from TMDB's host, at most `MAX_IMAGE_BYTES` and `IMAGE_TIMEOUT_MS`. */
export async function fetchImage(fetch: FetchLike, size: ImageSize, file: string, timeoutMs = IMAGE_TIMEOUT_MS): Promise<ImageResult> {
  const url = new URL(`${IMAGE_HOST}${size}/${file}`);
  let response: Response;
  try {
    // No redirects: an answer from anywhere but TMDB's host is not taken.
    response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(timeoutMs) });
  } catch {
    return { ok: false, status: 502, reason: "TMDB's image host didn't answer" };
  }
  if (response.status === 404) return { ok: false, status: 404, reason: "no such image" };
  if (!response.ok) return { ok: false, status: 502, reason: `TMDB's image host answered ${response.status}` };
  const type = (response.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
  if (!TYPES.has(type)) return { ok: false, status: 502, reason: "TMDB's image host sent something that isn't an image" };
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_IMAGE_BYTES) return { ok: false, status: 502, reason: "the image is too large" };
  if (!response.body) return { ok: false, status: 502, reason: "the image is empty" };
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    for await (const chunk of response.body) {
      total += chunk.byteLength;
      if (total > MAX_IMAGE_BYTES) return { ok: false, status: 502, reason: "the image is too large" };
      chunks.push(Buffer.from(chunk));
    }
  } catch {
    return { ok: false, status: 502, reason: "the image stopped halfway" };
  }
  return { ok: true, type, bytes: Buffer.concat(chunks) };
}
