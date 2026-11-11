// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The store reads the saved choice when its module loads, so each test loads it fresh, as a page load would.
async function load() {
  vi.resetModules();
  return import("./ThemeSwitch");
}

const checked = (name: string) => screen.getByRole("radio", { name }).getAttribute("aria-checked") === "true";

describe("the theme switch", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: () => undefined }));
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("is a group named Theme with three choices, Light checked on a first visit", async () => {
    const { ThemeSwitch } = await load();
    render(<ThemeSwitch />);
    expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeDefined();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    for (const name of ["Light", "Dark", "System"]) expect(screen.getByRole("radio", { name })).toBeDefined();
    expect(checked("Light")).toBe(true);
  });

  it("choosing Dark sets the attribute on <html> and keeps the choice on the device", async () => {
    const { ThemeSwitch } = await load();
    render(<ThemeSwitch />);
    await userEvent.setup().click(screen.getByRole("radio", { name: "Dark" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(checked("Dark")).toBe(true);
  });

  it("choosing System puts system on the attribute, for the stylesheet to follow the operating system", async () => {
    const { ThemeSwitch } = await load();
    render(<ThemeSwitch />);
    await userEvent.setup().click(screen.getByRole("radio", { name: "System" }));
    expect(document.documentElement.dataset.theme).toBe("system");
  });

  it("shows a stored choice when the page loads", async () => {
    localStorage.setItem("theme", "dark");
    const { ThemeSwitch } = await load();
    render(<ThemeSwitch />);
    expect(checked("Dark")).toBe(true);
  });
});
