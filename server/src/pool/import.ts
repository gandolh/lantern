import type { TitleKind } from "@lantern/shared";
import type { Db } from "../db.js";
import type { DatasetName, DatasetSource } from "./files.js";
import { normaliseTitle } from "./normalise.js";

/**
 * Builds the title pool from IMDb's files: `title.ratings` (kept when the
 * votes reach the threshold), then `title.basics` (films and series, not
 * adult), then `title.crew` (directors and writers, for the kept titles).
 * Each file is read once, line by line; only what passes is held in memory.
 * The new pool replaces the old one in one transaction, so a failed import
 * leaves the old pool whole. States, skips and OMDb's records are never
 * touched.
 */

/** The default vote threshold: tens of thousands of well-known titles. */
export const DEFAULT_MIN_VOTES = 1000;
/** The thresholds the report counts at, to judge the default by. */
export const REPORT_THRESHOLDS = [500, 1000, 2000, 5000] as const;

/** IMDb's types Lantern keeps, and the kind each one is. */
export const KINDS: Readonly<Record<string, TitleKind>> = {
  movie: "movie",
  tvMovie: "movie",
  tvSeries: "series",
  tvMiniSeries: "series",
};

const HEADERS: Record<DatasetName, string> = {
  "title.ratings": "tconst\taverageRating\tnumVotes",
  "title.basics": "tconst\ttitleType\tprimaryTitle\toriginalTitle\tisAdult\tstartYear\tendYear\truntimeMinutes\tgenres",
  "title.crew": "tconst\tdirectors\twriters",
};

/** The file's layout changed: the import stops and the old pool stays. */
export class DatasetFormatError extends Error {
  override readonly name = "DatasetFormatError";
}

interface Kept {
  imdbId: string;
  kind: TitleKind;
  imdbType: string;
  title: string;
  startYear: number | null;
  endYear: number | null;
  runtime: number | null;
  genres: string;
  rating: number;
  votes: number;
  directors: string;
  writers: string;
}

export interface ImportReport {
  minVotes: number;
  movies: number;
  series: number;
  /** Titles of the kept types at each threshold, as if it were the one used. */
  atThreshold: { minVotes: number; movies: number; series: number }[];
  tookMs: number;
}

export interface ImportOptions {
  db: Db;
  datasets: DatasetSource;
  minVotes?: number;
  /** Epoch milliseconds, for the import's record. */
  now?: () => number;
  /** Progress lines for the person running it. */
  log?: (line: string) => void;
}

/**
 * A copy of a string that holds nothing else alive. A field split out of a
 * line is, to V8, a slice of the whole chunk the line was read in; keeping
 * one title kept its 64 KB chunk, and keeping one title in fifty kept nearly
 * all of `title.basics` (over 600 MB). Kept fields are copied.
 */
function own(text: string): string {
  return Buffer.from(text, "utf8").toString("utf8");
}

/** IMDb writes `\N` for a missing value. */
const value = (field: string | undefined): string | null =>
  field === undefined || field === "\\N" || field === "" ? null : field;

function year(field: string | undefined): number | null {
  const v = value(field);
  return v !== null && /^\d{4}$/.test(v) ? Number(v) : null;
}

/** The ids in a comma-separated list, kept only when they look like IMDb's name ids. */
function ids(field: string | undefined): string {
  const v = value(field);
  return v === null
    ? ""
    : v
        .split(",")
        .filter((id) => /^nm\d{7,10}$/.test(id))
        .join(",");
}

/** Every line of a file after its header, which must be the one expected. */
async function* rows(datasets: DatasetSource, name: DatasetName): AsyncGenerator<string[]> {
  let header = true;
  for await (const line of await datasets(name)) {
    if (header) {
      if (line.replace(/^\uFEFF/, "") !== HEADERS[name])
        throw new DatasetFormatError(`${name} has an unexpected header; IMDb may have changed its layout`);
      header = false;
      continue;
    }
    if (line !== "") yield line.split("\t");
  }
  if (header) throw new DatasetFormatError(`${name} is empty`);
}

export async function importPool({
  db,
  datasets,
  minVotes = DEFAULT_MIN_VOTES,
  now = Date.now,
  log = () => undefined,
}: ImportOptions): Promise<ImportReport> {
  const started = performance.now();
  const floor = Math.min(minVotes, ...REPORT_THRESHOLDS);

  // 1. Ratings: every title with at least the lowest threshold counted.
  const ratings = new Map<string, { rating: number; votes: number }>();
  for await (const [id, rating, votes] of rows(datasets, "title.ratings")) {
    const n = Number(votes);
    if (n >= floor && id !== undefined && /^tt\d{7,10}$/.test(id))
      ratings.set(own(id), { rating: Number(rating), votes: n });
  }
  log(`title.ratings: ${ratings.size} titles with ${floor} votes or more`);

  // 2. Basics: films and series, not adult, rated enough.
  const kept = new Map<string, Kept>();
  const atThreshold = REPORT_THRESHOLDS.map((threshold) => ({ minVotes: threshold, movies: 0, series: 0 }));
  for await (const [id, type, title, , isAdult, start, end, runtime, genres] of rows(datasets, "title.basics")) {
    const rated = id === undefined ? undefined : ratings.get(id);
    const kind = type === undefined ? undefined : KINDS[type];
    if (!rated || !kind || isAdult !== "0" || !title) continue;
    for (const count of atThreshold) if (rated.votes >= count.minVotes) count[kind === "movie" ? "movies" : "series"]++;
    if (rated.votes < minVotes) continue;
    const minutes = value(runtime);
    const imdbId = own(id!);
    kept.set(imdbId, {
      imdbId,
      kind,
      imdbType: own(type!),
      title: own(title),
      startYear: year(start),
      endYear: year(end),
      runtime: minutes !== null && /^\d{1,5}$/.test(minutes) ? Number(minutes) : null,
      genres: own(value(genres) ?? ""),
      rating: rated.rating,
      votes: rated.votes,
      directors: "",
      writers: "",
    });
  }
  ratings.clear();
  log(`title.basics: ${kept.size} films and series kept`);

  // 3. Crew: the directors and writers of the kept titles.
  for await (const [id, directors, writers] of rows(datasets, "title.crew")) {
    const title = id === undefined ? undefined : kept.get(id);
    if (!title) continue;
    title.directors = ids(directors);
    title.writers = ids(writers);
  }
  log("title.crew: directors and writers joined");

  // 4. Replace the pool in one transaction.
  const movies = [...kept.values()].filter((title) => title.kind === "movie").length;
  const series = kept.size - movies;
  const tookMs = Math.round(performance.now() - started);
  const insert = db.prepare(`
    INSERT INTO titles (imdb_id, kind, imdb_type, title, search_title, start_year, end_year, runtime, genres, rating, votes, directors, writers)
    VALUES (@imdbId, @kind, @imdbType, @title, @searchTitle, @startYear, @endYear, @runtime, @genres, @rating, @votes, @directors, @writers)`);
  db.transaction(() => {
    db.exec("DELETE FROM titles");
    for (const title of kept.values()) insert.run({ ...title, searchTitle: normaliseTitle(title.title) });
    db.prepare("INSERT INTO pool_imports (imported_at, min_votes, movies, series, took_ms) VALUES (?, ?, ?, ?, ?)").run(
      now(),
      minVotes,
      movies,
      series,
      tookMs,
    );
  })();
  return { minVotes, movies, series, atThreshold, tookMs };
}
