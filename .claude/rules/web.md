---
paths:
  - "web/src/**"
---

# The page (`web/src`)

- Read the `base-ui` skill before you add or change a component. Base UI goes only through
  `web/src/components/ui/` wrappers (`RadioGroup`, `ToggleGroup`, `Tabs`, `Button`), imported from subpaths;
  what each widget is made of is in [web-app](../../corpus/wiki/web-app.md).
- A filter is a `RadioGroup` (arrows choose), a picker that saves is the guarded `ToggleGroup` (arrows
  move focus only), tabs are `Tabs`. The swipe card, the rating actions, the undo notice and text
  inputs stay hand-built or native.
- Styling is Tailwind 4 in `web/src/styles/index.css`, the one stylesheet. Colours, radii, shadows,
  z-indexes and type sizes come only from its `@theme` (no arbitrary colour, no `text-[13px]`); a new
  token's name also goes in `web/src/lib/cn.ts`'s lists. Type sizes are the named scale (`text-small`,
  `text-heading`); the 15 px lives on `body`, never `html`. The phone and wide layouts meet at the
  `wide:` variant (760px).
- Both themes change when a colour token changes: each is a `light-dark()` pair, `color-scheme` follows
  `data-theme` on `<html>`, and `web/src/theme.ts` (the Light / Dark / System switch) is the only place
  that sets it. No `dark:` in a class name, no `prefers-color-scheme` outside the System code and the
  boot script. A new page colour changes `THEME_COLOR`, the boot script and `--color-page` together.
- The only inline `style` is the swipe card's computed transform; state classes come from lookup
  tables of whole utility strings (Tailwind can't see a built-up name).
- The swipe card owns pointer drags and the rating page owns the window's keys: a new control on
  `/rate` that reads arrow keys itself must be listed in `web/src/keys.ts`
  ([decisions](../../corpus/wiki/decisions.md), "Swipes on the cards are for the titles not seen").
- UI copy uses the glossary's words ([glossary](../../corpus/wiki/glossary.md)).
- Tests render static markup (`renderToStaticMarkup`) and assert on roles and text, never on class
  names. A wrapper that holds logic (the guarded `ToggleGroup`) gets a jsdom test, set per file with a
  `// @vitest-environment jsdom` docblock; select by role and name.
- `web/vendor/` is Ward's generated client. Never edit it.
- `npm run check:conventions` runs `check-base-ui` over this folder, strict, and ESLint's `better-tailwindcss`
  rules (unknown and deprecated classes, class order) are errors.
