# Task 17: The web app to Tailwind, and a theme switch

**Depends on:**

- In Lantern: brief 16, for `web/src/components/ui/`, `KindFilter.tsx` and the markup the new parts carry; brief 15, for the gate.
- In the owner's skills library:
  - brief 02, *A base-ui skill, styled with Tailwind*: rules 4-7, `migrating-from-plain-css.md` (the method), `check-base-ui.mjs`;
  - brief 15, *Enforce the base-ui and code-structure skills in every repo*: `check-base-ui` stops running `--warn-only` here.
- **In Wicket: its brief 12, *The web app to Tailwind, and the small tools' shared tokens*.** It sets the family's token names first (Q17 and Q61: Wicket, then the-board, then Lantern, per Q20). This brief copies those names and puts only Lantern's values and Lantern-only tokens behind them; where this brief and Wicket's differ, Wicket's list wins. If Wicket's brief hasn't landed, build from the names in the table below, which are read from it, and check them against its `@theme` block before step 2.
- The owner's grilling of 2026-11-10: Q17 and Q61 (token names), Q18 (the theme switch), Q19 (visual parity), Q20 (order), Q44 (root font size), Q60 and Q62 (tests, type scale). All decided; see Owner decisions.

**Runs after:** 16. Brief 16 changes structure and behaviour; this brief changes only the styling, so the before and after screenshots compare like with like.

**Before you start:** run `brief-board guide` ([corpus/CLAUDE.md](../../CLAUDE.md)).

## Context

The owner's call of 2026-11-09: Base UI is styled with Tailwind v4, and whole apps move to Tailwind. Lantern's page is one plain stylesheet with a dark mode and no CSS dependency. This brief moves it to Tailwind 4.3.5 (Wicket's version, on the same Vite 8.3.5) with the looks unchanged, gives Lantern's values the family's token names, and adds the Light / Dark / System switch.

### Corrections to the estate draft

- **38 custom properties is 38 definitions, not names.** There are **21 names** on `:root` (`web/src/styles.css:9-29`) and 17 of them redefined under `prefers-color-scheme: dark` (`styles.css:38-60`). The four never redefined: `--radius`, `--top-h`, `--tab-h`, `--page-w`. All 21 are read: 100 `var()` uses.
- **No third-party CSS.** Base UI ships none and `main.tsx` imports only `./styles.css` (line 6). The unlayered-vendor-CSS trap doesn't apply.
- **The root font size is 15 px** (`styles.css:31`), and **21 rules size type in `rem`** against it, while spacing is in `px`. By Q44 the 15 px moves onto `body`, so those `rem` sizes become px tokens that keep today's pixels (decision 3).
- **The first-version breakpoint is `min-width: 760px`**, twice (`styles.css:223, 658`): phone first, the tab bar below it and the top bar above. There is no `max-width` query.

### The stylesheet today (measured 2026-11-10)

`web/src/styles.css`: **933 lines**, imported once (`web/src/main.tsx:6`), and:

- **92 distinct class names** open a selector (`grep -oE '^\.[a-zA-Z][a-zA-Z0-9_-]*' web/src/styles.css | sort -u | wc -l`), in 125 rules that start with a class; they are used by **167 lines of `className`** in 16 files: `TitlePage.tsx` 32, `RatePage.tsx` 28, `LoginPage.tsx` 18, `AccountPage.tsx` 12, `Shell.tsx` 12, `ListPage.tsx` 11, `SearchPage.tsx` 10, `SuggestionsPage.tsx` 10, `TitleRow.tsx` 8, `AuthGate.tsx` 6, `ListPages.tsx` 6, `StatePicker.tsx` 5, `Placeholder.tsx` 3, `Poster.tsx` 3, `SwipeCard.tsx` 2, `Credits.tsx` 1.
- **4** `@media` blocks: dark (line 38), `min-width: 760px` (223, 658), `prefers-reduced-motion: reduce` (882).
- **0** `@keyframes`, **1** `transition` (`.swipe-card`, line 749, overridden at 753 and 884), **0** `!important`, **0** `@container`.
- **1 inline `style`**: `web/src/SwipeCard.tsx:67`, `style={{ transform }}`, computed from the pointer. That is computed geometry, which rule 5 allows. No other `style=` exists.
- **6 `z-index` literals**: 10 on `.topbar` (101) and `.tabbar` (197); 5 on `.undo-notice` (931); 0, 1 and 2 inside the swipe card (764, 739, 773).
- **Colours:** every colour is a token, except `#fff` at line 578 (the text on a pressed rating button, white in both themes), the `rgb(…)` inside the two `--shadow` values (lines 20, 51), and **3 `color-mix(in srgb, …)`** (lines 107, 128, 282).
- **9 lines of `scrollbar`, `-webkit-` or `touch-action`**, all kept as they are: `touch-action: none` on the swipe card matters for the drag.
- **No class is read by code or tests.** The three web tests (`Shell.test.tsx`, `format.test.ts`, `route.test.ts`) assert on text and `aria-current`, so **0 class-name assertions to rewrite**.
- **7 class names built from a template literal**, which Tailwind can't see whole: `Poster.tsx:19, 26`, `RatePage.tsx:221` (`state-${rating}`), `StatePicker.tsx:57` (`state-${choice}`), `66` (`state-picker-compact`), `SwipeCard.tsx:66` (`is-dragging`, `is-leaving`), `77` (`swipe-label-${showing}`). Each becomes a lookup table of complete utility strings.

What each part of the file styles: the page and frame (`.app`, `.topbar`, `.tabbar`, `.page`), the brand, the controls and fields, the kind filter and tabs (brief 16's parts), the title list, rows and posters, the state picker, the title page, the rating cards and swipe labels, the sign-in gate, the account page.

### The family's tokens: what Lantern shares

Read from Wicket's brief 12 and Lantern's `:root` on 2026-11-10:

| Family name (Wicket's `@theme`) | Lantern today | Lantern's value (light, dark) |
|---|---|---|
| `--color-page`, `--color-surface`, `--color-surface-sunk`, `--color-ink`, `--color-ink-muted`, `--color-line`, `--color-accent` | `--bg`, `--surface`, `--surface-sunk`, `--text`, `--text-muted`, `--line`, `--accent` | Lantern's warm palette (`styles.css:9-15`, dark 40-46) |
| `--color-danger`, `--color-ok` | `--danger`, `--ok` | `styles.css:18-19`, dark 49-50 |
| `--shadow-card` | `--shadow` | `styles.css:20`, dark 51 |
| `--height-top` | `--top-h` (56 px) | |
| `--font-sans` | the stack at line 30 | |
| `--font-mono` (Lantern-only) | the monospace stack at line 423 | |
| `--color-banner-bg`, `--color-banner-text` | none | Lantern has no banner: not added |

**Lantern-only tokens**, named in the same namespaces:

| Today | In `@theme` | Utility |
|---|---|---|
| `--accent-text`, `--accent-soft` | `--color-accent-text`, `--color-accent-soft` | `text-accent-text`, `bg-accent-soft` |
| `--awful`, `--meh`, `--good`, `--amazing` | `--color-awful`, `--color-meh`, `--color-good`, `--color-amazing` | `bg-awful` |
| `--poster-bg` | `--color-poster-bg` | `bg-poster-bg` |
| `#fff` (line 578) | `--color-on-rating` | `text-on-rating` |
| the three `color-mix` colours | `--color-bar`, `--color-brand-glow`, `--color-accent-hover` (each the same `color-mix(in srgb, …)` over the tokens) | `bg-bar` |
| `--tab-h` (60 px) | `--height-tab` | `h-tab` |
| `--page-w` (1080 px) | `--container-page` | `max-w-page` |
| `--radius` (12 px) | `--radius-card` | `rounded-card` |
| the 440 px (lines 733, 843) and `70ch` (674) widths | `--container-narrow`, `--container-prose` | `max-w-narrow` |
| z-indexes 10, 5, and the card's 0-2 | `--z-index-bar`, `--z-index-notice`; the card's 0-2 are plain `z-0`, `z-1`, `z-2` | `z-bar` |
| `760px` | `--breakpoint-wide` | `wide:` |

**The `color-mix` colours stay `srgb`.** Tailwind's opacity suffix (`/88`) compiles to `oklab`, which gives a slightly different colour. Naming each `color-mix(in srgb, …)` as a token keeps the pixels.

**Sizes, radii and weights**, with values unchanged apart from the type sizes' unit and the merges decision 4 allows:

- **12 distinct font sizes** (`grep -oE "font-size: [^;]+" web/src/styles.css | sort | uniq -c`): `0.85rem` ×5, `0.88rem` ×4, `0.8rem` ×3, `16px` ×2, `1.6rem` ×2, `1.1rem` ×2, `0.72rem`, `0.82rem`, `1.15rem`, `1.2rem`, `1.25rem` and `0.9em`, plus the root's `15px`. Each gets a `--text-*` token named by its use (decision 4), in px at today's computed size (decision 3), so nothing moves when the 15 px goes onto `body`.
- **7 radii:** `10px` ×7, `999px` ×6, `var(--radius)` ×3 (12 px) and a literal `12px`, `8px`, `6px`, `16px`, `50%`. The family has three names (`--radius-control`, `--radius-card`, `--radius-pill`) with Wicket's values (4, 8 and 10 px); Lantern's values differ. Decision 5.
- **5 weights:** 400, 500, 600, 700, 800: all of Tailwind's own `font-normal` to `font-extrabold`, so the default weight scale stays.

Spacing: Tailwind's default `--spacing` (0.25rem, 4 px on the browser's 16 px root, decision 3), with the default colour, text, radius, shadow and container scales cleared (`--color-*: initial` and so on), so only Lantern's tokens exist. Spacing is in `px` throughout; the odd values (for example the `3px` padding and `34px` height of `.segmented`, lines 447-458) are arbitrary values, listed in step 3's commit message.

Dark mode: the 17 dark values are written once, as a redefinition of the `--color-*` and `--shadow-card` names under `[data-theme="dark"]` in `@layer base`, with `@custom-variant dark` keyed off the same attribute, and **no `dark:` variant appears in a class name** (decision 2).

### What the browser does today that Tailwind's preflight stops

Preflight resets heading size and weight, zeroes `p`, `dl`, `dd` and `ul` margins and padding, and sets `img`/`svg` to blocks. Today the page relies on the defaults here, so the screenshots must show each:

- **18 headings** (`grep -n "<h[1-6]" web/src/*.tsx`): 12 `h1` take `.page-title` (size, margin) or `.gate-brand`; the 6 `h2` (`AccountPage.tsx:86`, `RatePage.tsx:267`, `TitlePage.tsx:110, 156, 162, 199`) are unclassed or `.card-title`, and get their size from descendant rules (`.account-section h2` line 413, `.title-section h2` line 653) and the browser's bold.
- **61 `<p>`**: most keep the browser's 1em margin; descendant rules adjust some.
- **5 `<ul>`** (`.title-list` ×3, `ListPage.tsx:136`, `SearchPage.tsx:83`, `SuggestionsPage.tsx:73`; `.chips`, `TitlePage.tsx:90`; `.scores`, `TitlePage.tsx:200`) reset list style and padding themselves; **2 `<dl>`** (`.facts`, `AccountPage.tsx:33`, and `.facts.title-details`, `TitlePage.tsx:163`) set `dt`/`dd` in descendant rules (lines 398, 402, 714).
- **Descendant element selectors:** `.account-section h2`, `.credit a`, `.chips li`, `.scores li`, `.card-title a`, `.facts dt/dd`, `.title-details dd`, `.title-section h2`, and brief 16's `.segmented button` and `.tabs button`. Content passed as children can't take a class from its wrapper: put the utility on the element at the call site.
- `button, input, select { font: inherit; color: inherit }` (lines 70-75), `* { box-sizing: border-box }` and `body { margin: 0 }` are preflight's.

The fallback, if native controls shift: import Tailwind's `theme.css` and `utilities.css` without preflight, and keep the page's own resets in `@layer base`.

**Not measured here** (no Tailwind in the repo): whether `max-w-narrow`-style custom container names compile as expected with the default scale cleared, and whether `@custom-variant`/`--breakpoint-wide` produce `min-width: 760px` exactly. Step 2 checks both against Wicket's measured behaviour (Tailwind's built-in max variants differ from a hand-written query by one pixel at the boundary, which Wicket accepts under Q62; here a named `--breakpoint-wide` is exact, so it is checked once at 759, 760 and 761 px).

## Owner decisions

Decided on 2026-11-10 unless marked as a default.

1. **Token names for the small tools family** (Q17 and Q61, decided 2026-11-10, technical call). A name names a role, never a value. The family (wicket, the-board, lantern) converges on `surface`, `ink`, `accent`, `line` and `danger`, used as `bg-surface` and `text-ink`, with no `bg-bg`. Wicket's brief 12 sets the list and wins where this brief differs: `page` for the page background, `ink-muted` for the muted text. Lantern gives them its own values.
2. **Dark mode: a Light / Dark / System switch, light by default** (Q18, decided 2026-11-10, owner). A first visit shows the light theme, not the system's. `dark:` keys off a `data-theme` attribute through `@custom-variant dark`, not `prefers-color-scheme`. The 17 dark values stay one block in `@layer base`, now under `[data-theme="dark"]`, redefining the `--color-*` and `--shadow-card` names, so every utility follows. The choice is kept on the device in `localStorage` (Lantern keeps no other settings). The control lives on the account page, on brief 16's `RadioGroup` wrapper, and writes nothing to the API. Step 6 builds it.
3. **The 15 px root** (Q44, decided 2026-11-10, technical call). The root font size goes back to the browser's default and the app's 15 px moves onto `body`; a pixel size on `html` overrides the reader's own font setting and skews every `rem` utility. Tailwind's default spacing stays (4 px at a 16 px root). The 21 `rem` type sizes against the old 15 px root become px tokens holding today's computed pixels (`0.85rem` is 12.75 px, `1.6rem` 24 px, and so on), so nothing moves.
4. **The type scale** (Q62 and Q19, decided 2026-11-10, technical calls). The font sizes become a named scale in `@theme` (`--text-*`), named by what each sizes, and the default scale is cleared. There are 12 distinct values; sizes within about half a pixel of each other (`0.8rem`, `0.82rem`, `0.85rem` and `0.88rem` are 12, 12.3, 12.75 and 13.2 px) may merge where the before and after screenshots show no visible change. Step 2 lists the final table.
5. **Radii against the family's three names** (Q61, decided 2026-11-10, technical call). The names name a role, not a value, so the **names** are shared and the **values** are per app: `--radius-card` (12 px, today's `--radius`), `--radius-pill` (999 px, ×6), `--radius-control` (10 px, ×7); the 6, 8 and 16 px radii get `--radius-xs`, `--radius-sm` and `--radius-hero` (the swipe card's 16 px), and `50%` is Tailwind's `rounded-full`.
6. **The phone and desktop breakpoint** (default). `--breakpoint-wide: 760px`, giving `wide:` as `min-width: 760px`, exact to today's two rules; it is a named breakpoint, not a custom variant. Alternative: `md:` at 768 px, an 8 px shift at the boundary.
7. **The `<meta name="theme-color">` values** (`web/index.html:6-7`: `#14110f` and `#f7f4ef`). They duplicate `--color-page` and can't read a stylesheet, and their `media` queries can't follow a manual choice. Default: the theme script in step 6 replaces the two with one `theme-color` meta whose content it sets from the chosen theme's values, and a test (`web/src/theme.test.ts`) checks that those values equal the tokens' (it reads `index.html` and `index.css`).
8. **Where the `@layer base` page rules live** (default). `html` (`color-scheme`, `-webkit-text-size-adjust`) and `body` (font, 15 px size, line-height, colour, background), and `:focus-visible`, in `@layer base` in `index.css`, plus the dark redefinition. Everything else is a utility.
9. **Visual parity** (Q19, decided 2026-11-10, owner). Close enough: screenshots at 1280 and 390 px in light show no visible change to layout or colour. A few pixels of drift in spacing or rounding needn't be fixed or listed. Dark is checked for unreadable text.
10. **Tests** (Q60 and Q62, decided 2026-11-10, technical calls). The three existing tests assert on text, so no class-name assertion needs rewriting. The theme module's tests run under jsdom (brief 16 adds it); flows stay in Playwright. Tests select by role, and `data-testid` only where no role fits.
11. **No PRs, no branches** (Q4, decided 2026-11-10, owner). One commit per step, straight on `main`.

## Files you OWN

- `web/src/styles.css`, which becomes `web/src/styles/index.css` (one stylesheet; `main.tsx:6` imports it).
- The `className`s in `web/src/**/*.tsx`, and the new parts' classes in `web/src/components/ui/`.
- New: `web/src/lib/cn.ts` (clsx + tailwind-merge, with `extendTailwindMerge` for Lantern's `text-*`, `rounded-*`, `z-*` and `max-w-*` token names, or `cn()` drops them) and its test.
- `web/src/SwipeCard.tsx`: class names only. The `style` transform stays.
- `web/package.json`, `web/vite.config.ts` (the Tailwind plugin) and `package-lock.json`: `tailwindcss` and `@tailwindcss/vite` at 4.3.5, `clsx` and `tailwind-merge` at the versions the base-ui skill pins, all exact.
- `eslint.config.js`: `eslint-plugin-better-tailwindcss` on `web/src/**` (brief 15's table).
- The theme switch: `web/src/theme.ts`, the inline script and the `theme-color` meta in `web/index.html`, the control on `AccountPage.tsx`, and `web/src/theme.test.ts` (decision 7).
- `.claude/rules/web.md`: the Tailwind lines.
- Corpus: `corpus/wiki/web-app.md`, [wiki/architecture.md](../../wiki/architecture.md) (the paragraph on the page's frame and tokens, around line 75), [wiki/decisions.md](../../wiki/decisions.md), [wiki/status.md](../../wiki/status.md), [log.md](../../log.md).

## Files you must NOT touch

- `server/` and `shared/`, including the suggestion scoring.
- The swipe gesture's code in `SwipeCard.tsx`, beyond its class names.
- `web/src/components/ui/` behaviour: only the classes on the parts.
- `web/vendor/`.

## What to do

One commit per step, straight on `main`; after each, `npm run check` passes and `npm run build` succeeds.

1. **Screenshots before.** Bring the stack up from a scratch copy of the data, never the owner's:
   - `LANTERN_DB=<scratch file>`, `PUBLIC_ORIGIN` unset (so `http://localhost:5180`), and **no `OMDB_API_KEY`**, so every poster is the empty placeholder and the record route answers 503 `no_key`: deterministic, no outside call;
   - `npm run titles:import -w @lantern/server -- --from server/src/pool/fixtures --min-votes 1` (the folder is `server/src/features/pool/fixtures` if brief 18 has landed), the fixtures' handful of titles;
   - `SEED_USERNAME=demo SEED_PASSWORD=<12 or more throwaway characters> npm run seed -w @lantern/server`;
   - `npm run dev`, then Playwright: sign in, and rate and mark titles through the page's own buttons so each list has rows.

   Take each state at 1280 × 800 and 390 × 844 in light (decision 9): suggestions; rate (idle, mid-swipe at a fixed pointer offset, the leaving card); search with results; a title page; the watchlist, the ratings tabs and not interested; an undo notice; sign-in; the account page. Keep the images out of git. Wait for `aria-busy` to clear before each shot.
2. **Set up.** Add the dependencies and the plugin. Write `web/src/styles/index.css`: `@import "tailwindcss"`, `@theme` with the default scales cleared and the mapping above (default `--spacing`, px type tokens), `@custom-variant dark` on `data-theme`, `--breakpoint-wide`, and the `@layer base` page rules (`body` takes the 15 px) with the dark redefinition under `[data-theme="dark"]`. At this step the dark block may still sit under `prefers-color-scheme` until step 6, so the screenshots compare like with like. Write a comment at the top of `@theme` listing which names are the family's and which are Lantern's. Keep `styles.css` imported after `index.css` only for what hasn't moved yet; add `cn.ts` and its test. Check, in a scratch build, that `bg-red-500` and `text-sm` emit nothing and that `wide:` is `min-width: 760px`.
3. **Convert, one area per commit**, deleting each rule from `styles.css` as its markup moves:
   1. the frame: `.app`, `.topbar`, `.tabbar`, brand, `Shell.tsx`;
   2. controls and fields, `Credits`, `Placeholder`, the sign-in gate (`AuthGate`, `LoginPage`) and the account page;
   3. brief 16's parts, with Base UI's state attributes as variants (`data-pressed:`, `data-selected:`, `data-focus-visible:`) in place of `[aria-pressed="true"]` and `[aria-selected="true"]`;
   4. the title list, rows, posters, chips, the title page, the state picker and its rating colours, through lookup tables for the dynamic names;
   5. the rating cards: `SwipeCard` (`transition` under `motion-safe:`, the reduced-motion rule at line 882 kept as a `motion-reduce:` utility), the card actions, the undo notice.
4. **Finish.** Delete `styles.css`. Remove the `scripts/conventions.json` exceptions for it, if any. The only `.css` file left is `web/src/styles/index.css`. Run `check-base-ui` strict: rules 4-7 report 0, with `SwipeCard.tsx:67` as the one allowed inline `style`.
5. **Screenshots after.** Same states, same sizes. Diff each pair; fix any difference a person would see in layout or colour, and let a few pixels of drift go (decision 9). Check once, in the browser and without a screenshot pair, that the frame changes exactly at 760 (759, 760 and 761 px).
6. **The theme switch** (decision 2), in its own commit after the screenshots:
   1. `web/src/theme.ts` reads the stored choice (`light`, `dark` or `system`, from `localStorage` inside a `try`, since storage can be blocked) and sets `data-theme` on `<html>`; the dark block moves from `prefers-color-scheme` to `[data-theme="dark"]`.
   2. A small inline script in `web/index.html`'s `<head>` does the same before first paint: the stored choice, else `light`. With `system` it follows `prefers-color-scheme` and listens for changes, and it sets the one `theme-color` meta and `color-scheme` to match (decision 7).
   3. A Light / Dark / System control on the account page, on brief 16's `RadioGroup` wrapper.
   4. Tests: each stored value maps to the attribute; `system` follows a changed media query; the `theme-color` values equal the tokens'; the control is found by role.
   5. Take dark screenshots of each main screen and read them for unreadable text.
7. **Corpus.** Update `corpus/wiki/web-app.md`, the tokens paragraph of [wiki/architecture.md](../../wiki/architecture.md), a [wiki/decisions.md](../../wiki/decisions.md) entry ("Tailwind on the family's token names, Lantern's values"), `.claude/rules/web.md` (tokens only from `@theme`; no arbitrary colours; the `wide` variant; type sizes from the named scale; both themes change when a colour token changes, under `data-theme`, and the switch is the only place that sets it), and replace brief 15's "dark mode is `prefers-color-scheme` only" line, [wiki/status.md](../../wiki/status.md) and [log.md](../../log.md). Run `bash corpus/lint.sh` until it is clean.

## Acceptance

- [ ] `find web/src -name "*.css"` prints only `web/src/styles/index.css`, and `grep -rn "style=" web/src --include=*.tsx` prints only `SwipeCard.tsx`.
- [ ] `index.css`'s `@theme` defines exactly the mapped tokens: a deliberate `bg-red-500` or `text-sm` in a component produces no CSS (checked in a scratch build and reverted).
- [ ] `grep -rnE "(bg|text|border)-\[#|rgb\(" web/src --include=*.tsx` prints nothing.
- [ ] `check-base-ui` strict passes with rules 1-13 at 0 or excepted with a reason in `scripts/conventions.json`.
- [ ] `web/src/lib/cn.ts`'s test shows `cn("text-small", "text-heading")` keeps the last and `cn("text-small", "text-accent")` keeps both (the `extendTailwindMerge` check).
- [ ] The `theme.test.ts` tests of decisions 2 and 7 pass.
- [ ] The light screenshot pairs at 1280 and 390 px show no visible change to layout or colour, with the CSS size before and after in the outcome note.
- [ ] The switch has three choices. A first visit with no stored choice is light even when the system is dark; "Dark" and "System" (with a dark system) set `data-theme="dark"` before first paint, with no flash; the choice survives a reload. A Playwright test covers all three, and dark screenshots of each main screen show no unreadable text. `grep -rn "prefers-color-scheme" web/src web/index.html` finds only the "System" code and the theme script.
- [ ] `grep -n "font-size" web/src/styles/index.css` shows the 15 px on `body`, none on `html`.
- [ ] `npm run check` passes (typecheck, lint with `better-tailwindcss`, format, conventions, test), `npm run build` succeeds, and `bash corpus/lint.sh` ends clean.

## Interplay

- Brief 16's `data-checked`, `data-pressed` and `data-selected` selectors replace the `aria-*` ones here; the parts' classes are written in this brief. Its `RadioGroup` is the theme control's base.
- Wicket's brief 12 owns the family token list. If a name changes there, change it here mechanically.
- Brief 19 (the redesign) comes after this brief, changes values and layout on top of it, and must keep the switch working in both themes.
- The Docker image doesn't build the page (the deploy builds it and Caddy serves it), so the Tailwind packages touch only the `deps` stage's `npm ci`.
