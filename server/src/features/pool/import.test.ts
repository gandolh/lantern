import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type Db } from "../../db.js";
import { createStatesStore } from "../states/index.js";
import { fakeFetch } from "../sources/index.js";
import { httpDatasets, localDatasets, type DatasetName, type DatasetSource } from "./files.js";
import { DatasetFormatError, importPool } from "./import.js";
import { normaliseTitle } from "./normalise.js";
import { createPool } from "./store.js";

const FIXTURES = new URL("./fixtures/", import.meta.url);
const fixtures = localDatasets(new URL(".", FIXTURES).pathname);

let db: Db;
beforeEach(() => {
  db = openDatabase(":memory:");
});
afterEach(() => {
  db.close();
});

describe("the import", () => {
  it("keeps films and series, not adult, with enough votes, and joins their crew", async () => {
    const report = await importPool({ db, datasets: fixtures, minVotes: 1000, now: () => 42 });
    const pool = createPool(db);
    const ids = (db.prepare("SELECT imdb_id AS id FROM titles ORDER BY imdb_id").all() as { id: string }[]).map(
      (row) => row.id,
    );
    // Not: a short, a 600-vote film, an adult film, an episode, an unrated film.
    expect(ids).toEqual(["tt0000003", "tt0000005", "tt0111161", "tt0944947", "tt1375666"]);
    expect(report).toMatchObject({ minVotes: 1000, movies: 3, series: 2 });
    expect(pool.info()).toEqual({ titles: 5, movies: 3, series: 2, importedAt: 42, minVotes: 1000 });

    expect(pool.get("tt0944947")).toEqual({
      imdbId: "tt0944947",
      kind: "series",
      imdbType: "tvSeries",
      title: "Game of Thrones",
      startYear: 2011,
      endYear: 2019,
      runtime: 57,
      genres: "Action,Adventure,Drama",
      rating: 9.2,
      votes: 2400000,
      directors: "nm0851930,nm0638354",
      writers: "nm1125275,nm1888967",
    });
    // A TV movie is a film; \N is none; quotes and commas in a title survive; a bad crew id is dropped.
    expect(pool.get("tt0000003")).toMatchObject({
      kind: "movie",
      title: 'Amélie & "Friends", Part 2',
      startYear: null,
      runtime: null,
      genres: "",
      directors: "",
    });
    expect(pool.get("tt0000005")).toMatchObject({ kind: "series", writers: "nm0000002" });
  });

  it("counts at each threshold, for judging the default", async () => {
    const report = await importPool({ db, datasets: fixtures, minVotes: 1000 });
    expect(report.atThreshold).toEqual([
      { minVotes: 500, movies: 4, series: 2 },
      { minVotes: 1000, movies: 3, series: 2 },
      { minVotes: 2000, movies: 2, series: 2 },
      { minVotes: 5000, movies: 2, series: 2 },
    ]);
  });

  it("replaces the pool on a re-run and never touches the states", async () => {
    await importPool({ db, datasets: fixtures, minVotes: 1000 });
    const states = createStatesStore(db);
    states.set("user-1", "tt1375666", "amazing");
    states.set("user-1", "tt9999999", "good");
    await importPool({ db, datasets: fixtures, minVotes: 5000 });
    expect(createPool(db).info()).toMatchObject({ titles: 4, movies: 2, series: 2, minVotes: 5000 });
    expect(createPool(db).get("tt0000003")).toBeUndefined();
    expect(Object.fromEntries(states.allStated("user-1"))).toEqual({ tt1375666: "amazing", tt9999999: "good" });
  });

  it("leaves the old pool whole when a file is wrong", async () => {
    await importPool({ db, datasets: fixtures, minVotes: 1000 });
    const broken: DatasetSource = async (name: DatasetName) =>
      name === "title.crew"
        ? (async function* () {
            yield "tconst\tdirectors";
          })()
        : fixtures(name);
    await expect(importPool({ db, datasets: broken, minVotes: 1 })).rejects.toBeInstanceOf(DatasetFormatError);
    expect(createPool(db).info().titles).toBe(5);
  });

  it("streams gzipped files over HTTP", async () => {
    const fetch = fakeFetch((url) => {
      const name = url.pathname.slice(1).replace(/\.tsv\.gz$/, "");
      return new Response(gzipSync(readFileSync(new URL(`${name}.tsv`, FIXTURES))));
    });
    await importPool({ db, datasets: httpDatasets(fetch), minVotes: 1000 });
    expect(fetch.calls.map((call) => call.url.href)).toEqual([
      "https://datasets.imdbws.com/title.ratings.tsv.gz",
      "https://datasets.imdbws.com/title.basics.tsv.gz",
      "https://datasets.imdbws.com/title.crew.tsv.gz",
    ]);
    expect(createPool(db).info().titles).toBe(5);
  });
});

describe("normaliseTitle", () => {
  it("drops accents, case and punctuation", () => {
    expect(normaliseTitle('Amélie & "Friends", Part 2')).toBe("amelie and friends part 2");
    expect(normaliseTitle("Spider-Man: No Way Home")).toBe("spider man no way home");
    expect(normaliseTitle("  WALL·E ")).toBe("wall e");
  });
});
