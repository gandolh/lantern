import { describe, expect, it } from "vitest";
import { kindLabel, runtime, votes, years } from "./format";

describe("the formatters", () => {
  it("shorten votes and runtimes", () => {
    expect(votes(2_600_000)).toBe("2.6M");
    expect(votes(1_500)).toBe("1.5K");
    expect(runtime(148)).toBe("2h 28m");
    expect(runtime(57)).toBe("57m");
    expect(runtime(null)).toBeNull();
  });

  it("write a film's year and a series' run", () => {
    expect(years({ kind: "movie", year: 2010, endYear: null })).toBe("2010");
    expect(years({ kind: "series", year: 2011, endYear: 2019 })).toBe("2011–2019");
    expect(years({ kind: "series", year: 2019, endYear: null })).toBe("2019–");
    expect(years({ kind: "series", year: 2020, endYear: 2020 })).toBe("2020");
    expect(kindLabel("series")).toBe("Series");
  });
});
