import type { Card, ListRow, OmdbRecord, PoolTitle, Suggestion, TitleItem } from "@lantern/shared";

/**
 * The stand-in titles the specs draw, with the figures the redesign's comps use. Their ids were picked so the six
 * poster tints fall as the comps drew them (the tile's colour comes from the id).
 */
const title = (
  imdbId: string,
  name: string,
  kind: PoolTitle["kind"],
  year: number,
  endYear: number | null,
  runtime: number | null,
  genres: string[],
  rating: number,
  votes: number,
): PoolTitle => ({
  imdbId,
  kind,
  imdbType: kind === "movie" ? "movie" : "tvSeries",
  title: name,
  year,
  endYear,
  runtime,
  genres,
  rating,
  votes,
});

const COPPER = title("tt9100004", "Copper Kitchen", "movie", 2023, null, 104, ["Crime", "Mystery"], 8.0, 164000);
const CLOCK = title("tt9100008", "Little Clock", "series", 2010, 2013, null, ["Documentary", "Crime"], 7.9, 722000);
const SAMPLE = title("tt9100014", "Sample Harbour", "series", 2019, 2022, null, ["Sci-Fi", "Drama"], 9.1, 74000);
const SILVER = title("tt9100015", "Silver Echo", "movie", 2022, null, 118, ["Sci-Fi", "Drama"], 8.1, 614000);
export const HARBOUR = title(
  "tt9100023",
  "Distant Harbour",
  "series",
  2017,
  2020,
  null,
  ["Comedy", "Romance"],
  7.9,
  218000,
);
export const AMBER = title("tt9100025", "Amber Border", "movie", 2005, null, 108, ["Crime", "Mystery"], 7.0, 704000);
const TIDE = title("tt9100028", "Quiet Tide", "movie", 2019, null, 99, ["Drama"], 8.2, 301000);
const BORROWED = title("tt9100033", "Borrowed Lantern", "movie", 2016, null, 112, ["Documentary"], 8.4, 410000);
const ENGINE = title("tt9100035", "Slow Engine", "movie", 2014, null, 126, ["Sci-Fi"], 7.8, 255000);
export const FOUNDRY = title("tt9100036", "Paper Foundry", "movie", 2011, null, 97, ["Comedy"], 7.2, 98000);
export const HOLLOW = title("tt9100037", "Open Hollow", "series", 2020, null, null, ["Thriller"], 7.6, 143000);

export const SUGGESTIONS: Suggestion[] = [
  { title: COPPER, poster: false, because: { imdbId: TIDE.imdbId, title: TIDE.title } },
  { title: CLOCK, poster: false, because: { imdbId: BORROWED.imdbId, title: BORROWED.title } },
  { title: SAMPLE, poster: false, because: { imdbId: BORROWED.imdbId, title: BORROWED.title } },
  { title: SILVER, poster: false, because: { imdbId: ENGINE.imdbId, title: ENGINE.title } },
];

const PLOTS: Record<string, string> = {
  [HARBOUR.imdbId]: "A chef returns to the valley she left, and the first dinner she cooks is for the whole village.",
  [AMBER.imdbId]: "A night-shift radio host starts to receive calls from a town that has no phone lines.",
  [FOUNDRY.imdbId]: "A paper mill's last night shift decides what the town prints next.",
  [HOLLOW.imdbId]: "Six neighbours share one lighthouse and a single secret.",
};

/** The OMDb record of a stand-in title that has one: its plot, three scores and its people. */
export function recordOf(id: string): OmdbRecord | null {
  const plot = PLOTS[id];
  if (!plot) return null;
  const pool = [HARBOUR, AMBER, FOUNDRY, HOLLOW].find((t) => t.imdbId === id);
  if (!pool) return null;
  const series = pool.kind === "series";
  return {
    imdbId: id,
    title: pool.title,
    type: series ? "series" : "movie",
    year: pool.year,
    endYear: pool.endYear,
    ongoing: series && pool.endYear === null,
    rated: series ? "TV-14" : "PG-13",
    released: null,
    runtime: pool.runtime,
    genres: pool.genres,
    directors: series ? [] : ["Ines Calloway"],
    writers: series ? ["Hugo Sarre"] : ["Ines Calloway"],
    actors: [],
    plot,
    language: null,
    country: null,
    awards: null,
    hasPoster: false,
    seasons: series ? 3 : null,
    scores: { imdb: { rating: pool.rating, votes: pool.votes }, rottenTomatoes: 97, metacritic: 82 },
  };
}

export const CARDS: Card[] = [AMBER, FOUNDRY, HOLLOW].map((t) => ({ title: t, poster: false, record: null }));

export const itemOf = (t: PoolTitle, state: TitleItem["state"] = null): TitleItem => ({
  title: t,
  state,
  poster: false,
});

export const WATCHLIST: ListRow[] = [CLOCK, SILVER].map((t, i) => ({
  ...itemOf(t, "want_to_watch"),
  state: "want_to_watch" as const,
  updatedAt: 1_700_000_000_000 - i,
  inPool: true,
}));

export const RATED: ListRow[] = [
  { ...itemOf(TIDE, "amazing"), state: "amazing", updatedAt: 1_700_000_000_000, inPool: true },
  { ...itemOf(BORROWED, "good"), state: "good", updatedAt: 1_699_999_999_000, inPool: true },
  { ...itemOf(ENGINE, "meh"), state: "meh", updatedAt: 1_699_999_998_000, inPool: true },
];
