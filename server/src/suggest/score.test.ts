import { describe, expect, it } from "vitest";
import { buildProfile, featuresOf, rank, share, type Candidate, type RatedTitle } from "./score.js";

const rated = (imdbId: string, rating: RatedTitle["rating"], features: string[]): RatedTitle => ({
  imdbId,
  title: `Title ${imdbId}`,
  rating,
  features,
});
const candidate = (imdbId: string, features: string[], rating = 7, votes = 10_000): Candidate => ({
  imdbId,
  features,
  rating,
  votes,
});
const order = (ranked: { imdbId: string }[]) => ranked.map((item) => item.imdbId);

describe("featuresOf", () => {
  it("prefixes genres, directors and writers, once each", () => {
    expect(featuresOf({ genres: "Drama,Crime", directors: "nm1", writers: "nm1,nm2" })).toEqual([
      "g:Drama",
      "g:Crime",
      "d:nm1",
      "w:nm1",
      "w:nm2",
    ]);
    expect(featuresOf({ genres: "", directors: "", writers: "" })).toEqual([]);
  });
});

describe("the profile", () => {
  it("sums the ratings per feature, damped by the square root of how often it appears", () => {
    const profile = buildProfile([
      rated("a", "good", ["g:Drama"]),
      rated("b", "good", ["g:Drama"]),
      rated("c", "amazing", ["g:Drama", "d:nm1"]),
      rated("d", "awful", ["g:Drama"]),
    ]);
    // Drama: 1 + 1 + 2 - 2 = 2, over √4.
    expect(profile.weights.get("g:Drama")).toBeCloseTo(1);
    expect(profile.weights.get("d:nm1")).toBeCloseTo(2);
  });

  it("spreads a title's weight over its features of one kind", () => {
    const profile = buildProfile([rated("a", "good", ["g:Drama", "g:War", "d:x"])]);
    expect(profile.weights.get("g:Drama")).toBeCloseTo(1 / Math.SQRT2);
    expect(profile.weights.get("d:x")).toBeCloseTo(1);
  });
});

describe("rank", () => {
  it("puts a liked director's other film above a film that only shares genres", () => {
    const ratings = [rated("liked", "amazing", ["g:Sci-Fi", "g:Thriller", "d:nolan", "w:nolan"])];
    const ranked = rank(
      [candidate("genres-only", ["g:Sci-Fi", "g:Thriller"], 8), candidate("same-director", ["g:Drama", "d:nolan"], 7)],
      ratings,
      10,
    );
    expect(order(ranked)).toEqual(["same-director", "genres-only"]);
  });

  it("pushes down what was disliked", () => {
    const ratings = [
      rated("liked", "good", ["g:Comedy", "g:Horror"]),
      rated("hated", "awful", ["g:Horror", "d:x"]),
      rated("hated2", "awful", ["g:Horror"]),
    ];
    const ranked = rank(
      [
        candidate("horror-comedy", ["g:Comedy", "g:Horror"]),
        candidate("comedy-romance", ["g:Comedy", "g:Romance", "d:y", "w:liked-writer"]),
      ],
      [...ratings, rated("liked2", "good", ["g:Comedy", "w:liked-writer"])],
      10,
    );
    expect(order(ranked)[0]).toBe("comedy-romance");
  });

  it("damping keeps one common genre from deciding", () => {
    const dramas = Array.from({ length: 9 }, (_, i) => rated(`drama${i}`, "good", ["g:Drama"]));
    const ratings = [...dramas, rated("auteur", "amazing", ["g:Comedy", "d:x"])];
    const ranked = rank(
      [candidate("another-drama", ["g:Drama", "g:Crime"]), candidate("by-x", ["g:Comedy", "d:x"])],
      ratings,
      10,
    );
    expect(order(ranked)[0]).toBe("by-x");
  });

  it("doesn't let a series' crowd of episode directors outweigh one shared director", () => {
    const crowd = Array.from({ length: 20 }, (_, i) => `d:ep${i}`);
    // Both rated amazing: the series shares six of its twenty episode directors and a genre, the film its one director.
    const ratings = [
      rated("big-series", "amazing", ["g:Drama", ...crowd]),
      rated("film", "amazing", ["g:Action", "d:auteur"]),
    ];
    const ranked = rank(
      [
        candidate("other-series", ["g:Drama", ...crowd.slice(0, 6), "d:other1", "d:other2"]),
        candidate("auteur-film", ["g:Crime", "d:auteur"]),
      ],
      ratings,
      10,
    );
    expect(order(ranked)[0]).toBe("auteur-film");
  });

  it("names the liked title that adds the most as the reason", () => {
    const ratings = [rated("a", "good", ["g:Drama", "g:War"]), rated("b", "amazing", ["g:Drama", "d:z"])];
    const [top] = rank([candidate("c", ["g:Drama", "g:War", "d:z"])], ratings, 10);
    expect(top!.reason).toEqual({ imdbId: "b", title: "Title b" });
    const profile = buildProfile(ratings);
    expect(share(ratings[1]!, { features: ["g:Drama", "g:War", "d:z"] }, profile)).toBeGreaterThan(
      share(ratings[0]!, { features: ["g:Drama", "g:War", "d:z"] }, profile),
    );
  });

  it("needs a liked title behind a suggestion, and more than one shared genre", () => {
    expect(rank([candidate("c", ["g:Drama", "d:z"])], [rated("a", "awful", ["g:Drama", "d:z"])], 10)).toEqual([]);
    expect(rank([candidate("c", ["g:Drama", "g:Crime"])], [rated("a", "good", ["g:Drama", "g:War"])], 10)).toEqual([]);
    expect(order(rank([candidate("c", ["g:Drama", "g:War"])], [rated("a", "good", ["g:Drama", "g:War"])], 10))).toEqual(
      ["c"],
    );
  });

  it("nudges by IMDb's rating, and breaks ties by votes", () => {
    const ratings = [rated("a", "good", ["d:z"])];
    expect(order(rank([candidate("low", ["d:z"], 6), candidate("high", ["d:z"], 8.5)], ratings, 10))).toEqual([
      "high",
      "low",
    ]);
    expect(
      order(
        rank(
          [candidate("few", ["d:z"], 7, 5000), candidate("many", ["d:z"], 7, 5000)].map((c, i) => ({
            ...c,
            votes: c.votes + i,
          })),
          ratings,
          10,
        ),
      ),
    ).toEqual(["many", "few"]);
  });

  it("stops at the limit", () => {
    const ratings = [rated("a", "good", ["d:z"])];
    expect(
      rank(
        Array.from({ length: 5 }, (_, i) => candidate(`c${i}`, ["d:z"])),
        ratings,
        2,
      ),
    ).toHaveLength(2);
  });
});
