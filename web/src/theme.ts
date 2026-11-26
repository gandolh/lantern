import { useSyncExternalStore } from "react";

/** The theme the user picked. `system` follows the operating system, live, through CSS. */
export type Theme = "light" | "dark" | "system";

/** The app's own localStorage key, which index.html's boot script reads too. One origin serves every app, so the name carries the app's. */
const KEY = "lantern.theme";
/** The bare key older builds used: read once to carry the choice over, never written or deleted. */
const LEGACY_THEME_KEY = "theme";

/**
 * The page colour in each theme, for the browser's `<meta name="theme-color">`, which can't read the stylesheet.
 * They equal `--color-page` in styles/index.css and the boot script in index.html; theme.test.ts keeps the three
 * together.
 */
export const THEME_COLOR = { light: "#f6f2ec", dark: "#14110f" } as const;

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

/** The choice kept on this device; light on a first visit, or when storage can't be read. */
function saved(): Theme {
  try {
    const value = localStorage.getItem(KEY);
    if (isTheme(value)) return value;
    const legacy = localStorage.getItem(LEGACY_THEME_KEY);
    if (!isTheme(legacy)) return "light";
    localStorage.setItem(KEY, legacy);
    return legacy;
  } catch {
    return "light";
  }
}

const query = typeof window === "undefined" ? null : window.matchMedia("(prefers-color-scheme: dark)");
let current: Theme = typeof window === "undefined" ? "light" : saved();
const listeners = new Set<() => void>();

/** Puts the theme on <html>, where the stylesheet reads it, and the page colour on the browser's bar. */
function apply(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark" || (theme === "system" && query?.matches === true);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? THEME_COLOR.dark : THEME_COLOR.light);
}

if (typeof window !== "undefined") {
  apply(current);
  // System follows the operating system, so the bar's colour follows it too.
  query?.addEventListener("change", () => apply(current));
}

/** The theme in force. */
function getTheme(): Theme {
  return current;
}

/** Applies a theme to <html>, keeps it on this device, and tells every subscriber. */
export function setTheme(theme: Theme): void {
  current = theme;
  apply(theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Storage is blocked (a private window): the choice lasts until the tab closes.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The theme the user picked, re-rendering when it changes. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => "light");
}
