// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Listener = () => void;

/** A stand-in for the operating system's colour preference, which a test can flip. */
function systemPrefers(initial: "light" | "dark") {
  let dark = initial === "dark";
  const listeners = new Set<Listener>();
  vi.stubGlobal("matchMedia", (): Partial<MediaQueryList> => ({
    get matches() {
      return dark;
    },
    addEventListener: (_type: string, listener: unknown) => listeners.add(listener as Listener),
    removeEventListener: (_type: string, listener: unknown) => listeners.delete(listener as Listener),
  }));
  return {
    set(next: "light" | "dark") {
      dark = next === "dark";
      for (const listener of listeners) listener();
    },
  };
}

// The store reads the saved choice when its module loads, so each test loads it fresh, as a page load would.
async function load() {
  vi.resetModules();
  return import("./theme");
}

const html = document.documentElement;
const bar = () => document.querySelector('meta[name="theme-color"]')?.getAttribute("content");

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    delete html.dataset.theme;
    document.head.innerHTML = '<meta name="theme-color" content="">';
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(["light", "dark", "system"] as const)("puts a stored %s on <html> when the page loads", async (stored) => {
    systemPrefers("light");
    localStorage.setItem("theme", stored);
    await load();
    expect(html.dataset.theme).toBe(stored);
  });

  it("is light on a first visit even when the system is dark", async () => {
    systemPrefers("dark");
    const { THEME_COLOR } = await load();
    expect(html.dataset.theme).toBe("light");
    expect(bar()).toBe(THEME_COLOR.light);
  });

  it("is light when the stored value is not a theme, or storage throws", async () => {
    systemPrefers("dark");
    localStorage.setItem("theme", "sepia");
    await load();
    expect(html.dataset.theme).toBe("light");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    await load();
    expect(html.dataset.theme).toBe("light");
  });

  it("choosing a theme sets the attribute, the bar and the stored choice", async () => {
    systemPrefers("light");
    const { setTheme, THEME_COLOR } = await load();
    setTheme("dark");
    expect(html.dataset.theme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(bar()).toBe(THEME_COLOR.dark);
  });

  it("still switches when storage throws on a write", async () => {
    systemPrefers("light");
    const { setTheme } = await load();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    setTheme("dark");
    expect(html.dataset.theme).toBe("dark");
  });

  it("System follows a change of the operating system's preference, bar included", async () => {
    const system = systemPrefers("light");
    const { setTheme, THEME_COLOR } = await load();
    setTheme("system");
    expect(html.dataset.theme).toBe("system");
    expect(bar()).toBe(THEME_COLOR.light);
    system.set("dark");
    expect(bar()).toBe(THEME_COLOR.dark);
    system.set("light");
    expect(bar()).toBe(THEME_COLOR.light);
  });

  it("leaves the bar alone on Light and Dark when the system changes", async () => {
    const system = systemPrefers("light");
    const { setTheme, THEME_COLOR } = await load();
    setTheme("light");
    system.set("dark");
    expect(bar()).toBe(THEME_COLOR.light);
  });
});

describe("the page colour, written three times", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

  it("is the same in the stylesheet's --color-page, the boot script and THEME_COLOR", async () => {
    const css = /--color-page:\s*light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)/i.exec(
      read("./styles/index.css"),
    );
    const script = /colors\s*=\s*\{\s*light:\s*"(#[0-9a-f]{6})",\s*dark:\s*"(#[0-9a-f]{6})"\s*\}/i.exec(
      read("../index.html"),
    );
    const meta = /<meta name="theme-color" content="(#[0-9a-f]{6})"/i.exec(read("../index.html"));
    expect(css).not.toBeNull();
    expect(script).not.toBeNull();
    const { THEME_COLOR } = await import("./theme");
    expect([css?.[1], css?.[2]]).toEqual([THEME_COLOR.light, THEME_COLOR.dark]);
    expect([script?.[1], script?.[2]]).toEqual([THEME_COLOR.light, THEME_COLOR.dark]);
    expect(meta?.[1]).toBe(THEME_COLOR.light);
  });
});
