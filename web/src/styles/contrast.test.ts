import { describe, expect, it } from "vitest";
import css from "./index.css?inline";

/**
 * Contrast over the built tokens, both themes: every text and icon pair the screens draw (4.5:1) and every part of the
 * interface that must be seen on its own (3:1). The values are read from the stylesheet's `light-dark()` tokens, so a
 * change to a colour is measured here.
 */

type Theme = "light" | "dark";

/** `--color-name: light-dark(#aaa, #bbb)` for every colour token that gives two plain hex values. */
function tokens(): Record<string, Record<Theme, string>> {
  const found: Record<string, Record<Theme, string>> = {};
  for (const [, name, light, dark] of css.matchAll(
    /--color-([\w-]+):\s*light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)/gi,
  )) {
    if (name && light && dark) found[name] = { light, dark };
  }
  return found;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

const GROUNDS = ["page", "surface", "surface-sunk", "control", "control-hover", "control-raised"];
const RATINGS = ["awful", "meh", "good", "amazing"];

/** [foreground, background, minimum]. */
const PAIRS: [string, string, number][] = [
  ...GROUNDS.map((bg): [string, string, number] => ["ink", bg, 4.5]),
  ...GROUNDS.map((bg): [string, string, number] => ["ink-muted", bg, 4.5]),
  ...["page", "surface", "surface-sunk", "control"].map((bg): [string, string, number] => ["accent", bg, 4.5]),
  ...["page", "surface"].map((bg): [string, string, number] => ["accent-hover", bg, 4.5]),
  ["accent-text", "accent", 4.5],
  ["accent-text", "accent-hover", 4.5],
  ...RATINGS.map((r): [string, string, number] => [`on-${r}`, r, 4.5]),
  ...["page", "surface", "surface-sunk"].map((bg): [string, string, number] => ["danger", bg, 4.5]),
  ["ok", "surface", 4.5],
  ...[1, 2, 3, 4, 5, 6].map((n): [string, string, number] => [`poster-${n}-ink`, `poster-${n}-bg`, 4.5]),
  // Parts of the interface seen without text: edges, the focus ring, the rating fills, the meter's bars.
  ...["page", "surface", "surface-sunk"].map((bg): [string, string, number] => ["outline", bg, 3]),
  ["outline", "control", 3],
  ...GROUNDS.map((bg): [string, string, number] => ["focus", bg, 3]),
  ...RATINGS.flatMap((r): [string, string, number][] => [
    [r, "surface", 3],
    [r, "page", 3],
    [`on-${r}`, r, 3],
  ]),
  ["ink-muted", "control", 3],
  ["ink", "control", 3],
];

describe.each(["light", "dark"] as const)("contrast, %s", (theme) => {
  const colours = tokens();
  it.each(PAIRS)("%s on %s is at least %s:1", (fg, bg, need) => {
    const a = colours[fg]?.[theme];
    const b = colours[bg]?.[theme];
    expect(a, `--color-${fg}`).toBeDefined();
    expect(b, `--color-${bg}`).toBeDefined();
    expect(ratio(a ?? "#000000", b ?? "#ffffff")).toBeGreaterThanOrEqual(need);
  });
});
