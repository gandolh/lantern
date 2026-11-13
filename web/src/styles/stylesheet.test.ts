import { describe, expect, it } from "vitest";
import css from "./index.css?inline";

// The page's one stylesheet as the Vite plugin builds it (vitest runs the same plugin). Tailwind scans the sources
// for class names, this file included, so these names are in its input: what is absent below is absent because the
// theme has no such name, not because nothing asked for it.
const FIXTURE = {
  cleared: ["bg-red-500", "text-sm", "rounded-lg", "shadow-md", "max-w-lg", "md:flex"],
  tokens: [
    "bg-surface",
    "text-ink-muted",
    "text-small",
    "text-heading",
    "z-bar",
    "rounded-card",
    "max-w-page",
    "shadow-card",
  ],
};

/** A class selector for a utility, so `text-sm` is not found inside `text-small`. */
function selector(name: string): RegExp {
  return new RegExp(`\\.${name.replace(":", "\\\\:")}(?![\\w-])`);
}

/** Every rule whose selector list names `html` or `:root`, with its declarations. */
function rootRules(): string[] {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selectors]) => (selectors ?? "").split(",").some((s) => ["html", ":root"].includes(s.trim())))
    .map(([, , body]) => body ?? "");
}

describe("styles/index.css", () => {
  it("generates nothing for Tailwind's cleared default scales", () => {
    for (const name of FIXTURE.cleared) expect(css, name).not.toMatch(selector(name));
  });

  it("generates the app's colour, type, radius, shadow and z tokens", () => {
    for (const name of FIXTURE.tokens) expect(css, name).toMatch(selector(name));
  });

  it("makes wide: a min-width of exactly 760px", () => {
    expect(css).toMatch(/--breakpoint-wide: 760px/);
    expect(css).toMatch(/@media \(width >= 760px\)|@media \(min-width: 760px\)|@media \(min-width:760px\)/);
  });

  it("keeps the 16px on body and leaves the root at the browser's size", () => {
    expect(css).toMatch(/--text-body: 1rem/);
    expect(css).toMatch(/body \{[^}]*font-size: var\(--text-body\)/);
    for (const body of rootRules()) expect(body).not.toMatch(/(^|;|\s)font-size:/);
  });

  it("names both themes once, in each colour token, and picks one from data-theme", () => {
    expect(css).toMatch(/--color-page: light-dark\(#f6f2ec, #14110f\)/);
    expect(css).toMatch(/:root\[data-theme="dark"\]\s*\{\s*color-scheme: dark/);
    expect(css).toMatch(/:root\[data-theme="system"\]\s*\{\s*color-scheme: light dark/);
  });
});
