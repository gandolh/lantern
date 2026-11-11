import { describe, expect, it } from "vitest";
import { hrefOf, routeOf, type Route } from "./route";

const BASE = "/lantern/";

describe("routeOf", () => {
  it("reads every page", () => {
    expect(routeOf("/lantern/", "", BASE)).toEqual({ page: "suggestions" });
    expect(routeOf("/lantern", "", BASE)).toEqual({ page: "suggestions" });
    expect(routeOf("/lantern/rate", "", BASE)).toEqual({ page: "rate" });
    expect(routeOf("/lantern/watchlist/", "", BASE)).toEqual({ page: "watchlist" });
    expect(routeOf("/lantern/ratings", "", BASE)).toEqual({ page: "ratings" });
    expect(routeOf("/lantern/search", "?q=the%20thing", BASE)).toEqual({ page: "search", query: "the thing" });
    expect(routeOf("/lantern/search", "", BASE)).toEqual({ page: "search", query: "" });
    expect(routeOf("/lantern/title/tt1375666", "", BASE)).toEqual({ page: "title", id: "tt1375666" });
    expect(routeOf("/lantern/title/tt10872600/", "", BASE)).toEqual({ page: "title", id: "tt10872600" });
    expect(routeOf("/lantern/account", "", BASE)).toEqual({ page: "account" });
    expect(routeOf("/lantern/login", "", BASE)).toEqual({ page: "login" });
  });

  it("calls anything else not found", () => {
    for (const path of [
      "/lantern/nope",
      "/lantern/title/603",
      "/lantern/title/tt12",
      "/lantern/movie/603",
      "/lantern/title/tt1375666/x",
      "/elsewhere",
    ]) {
      expect(routeOf(path, "", BASE)).toEqual({ page: "not-found" });
    }
  });
});

describe("hrefOf", () => {
  it("round-trips every route", () => {
    const routes: Route[] = [
      { page: "suggestions" },
      { page: "rate" },
      { page: "watchlist" },
      { page: "ratings" },
      { page: "search", query: "" },
      { page: "search", query: "amélie & co" },
      { page: "title", id: "tt1375666" },
      { page: "account" },
      { page: "login" },
    ];
    for (const route of routes) {
      const url = new URL(hrefOf(route, BASE), "http://page.invalid");
      expect(routeOf(url.pathname, url.search, BASE)).toEqual(route);
    }
  });
});
