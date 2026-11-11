import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { KindFilter } from "../../KindFilter";

/** The roles and states the wrappers render; their keyboard behaviour is checked in a browser. */
describe("KindFilter", () => {
  it.each([undefined, "movie", "series"] as const)("has exactly one option checked for %s", (kind) => {
    const html = renderToStaticMarkup(<KindFilter kind={kind} onChange={() => undefined} />);
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Kind"');
    expect(html.match(/role="radio"/g)).toHaveLength(3);
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(html.match(/data-checked=""/g)).toHaveLength(1);
  });

  it("checks the option that matches the kind", () => {
    const html = renderToStaticMarkup(<KindFilter kind="series" onChange={() => undefined} />);
    expect(html).toMatch(/aria-checked="true"[^>]*>Series</);
  });
});
