---
summary: What the Lantern page is made of as of 2026-11-13 - the Base UI wrappers under web/src/components/ui/ (RadioGroup, ToggleGroup, Tabs, Button), which widget uses which, the rating page's key guard, where Base UI stops, and the look (the Lamplight redesign of 2026-11-13) - Tailwind 4 in one stylesheet, the family's token names with Lantern's values, the six-size type scale in two faces, light-dark() colour tokens and the Light / Dark / System switch on data-theme - and the Playwright and contrast checks.
updated: 2026-11-13
---

# The web app: controls and look

The page is React on Vite in `web/src`. Base UI 1.9.0 (`@base-ui/react`, pinned) is used only through
three wrappers in `web/src/components/ui/`, imported by subpath; the rest of the page never imports it.
The code wins where this page and it disagree. Why: [decisions.md](decisions.md), "Base UI for the
filter, the picker and the tabs, hand-built where it has no part".

## Which widget is made of what

| Widget | Where | Wrapper | Keys |
|---|---|---|---|
| Kind filter (All, Films, Series) | suggestions, search, watchlist and ratings lists, `/rate`, through `KindFilter.tsx` | `RadioGroup`, `look="segmented"` | one Tab stop; arrows move and choose |
| State picker (four ratings, want to watch, not interested) | title page, every list row (`compact`) | guarded `ToggleGroup` | one Tab stop; arrows move focus only; Space, Enter or a tap saves; tapping the pressed one clears |
| Ratings tabs (All, four ratings, not interested) | the ratings page | `Tabs`, with `activateOnFocus` | one Tab stop; arrows move and choose |
| Theme (Light, Dark, System) | the account page, through `ThemeSwitch.tsx` | `RadioGroup`, `look="list"` | one Tab stop; arrows move and choose; kept on the device, nothing goes to the server |

- **A filter chooses on arrows** because nothing is saved: trying each option is the point. **The picker
  does not**, because a choice is a write to the server, so an arrow press must not save.
- **The picker's two rows** (the four ratings, then want to watch and not interested) are plain wrappers inside the one group;
  Base UI registers items by context, so the group still has one Tab stop. A list of 50 rows has 50
  picker stops, not 300.
- **`ToggleGroup`** takes `value` as one string or null and tells `onValueChange` the new choice or
  null (cleared). The optimistic change and its rollback ("That didn't save") live in `StatePicker`.
- **`KindFilter`** holds the one list of kinds. It turns "no kind" into the value `all` and back.
- **Tabs have no panel.** The strip is passed into `TitleList` as its `tabs` prop and the list below it
  is the panel; a `Tabs.Panel` would need `TitleList` to take the strip and the content as children.
  `Tabs` wraps the whole `TitleList` instead.

## The rating page's keys

`/rate` listens on the window: `1`-`4` rate, arrows swipe, `Z` undoes. `web/src/keys.ts`
(`pageOwnsKey`) skips an event whose target is in a text field, a `tablist` or a `radiogroup`, so
arrowing through the kind filter chooses and never swipes. A plain `role=group` is deliberately not
skipped: the rating buttons sit in one, and arrows must keep swiping after one is tapped.

## Where Base UI stops

- `SwipeCard.tsx`: a pointer-drag card with no Base UI part.
- The rating actions on `/rate`: buttons that act, not toggles.
- The undo notice on the lists: a sticky `role=status` line that stays until the next change. A Base UI
  toast would time out.
- Text inputs (search, sign in): native.
- Buttons that only act are `Button`, a thin wrapper on Base UI's Button with a `default`, a `primary` and a `link` look.
- `Shell.tsx`'s section links: navigation with `aria-current`.
- There is no dialog, menu, popover, select or checkbox in the page.

## The look

One stylesheet, `web/src/styles/index.css`: `@import "tailwindcss"`, an `@theme` that clears Tailwind's own
colour, type, radius, shadow, container, breakpoint, blur and easing scales (so a stray `bg-red-500` or
`text-sm` produces nothing), and a small `@layer base`. The layer order is `theme, base, vendor,
components, utilities`; nothing third-party is imported.

- **Tokens.** The family's names (`page`, `surface`, `surface-sunk`, `ink`, `ink-muted`, `line`, `accent`,
  `danger`, `ok`, `shadow-card`, the radii `control`, `card` and `pill`) with Lantern's values, and
  Lantern's own: `accent-text` and `accent-hover`, `control`, `control-hover` and `control-raised` (a rating
  bar at rest, a quiet action, the chosen filter tile), `outline` (edges that must be seen), `focus`, the
  four steps `awful`, `meh`, `good` and `amazing` with `on-awful` to `on-amazing`, `poster-bg`,
  `poster-shadow`, `poster-1-bg` to `poster-6-ink` (the type-set poster tints), `shadow-float`,
  `shadow-poster`, `font-display`, `bar`, `height-top`, `height-tab`, `container-page`, `z-bar` and
  `z-notice`. A name says a role, never a value. The `bar` colour stays a `srgb` `color-mix`, because
  Tailwind's `/88` suffix compiles to `oklab` and shifts the colour. The tokens' names are repeated in
  `web/src/lib/cn.ts`, or tailwind-merge drops a class it reads as a clash. `web/src/styles/contrast.test.ts`
  measures the pairs in both themes.
- **Type scale.** Six sizes, 12, 14, 16, 20, 28 and 40 px, named `note`, `small` and `meta` (14), `body` and
  `input` (16), `heading` and `card-title` (20), `score` and `page-title` (28), `display` (40, a title
  page's name from 760 px) and `code`. Each carries its line height, and the weight and tracking where it has
  one (`--text-*--line-height`). Body is 16 on a 24 line, on `body`; `html` keeps the reader's size. Hanken
  Grotesk (`font-sans`) sets the text and Bricolage Grotesque (`font-display`, with its optical size axis)
  the titles and figures; both load from `@fontsource-variable` in `main.tsx`.
- **Themes.** Each colour token is `light-dark(light, dark)`. `color-scheme` on `<html>` picks one:
  `light` by default, `dark` for `data-theme="dark"`, `light dark` for `system`, which then follows the
  operating system with no script. Dark has no shadows: a card is a lighter surface with a `line` ring. The choice lives in `localStorage` (`theme`); `web/index.html`'s boot
  script sets the attribute and the one `theme-color` meta before the first paint, and `web/src/theme.ts`
  takes over (it also moves the meta when System follows a change). `dark:` is keyed off the same attribute
  but no class name uses it.
- **Preflight.** Tailwind's reset removed what the page leaned on: `@layer base` puts back a paragraph's 1em
  margin and a link's accent colour and underline. Every heading, list and definition list carries its own
  classes.
- **State from Base UI's attributes**, not from `aria-*` selectors: `data-checked` (segmented filter, radio
  dots), `data-pressed` (the picker's buttons, one fill and one text colour per rating), `data-active` (a tab).
- **Dynamic names are lookups.** The swipe card's labels, the picker's pressed colours and the card's
  dragging, leaving and reduced-motion looks are tables of whole utility strings; its transform is the one
  inline `style`, computed from the pointer.

## Tests

Browser specs (`web/e2e/`, Playwright 1.63.0, headless Chromium, `npx playwright test` from `web/` against a
running page with a seeded local account): a focus ring on every Tab stop of each screen, no running animation
or transition under reduced motion (the swipe card included: it leaves with no transition), no sideways scroll at 390 px, the theme switch,
and the swipe card, the number keys, the arrows and Z on `/rate`. They stub the data routes with stand-in titles,
so they need no title pool and make no outside call; `shots.spec.ts` writes screenshots when `SHOTS_DIR` is set.

jsdom (per file, `// @vitest-environment jsdom`) for the guarded wrapper, the picker and the key guard;
static markup for the kind filter's roles and `aria-checked`. Tabs and the radio group's keyboard
behaviour was checked in a browser run, not in a test. The stylesheet test (`web/src/styles/stylesheet.test.ts`)
imports `index.css?inline` through the Tailwind plugin in the root vitest config and checks that the
cleared scales emit nothing, the tokens do, `wide:` is 760px and the root has no font size; `cn.test.ts`
checks the merge lists; `theme.test.ts` and `ThemeSwitch.test.tsx` cover the switch and that the page
colour matches in the stylesheet, the boot script and the store.
