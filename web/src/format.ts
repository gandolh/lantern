import type { PoolTitle, TitleKind } from "@lantern/shared";

/** Small formatters shared by the pages. English only. */

const COMPACT = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** 2600000 → "2.6M". */
export const votes = (n: number): string => COMPACT.format(n);

/** 148 → "2h 28m"; 57 → "57m". */
export function runtime(minutes: number | null): string | null {
  if (minutes === null) return null;
  const hours = Math.floor(minutes / 60);
  return hours === 0 ? `${minutes}m` : `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
}

export const kindLabel = (kind: TitleKind): string => (kind === "movie" ? "Film" : "Series");

/** A film's year; a series' run, "2011 to 2019" or, while it runs, "2019–". */
export function years(title: Pick<PoolTitle, "kind" | "year" | "endYear">): string | null {
  if (title.year === null) return null;
  if (title.kind === "movie") return String(title.year);
  if (title.endYear === null) return `${title.year}–`;
  return title.endYear === title.year ? String(title.year) : `${title.year} to ${title.endYear}`;
}
