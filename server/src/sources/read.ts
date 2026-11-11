/**
 * Lenient reading of an outside answer: each helper takes `unknown` and
 * gives back the shape asked for, or a neutral value, never throwing. A
 * source that drops or changes a field degrades a page instead of breaking
 * it.
 */

export function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
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
