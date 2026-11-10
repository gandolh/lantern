# Task 17: The web app to Tailwind

**Depends on:**

- In Lantern: brief 16, for `web/src/components/ui/`, `KindFilter.tsx` and the markup the new parts carry; brief 15, for the gate.
- In the owner's skills library:
  - brief 02, *A base-ui skill, styled with Tailwind*: rules 4-7, `migrating-from-plain-css.md` (the method), `check-base-ui.mjs`;
  - brief 15, *Enforce the base-ui and code-structure skills in every repo*: `check-base-ui` stops running `--warn-only` here.
- **In Wicket: its brief 12, *The web app to Tailwind, and the small tools' shared tokens*.** It sets the family's token names first (Q17: Wicket, then the-board, then Lantern, per Q20). This brief copies those names and puts only Lantern's values and Lantern-only tokens behind them. If Wicket's brief hasn't landed, build from the names in the table below, which are read from it, and check them against its `@theme` block before step 2.
- The owner's grilling of 2026-11-10: Q17 (token names), Q18 (dark mode), Q19 (visual parity), Q20 (order), and the new questions in decisions 1, 3, 4 and 5.

**Runs after:** 16. Brief 16 changes structure and behaviour; this brief changes only the styling, so the before and after screenshots compare like with like.

**Before you start:** run `brief-board guide` ([corpus/CLAUDE.md](../../CLAUDE.md)).

## Context

The owner's call of 2026-11-09: Base UI is styled with Tailwind v4, and whole apps move to Tailwind. Lantern's page is one plain stylesheet with a dark mode and no CSS dependency. This brief moves it to Tailwind 4.3.5 (Wicket's version, on the same Vite 8.3.5) with the looks unchanged, and gives Lantern's values the family's token names.

### Corrections to the estate draft

- **38 custom properties is 38 definitions, not names.** There are **21 names** on `:root` (`web/src/styles.css:9-29`) and 17 of them redefined under `prefers-color-scheme: dark` (`styles.css:38-60`). The four never redefined: `--radius`, `--top-h`, `--tab-h`, `--page-w`. All 21 are read: 100 `var()` uses.
- **No third-party CSS.** Base UI ships none and `main.tsx` imports only `./styles.css` (line 6). The unlayered-vendor-CSS trap doesn't apply.
- **The root font size is 15 px** (`styles.css:31`), and **21 rules size type in `rem`** against it, while spacing is in `px`. Tailwind's rem scale would shift if it were left alone (decision 3).
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
| `--color-bg`, `--color-surface`, `--color-surface-sunk`, `--color-text`, `--color-text-muted`, `--color-line`, `--color-accent` | `--bg`, `--surface`, `--surface-sunk`, `--text`, `--text-muted`, `--line`, `--accent` | Lantern's warm palette (`styles.css:9-15`, dark 40-46) |
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

**Sizes, radii and weights**, with values unchanged (brief 17 doesn't collapse any):

- **12 distinct font sizes** (`grep -oE "font-size: [^;]+" web/src/styles.css | sort | uniq -c`): `0.85rem` ×5, `0.88rem` ×4, `0.8rem` ×3, `16px` ×2, `1.6rem` ×2, `1.1rem` ×2, `0.72rem`, `0.82rem`, `1.15rem`, `1.2rem`, `1.25rem` and `0.9em`, plus the root's `15px`. Each gets a `--text-*` token named by its use (decision 4), in `rem`, so the root stays 15 px and nothing moves.
- **7 radii:** `10px` ×7, `999px` ×6, `var(--radius)` ×3 (12 px) and a literal `12px`, `8px`, `6px`, `16px`, `50%`. The family has three names (`--radius-control`, `--radius-card`, `--radius-pill`) with Wicket's values (4, 8 and 10 px); Lantern's values differ. Decision 5.
- **5 weights:** 400, 500, 600, 700, 800: all of Tailwind's own `font-normal` to `font-extrabold`, so the default weight scale stays.

Spacing: `--spacing: 4px`, with the default colour, text, radius, shadow and container scales cleared (`--color-*: initial` and so on), so only Lantern's tokens exist. Spacing is in `px` throughout; the odd values (for example the `3px` padding and `34px` height of `.segmented`, lines 447-458) are arbitrary values, listed in step 3's commit message.

Dark mode: the 17 dark values are written once, as a redefinition of the `--color-*` and `--shadow-card` names inside `@media (prefers-color-scheme: dark)` in `@layer base`, and **no `dark:` variant appears in a class name** (decision 2).

### What the browser does today that Tailwind's preflight stops

Preflight resets heading size and weight, zeroes `p`, `dl`, `dd` and `ul` margins and padding, and sets `img`/`svg` to blocks. Today the page relies on the defaults here, so the screenshots must show each:

- **18 headings** (`grep -n "<h[1-6]" web/src/*.tsx`): 12 `h1` take `.page-title` (size, margin) or `.gate-brand`; the 6 `h2` (`AccountPage.tsx:86`, `RatePage.tsx:267`, `TitlePage.tsx:110, 156, 162, 199`) are unclassed or `.card-title`, and get their size from descendant rules (`.account-section h2` line 413, `.title-section h2` line 653) and the browser's bold.
- **61 `<p>`**: most keep the browser's 1em margin; descendant rules adjust some.
- **5 `<ul>`** (`.title-list` ×3, `ListPage.tsx:136`, `SearchPage.tsx:83`, `SuggestionsPage.tsx:73`; `.chips`, `TitlePage.tsx:90`; `.scores`, `TitlePage.tsx:200`) reset list style and padding themselves; **2 `<dl>`** (`.facts`, `AccountPage.tsx:33`, and `.facts.title-details`, `TitlePage.tsx:163`) set `dt`/`dd` in descendant rules (lines 398, 402, 714).
- **Descendant element selectors:** `.account-section h2`, `.credit a`, `.chips li`, `.scores li`, `.card-title a`, `.facts dt/dd`, `.title-details dd`, `.title-section h2`, and brief 16's `.segmented button` and `.tabs button`. Content passed as children can't take a class from its wrapper: put the utility on the element at the call site.
- `button, input, select { font: inherit; color: inherit }` (lines 70-75), `* { box-sizing: border-box }` and `body { margin: 0 }` are preflight's.

The fallback, if native controls shift: import Tailwind's `theme.css` and `utilities.css` without preflight, and keep the page's own resets in `@layer base`.

**Not measured here** (no Tailwind in the repo): whether `max-w-narrow`-style custom container names compile as expected with the default scale cleared, and whether `@custom-variant`/`--breakpoint-wide` produce `min-width: 760px` exactly. Step 2 checks both against Wicket's measured behaviour (its `max-sm:` and `phone` finding: Tailwind's built-in max variants differ from a hand-written query by one pixel at the boundary, so the `wide` variant is checked at 759, 760 and 761 px).

## Owner decisions (defaults this brief builds)

1. **Token names for the small tools family** (Q17). Default: Wicket's names, as in the table, with Lantern's values. The open question is Wicket's: `bg-bg` and `text-text` against `page` and `ink`. Lantern follows whichever Wicket's brief settles; it doesn't answer it. *Raised in Wicket's brief.*
2. **Dark mode** (Q18). Default: `prefers-color-scheme` through token redefinition, no `dark:` classes. It is what the page does today.
3. **Tailwind's scale against a 15 px root** (Q44). Default: `--spacing: 4px`, the default scales cleared, and Lantern's own `--text-*` tokens in `rem`, so the 15 px root stays and 21 rem rules render as today. The alternative is moving the 15 px to `body`, which would make `rem` 16 px and shift every font size by 6.7%. The same question is Almanac's and Wicket's.
4. **Naming the 12 font sizes.** Default: one token per distinct value, named by what it sizes, so each stays exact. *New question for the grilling*: Satchel's brief asks the same about 13 sizes. Collapsing `0.85rem`, `0.88rem` and `0.82rem` would change pixels, so it isn't done here; if the owner wants a scale, it is a design change with its own brief.
5. **Lantern's radii against the family's three names.** Default: `--radius-card` (12 px, today's `--radius`), `--radius-pill` (999 px, ×6), `--radius-control` (10 px, ×7); the 6, 8 and 16 px radii get `--radius-xs`, `--radius-sm` and `--radius-hero` (the swipe card's 16 px), and `50%` is Tailwind's `rounded-full`. Wicket's values for the three family names differ (4, 8, 10 px), so the **names** are shared and the **values** are per app. *New question for the grilling*: do the family names promise a value, or only a role?
6. **The phone and desktop breakpoint.** Default: `--breakpoint-wide: 760px`, giving `wide:` as `min-width: 760px`, exact to today's two rules. Alternative: `md:` at 768 px, a 8 px shift. The screenshots at 759, 760 and 761 px decide; not a grilling question.
7. **The `<meta name="theme-color">` values** (`web/index.html:6-7`: `#14110f` and `#f7f4ef`). They duplicate `--color-bg` and can't read a stylesheet. Default: left, with a comment pointing at the token, and a test that the two values equal the tokens' (reads `index.html` and `index.css`). *New question for the grilling*: should the estate generate them?
8. **Where the `@layer base` page rules live.** Default: `html` (font, size, line-height, colour, background, `color-scheme`, `-webkit-text-size-adjust`) and `:focus-visible` in `@layer base` in `index.css`, plus the dark redefinition. Everything else is a utility.

## Files you OWN

- `web/src/styles.css`, which becomes `web/src/styles/index.css` (one stylesheet; `main.tsx:6` imports it).
- The `className`s in `web/src/**/*.tsx`, and the new parts' classes in `web/src/components/ui/`.
- New: `web/src/lib/cn.ts` (clsx + tailwind-merge, with `extendTailwindMerge` for Lantern's `text-*`, `rounded-*`, `z-*` and `max-w-*` token names, or `cn()` drops them) and its test.
- `web/src/SwipeCard.tsx`: class names only. The `style` transform stays.
- `web/package.json`, `web/vite.config.ts` (the Tailwind plugin) and `package-lock.json`: `tailwindcss` and `@tailwindcss/vite` at 4.3.5, `clsx` and `tailwind-merge` at the versions the base-ui skill pins, all exact.
- `eslint.config.js`: `eslint-plugin-better-tailwindcss` on `web/src/**` (brief 15's table).
- A test for decision 7, in `web/src/theme.test.ts`.
- `.claude/rules/web.md`: the Tailwind lines.
- Corpus: `corpus/wiki/web-app.md`, [wiki/architecture.md](../../wiki/architecture.md) (the paragraph on the page's frame and tokens, around line 75), [wiki/decisions.md](../../wiki/decisions.md), [wiki/status.md](../../wiki/status.md), [log.md](../../log.md).

## Files you must NOT touch

- `server/` and `shared/`, including the suggestion scoring.
- The swipe gesture's code in `SwipeCard.tsx`, beyond its class names.
- `web/src/components/ui/` behaviour: only the classes on the parts.
- `web/vendor/`.
- `web/index.html`'s `theme-color` values.

## What to do

One commit per step; after each, `npm run check` passes and `npm run build` succeeds.

1. **Screenshots before.** Bring the stack up from a scratch copy of the data, never the owner's:
   - `LANTERN_DB=<scratch file>`, `PUBLIC_ORIGIN` unset (so `http://localhost:5180`), and **no `OMDB_API_KEY`**, so every poster is the empty placeholder and the record route answers 503 `no_key`: deterministic, no outside call;
   - `npm run titles:import -w @lantern/server -- --from server/src/pool/fixtures --min-votes 1` (the folder is `server/src/features/pool/fixtures` if brief 18 has landed), the fixtures' handful of titles;
   - `SEED_USERNAME=demo SEED_PASSWORD=<12 or more throwaway characters> npm run seed -w @lantern/server`;
   - `npm run dev`, then Playwright: sign in, and rate and mark titles through the page's own buttons so each list has rows.

   Take each state at 1280 × 800 and 390 × 844, **light and dark** (`colorScheme`), plus the shell at 759, 760 and 761 px (top bar and tab bar swap at 760): suggestions; rate (idle, mid-swipe at a fixed pointer offset, the leaving card); search with results; a title page; the watchlist, the ratings tabs and not interested; an undo notice; sign-in; the account page. Keep the images out of git. Wait for `aria-busy` to clear before each shot.
2. **Set up.** Add the dependencies and the plugin. Write `web/src/styles/index.css`: `@import "tailwindcss"`, `@theme` with the default scales cleared and the mapping above, `--spacing: 4px`, `--breakpoint-wide`, and the `@layer base` page rules with the dark redefinition. Write a comment at the top of `@theme` listing which names are the family's and which are Lantern's. Keep `styles.css` imported after `index.css` only for what hasn't moved yet; add `cn.ts` and its test. Check, in a scratch build, that `bg-red-500` and `text-sm` emit nothing and that `wide:` is `min-width: 760px`.
3. **Convert, one area per commit**, deleting each rule from `styles.css` as its markup moves:
   1. the frame: `.app`, `.topbar`, `.tabbar`, brand, `Shell.tsx`;
   2. controls and fields, `Credits`, `Placeholder`, the sign-in gate (`AuthGate`, `LoginPage`) and the account page;
   3. brief 16's parts, with Base UI's state attributes as variants (`data-pressed:`, `data-selected:`, `data-focus-visible:`) in place of `[aria-pressed="true"]` and `[aria-selected="true"]`;
   4. the title list, rows, posters, chips, the title page, the state picker and its rating colours, through lookup tables for the dynamic names;
   5. the rating cards: `SwipeCard` (`transition` under `motion-safe:`, the reduced-motion rule at line 882 kept as a `motion-reduce:` utility), the card actions, the undo notice.
4. **Finish.** Delete `styles.css`. Remove the `scripts/conventions.json` exceptions for it, if any. The only `.css` file left is `web/src/styles/index.css`. Run `check-base-ui` strict: rules 4-7 report 0, with `SwipeCard.tsx:67` as the one allowed inline `style`.
5. **Screenshots after.** Same states, same sizes. Diff each pair; fix a difference or list it with its reason. At 759, 760 and 761 px the frame must change exactly at 760.
6. **Corpus.** Update `corpus/wiki/web-app.md`, the tokens paragraph of [wiki/architecture.md](../../wiki/architecture.md), a [wiki/decisions.md](../../wiki/decisions.md) entry ("Tailwind on the family's token names, Lantern's values"), `.claude/rules/web.md` (tokens only from `@theme`; no arbitrary colours; the `wide` variant; dark mode through the `@layer base` redefinition), [wiki/status.md](../../wiki/status.md) and [log.md](../../log.md). Run `bash corpus/lint.sh` until it is clean.

## Acceptance

- [ ] `find web/src -name "*.css"` prints only `web/src/styles/index.css`, and `grep -rn "style=" web/src --include=*.tsx` prints only `SwipeCard.tsx`.
- [ ] `index.css`'s `@theme` defines exactly the mapped tokens: a deliberate `bg-red-500` or `text-sm` in a component produces no CSS (checked in a scratch build and reverted).
- [ ] `grep -rnE "(bg|text|border)-\[#|rgb\(" web/src --include=*.tsx` prints nothing.
- [ ] `check-base-ui` strict passes with rules 1-13 at 0 or excepted with a reason in `scripts/conventions.json`.
- [ ] `web/src/lib/cn.ts`'s test shows `cn("text-small", "text-heading")` keeps the last and `cn("text-small", "text-accent")` keeps both (the `extendTailwindMerge` check).
- [ ] The `theme.test.ts` test of decision 7 passes.
- [ ] The before and after screenshots match at 1280 and 390 px, light and dark, and at 759, 760 and 761 px; every difference is fixed or listed with its reason in the outcome note.
- [ ] `npm run check` passes (typecheck, lint with `better-tailwindcss`, format, conventions, test), `npm run build` succeeds, and `bash corpus/lint.sh` ends clean.

## Interplay

- Brief 16's `data-pressed` and `data-selected` selectors replace the `aria-*` ones here; the parts' classes are written in this brief.
- If the owner picks `page` and `ink` over `bg` and `text` in Wicket's brief, the two names change in Lantern's `@theme` and in every `bg-bg` and `text-text` use, mechanically.
- The Docker image doesn't build the page (the deploy builds it and Caddy serves it), so the Tailwind packages touch only the `deps` stage's `npm ci`.
