---
paths:
  - "web/src/**"
---

# The page (`web/src`)

- Read the `base-ui` skill before you add or change a component. Base UI goes only through
  `web/src/components/ui/` wrappers, imported from subpaths.
- Dark mode follows the system (`prefers-color-scheme`) until the Light / Dark / System switch on
  `data-theme` replaces it.
- The swipe card owns pointer drags and the rating page owns the window's keys: a new control on
  `/rate` must not eat arrow keys
  ([decisions](../../corpus/wiki/decisions.md), "Swipes on the cards are for the titles not seen").
- UI copy uses the glossary's words ([glossary](../../corpus/wiki/glossary.md)).
- Tests render static markup (`renderToStaticMarkup`) and assert on roles and text, never on class
  names.
- `web/vendor/` is Ward's generated client. Never edit it.
- `npm run check:conventions` runs `check-base-ui` over this folder, `--warn-only` for now.
