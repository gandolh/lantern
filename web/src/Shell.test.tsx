import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Shell } from "./Shell";

describe("the shell", () => {
  it("offers the five sections twice (top bar and tab bar) and marks the current one", () => {
    const html = renderToStaticMarkup(
      <Shell current="watchlist">
        <p>the page</p>
      </Shell>,
    );
    for (const label of ["Suggestions", "Rate", "Watchlist", "Ratings", "Search"]) {
      expect(html.split(`>${label}<`).length - 1).toBe(2);
    }
    expect(html.match(/aria-current="page"/g)).toHaveLength(2);
    expect(html).toMatch(/<a [^>]*aria-current="page"[^>]*href="\/watchlist"/);
    expect(html).toContain("<p>the page</p>");
  });

  it("marks no section on a title page", () => {
    const html = renderToStaticMarkup(<Shell current="title">x</Shell>);
    expect(html).not.toContain('aria-current="page"');
  });
});
