---
paths:
  - "web/src/**"
---

# The page (`web/src`)

- Read the `base-ui` skill before you add or change a component. Base UI goes only through
  `web/src/components/ui/` wrappers (`RadioGroup`, `ToggleGroup`, `Tabs`), imported from subpaths;
  what each widget is made of is in [web-app](../../corpus/wiki/web-app.md).
- A filter is a `RadioGroup` (arrows choose), a picker that saves is the guarded `ToggleGroup` (arrows
  move focus only), tabs are `Tabs`. The swipe card, the rating actions, the undo notice and text
  inputs stay hand-built or native.
- Dark mode follows the system (`prefers-color-scheme`) until the Light / Dark / System switch on
  `data-theme` replaces it.
- The swipe card owns pointer drags and the rating page owns the window's keys: a new control on
  `/rate` that reads arrow keys itself must be listed in `web/src/keys.ts`
  ([decisions](../../corpus/wiki/decisions.md), "Swipes on the cards are for the titles not seen").
- UI copy uses the glossary's words ([glossary](../../corpus/wiki/glossary.md)).
- Tests render static markup (`renderToStaticMarkup`) and assert on roles and text, never on class
  names. A wrapper that holds logic (the guarded `ToggleGroup`) gets a jsdom test, set per file with a
  `// @vitest-environment jsdom` docblock; select by role and name.
- `web/vendor/` is Ward's generated client. Never edit it.
- `npm run check:conventions` runs `check-base-ui` over this folder, `--warn-only` for now.
