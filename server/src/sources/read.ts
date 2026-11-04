/**
 * Lenient reading of an outside answer: each helper takes `unknown` and
 * gives back the shape asked for, or a neutral value, never throwing. A
 * source that drops or changes a field degrades a page instead of breaking
 * it.
 */

export function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

export function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Trimmed text, cut to `max` characters; null when empty or not a string. */
export function text(value: unknown, max = 300): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
}

/** A whole number, or null. */
export function int(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

/** A positive whole number, or null. */
export function positiveInt(value: unknown): number | null {
  const n = int(value);
  return n !== null && n > 0 ? n : null;
}

/** A finite number, or 0. */
export function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** `YYYY-MM-DD` as given, or null (TMDB sends `""` for an unknown date). */
export function date(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function yearOf(isoDate: string | null): number | null {
  return isoDate === null ? null : Number(isoDate.slice(0, 4));
}

/** A TMDB image file (`/abc123.jpg`), or null. Anything else is dropped, so the proxy is only ever asked for file names. */
export function imagePath(value: unknown): string | null {
  return typeof value === "string" && /^\/[A-Za-z0-9_-]{1,64}\.(jpg|jpeg|png|webp)$/.test(value) ? value : null;
}
