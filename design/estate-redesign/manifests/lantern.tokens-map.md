# Lantern tokens: board role to app token

Mechanism: the app's own, kept. Every colour is `light-dark()` inside `@theme`, picked by `color-scheme` on `:root`; shadows use `light-dark()` too (the dark hairline ring is transparent in light), so there is no `[data-theme="dark"]` block. `lantern.tokens.css` replaces the colour, shadow, type and radius groups of `web/src/styles/index.css`; the layout, container, breakpoint, blur, ease and z-index groups and the `@layer base` block stay.

## Renamed or remapped (board role to app token)
- page, surface, surface-sunk, ink, ink-muted, line, accent, danger, ok, awful, meh, good, amazing: same names, new values (page #f7f4ef to #f6f2ec; accent #b45309 to #9c5300 and #f59e0b to #fbc044; meh moves from ochre #8a6a3a to stone blue-grey #50667c; good and ok #2f7d4f to #0b703f)
- on-accent -> `accent-text`; accent-hover -> `accent-hover` (a `color-mix` today, both values given now)
- poster's ground -> `poster-bg` (value now equals surface-sunk, #efeae2 / #0f0d0b)
- full -> `radius-pill`; poster radius 6 -> `radius-xs`; card 12 to 16 (`radius-card`, and `radius-hero` now equals it); control 10 unchanged
- shadows: card -> `shadow-card` (new values, dark is a 1px line ring); float -> new `shadow-float`; poster -> new `shadow-poster`
- type: Hanken Grotesk -> `font-sans`; Bricolage Grotesque -> new `font-display`. Sizes: 12/16 `text-note`; 14/20 `text-small` and `text-meta`; 16/24 `text-body` (was 15) and `text-input`; 20/26 `text-heading` and `text-card-title`; 28/34 `text-page-title` (was 24) and `text-score` (was 18.75); 40/44 new `text-display`. Line height, weight and tracking ride on each size as `--text-*--line-height|font-weight|letter-spacing`, so `leading-heading` and `leading-card` are only needed where a component overrides
- spacing: the board's 4 8 12 16 20 24 32 40 48 64 are Tailwind's default 4 px scale (1 to 16); no tokens
- focus ring: the base layer's `:focus-visible` outline moves from `accent` to the new `focus`

## New tokens (component that needs them)
- `control`, `control-hover`, `control-raised`: the rating buttons at rest, hover and pressed, the segmented kind filter and its current tile, quiet actions
- `outline`: the sign-in field edge, the dashed empty box, keycaps (3.46:1 and up)
- `focus`: every focus ring (the chosen rating step takes its own on-colour instead)
- `on-awful`, `on-meh`, `on-good`, `on-amazing`: text and icons on a chosen rating step (replace the single white `on-rating`)
- `poster-1-bg|ink` to `poster-6-bg|ink`: the type-set poster placeholders until OMDb posters arrive
- `poster-shadow`: the poster's dark-theme edge
- `shadow-float`: the undo notice; `shadow-poster`: the poster
- `font-display`: page titles, card names, score figures; `text-display`: a title page's name from 760 px up

## App tokens the design no longer uses (keep or drop is the code brief's call)
- `on-rating` (white on every rating): replaced by the four on-colours
- `accent-soft`, `brand-glow`, `shadow-brand-mark`: the board draws no glowing brand mark
- `text-micro` (10.8 px), `text-brand`: no step of that size on the board (six sizes only); `text-brand` could take 20
- `radius-sm` (8): no board element at 8; `radius-hero` now duplicates `radius-card`
- unchanged and not drawn on the board: `height-top`, `height-tab`, `container-*`, `blur-bar`, `bar`, `ease-swipe`, `z-index-*`, `breakpoint-wide`, `font-mono`

## Not mapped
- board-only `callout` (#c83122 / #f28058): a specimen annotation colour on the direction sheet, not an app role
- the board draws the swipe stamps in `good` (right), `awful` (left) and `ink-muted` (up): existing tokens
