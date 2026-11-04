import { describe, expect, it } from "vitest";
import { fixture } from "./testing.js";
import { readDetails, readGenres, readListPage, readSummary } from "./tmdbReaders.js";

describe("readListPage", () => {
  it("keeps films and series, drops people, adult titles and repeats", () => {
    const page = readListPage(fixture("tmdb-search"));
    expect(page.page).toBe(1);
    expect(page.totalPages).toBe(3);
    expect(page.results.map((title) => `${title.mediaType}:${title.tmdbId}`)).toEqual(["movie:27205", "tv:64835"]);
    expect(page.results[0]).toEqual({
      mediaType: "movie",
      tmdbId: 27205,
      title: "Inception",
      year: 2010,
      posterPath: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
      genreIds: [28, 878, 12],
      overview: expect.stringContaining("Cobb"),
      voteAverage: 8.4,
      voteCount: 37000,
      popularity: 83.9,
    });
  });

  it("reads an empty date and a missing poster as null", () => {
    const series = readListPage(fixture("tmdb-search")).results[1]!;
    expect(series).toMatchObject({ title: "Inception: The Cobol Job", year: null, posterPath: null, overview: "" });
  });

  it("takes the media type from the list when its items don't say", () => {
    const page = readListPage(fixture("tmdb-popular-movie"), "movie");
    expect(page.results.map((title) => title.mediaType)).toEqual(["movie", "movie"]);
    expect(page.totalPages).toBe(500);
    expect(readListPage(fixture("tmdb-popular-movie")).results).toEqual([]);
  });

  it("survives a broken answer", () => {
    expect(readListPage(null)).toEqual({ page: 1, totalPages: 1, results: [] });
    expect(readListPage({ results: "nope" }).results).toEqual([]);
  });
});

describe("readSummary", () => {
  it("never takes an image path that isn't a TMDB file name", () => {
    const item = { id: 1, title: "x", media_type: "movie", poster_path: "/../../etc/passwd" };
    expect(readSummary(item)?.posterPath).toBeNull();
    expect(readSummary({ ...item, poster_path: "https://elsewhere.example/a.jpg" })?.posterPath).toBeNull();
  });
});

describe("readDetails", () => {
  it("reads a film with its keywords, people, IMDb id and recommendations", () => {
    const film = readDetails("movie", fixture("tmdb-movie"))!;
    expect(film).toMatchObject({
      mediaType: "movie",
      tmdbId: 27205,
      title: "Inception",
      year: 2010,
      releaseDate: "2010-07-15",
      endYear: null,
      runtime: 148,
      seasons: null,
      status: "Released",
      tagline: "Your mind is the scene of the crime.",
      imdbId: "tt1375666",
      genreIds: [28, 878, 12],
    });
    expect(film.keywords.map((keyword) => keyword.name)).toEqual(["loss of loved one", "dream", "dystopia"]);
    expect(film.cast.map((member) => member.name)).toEqual(["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Ken Watanabe"]);
    expect(film.cast[0]).toEqual({ id: 6193, name: "Leonardo DiCaprio", character: "Dom Cobb" });
    expect(film.directors).toEqual([{ id: 525, name: "Christopher Nolan" }]);
    // The title itself is never its own recommendation.
    expect(film.recommendations.map((rec) => rec.title)).toEqual(["Interstellar", "The Dark Knight"]);
  });

  it("reads a series: keywords under results, the whole show's cast, creators, the IMDb id from external_ids", () => {
    const series = readDetails("tv", fixture("tmdb-tv"))!;
    expect(series).toMatchObject({
      mediaType: "tv",
      tmdbId: 1399,
      title: "Game of Thrones",
      year: 2011,
      endYear: 2019,
      seasons: 8,
      episodes: 73,
      // episode_run_time is empty, so the last episode's runtime stands in.
      runtime: 80,
      imdbId: "tt0944947",
    });
    expect(series.keywords.map((keyword) => keyword.name)).toEqual(["war", "based on novel or book"]);
    expect(series.cast[1]).toEqual({ id: 239019, name: "Kit Harington", character: "Jon Snow" });
    expect(series.directors.map((creator) => creator.name)).toEqual(["David Benioff", "D. B. Weiss"]);
    expect(series.recommendations.map((rec) => `${rec.mediaType}:${rec.title}`)).toEqual(["tv:The Walking Dead"]);
  });

  it("keeps at most 30 keywords and 10 cast", () => {
    const answer = fixture("tmdb-movie") as Record<string, unknown>;
    const many = {
      ...answer,
      keywords: { keywords: Array.from({ length: 40 }, (_, i) => ({ id: i + 1, name: `k${i}` })) },
      credits: { cast: Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: `p${i}`, order: i })), crew: [] },
    };
    const film = readDetails("movie", many)!;
    expect(film.keywords).toHaveLength(30);
    expect(film.cast).toHaveLength(10);
    expect(film.directors).toEqual([]);
  });

  it("says nothing for an answer without an id or a title", () => {
    expect(readDetails("movie", { status_code: 34, status_message: "not found" })).toBeNull();
    expect(readDetails("tv", null)).toBeNull();
  });

  it("drops an IMDb id that isn't one", () => {
    const answer = { ...(fixture("tmdb-movie") as Record<string, unknown>), imdb_id: "" };
    expect(readDetails("movie", answer)?.imdbId).toBeNull();
  });
});

describe("readGenres", () => {
  it("reads the names", () => {
    expect(readGenres(fixture("tmdb-genres-movie"))).toEqual([
      { id: 28, name: "Action" },
      { id: 12, name: "Adventure" },
      { id: 878, name: "Science Fiction" },
    ]);
  });
});
