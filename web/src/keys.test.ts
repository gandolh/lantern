// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { pageOwnsKey } from "./keys";

function inside(markup: string, selector: string): Element {
  document.body.innerHTML = markup;
  const found = document.querySelector(selector);
  if (!found) throw new Error(`no ${selector}`);
  return found;
}

describe("pageOwnsKey", () => {
  it("is true for the page body, a plain button and a button in a plain group", () => {
    expect(pageOwnsKey(document.body)).toBe(true);
    expect(pageOwnsKey(inside("<main><button id=x>Undo</button></main>", "#x"))).toBe(true);
    expect(pageOwnsKey(inside('<div role="group"><button id=x>Good</button></div>', "#x"))).toBe(true);
  });

  it.each([
    { markup: '<div role="radiogroup"><span id=x role="radio">a</span></div>', name: "a radio group" },
    { markup: '<div role="tablist"><button id=x role="tab">a</button></div>', name: "a tab strip" },
    { markup: "<form><input id=x></form>", name: "an input" },
  ])("is false for a target inside $name", ({ markup }) => {
    expect(pageOwnsKey(inside(markup, "#x"))).toBe(false);
  });
});
