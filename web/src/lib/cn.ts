import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge, told this app's @theme names (styles/index.css). Without the `text` list it reads `text-small` as a
 * colour, so `cn("text-small", "text-accent")` would drop one of the two. Keep the lists in step with @theme.
 *
 * A size carries its own line height in @theme (`--text-small--line-height`), so a size must not remove a `leading-*`,
 * which tailwind-merge does by default: `cn("leading-card", "text-small")` would lose the `leading-card`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "note",
        "small",
        "meta",
        "input",
        "body",
        "heading",
        "card-title",
        "score",
        "page-title",
        "display",
        "code",
      ],
      leading: ["heading", "card"],
      radius: ["card", "control", "pill", "xs"],
      shadow: ["card", "float", "poster"],
      font: ["sans", "display", "mono"],
      container: ["page", "narrow", "prose", "gate"],
      blur: ["bar"],
      ease: ["swipe"],
    },
    classGroups: {
      z: [{ z: ["bar", "notice"] }],
      "max-w": [{ "max-w": ["page", "narrow", "prose", "gate"] }],
      h: [{ h: ["top", "tab"] }],
    },
  },
  override: {
    conflictingClassGroups: { "font-size": [] },
  },
});

/** Joins class names, and lets a later class win over an earlier one it conflicts with. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
