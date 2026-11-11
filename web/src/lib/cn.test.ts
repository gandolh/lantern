import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("lets a later type size win over an earlier one", () => {
    expect(cn("text-small", "text-heading")).toBe("text-heading");
  });

  it("keeps a size and a colour, which are different groups", () => {
    expect(cn("text-small", "text-accent")).toBe("text-small text-accent");
  });

  it("keeps a line height beside a later size", () => {
    expect(cn("leading-card", "text-small")).toBe("leading-card text-small");
  });

  it("lets a later radius, z value or width win", () => {
    expect(cn("rounded-card", "rounded-pill")).toBe("rounded-pill");
    expect(cn("z-bar", "z-notice")).toBe("z-notice");
    expect(cn("max-w-page", "max-w-narrow")).toBe("max-w-narrow");
  });
});
