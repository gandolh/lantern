# Task 19: A redesign with Hallmark, on the estate board

**Depends on:**

- In Lantern: [brief 17](../done/17-the-web-app-to-tailwind.md), which puts the page in Tailwind on the family's token names and adds the Light / Dark / System switch, on the wrappers from [brief 16](../done/16-base-ui-by-the-conventions.md). A redesign is then mostly a new token set and layout.
- In the owner's skills library:
  - brief 24, which vendors Hallmark as the design skill and adopts taste-skill 2.5's ideas (palettes and type dealt by trade, its copy layer);
  - the estate redesign board: one artifact with a page per app, owned by the skills library.
- The owner's answer of 2026-11-10 (Q39): no bake-off; Hallmark redesigns every web UI, keeping what is useful from taste-skill 2.5, and the owner approves each app on the board before any code changes.

**Runs before:** nothing. **Runs after:** 15 to 18, the redesign last. Brief 18 is server-only and does not block it.

**Before you start:** run `brief-board guide` ([corpus/CLAUDE.md](../../CLAUDE.md)).

## Context

Lantern is a film and series rating app for one person, in the spirit of taste.io: rate what you have seen on four steps, keep a watchlist, and get suggestions ranked from your own taste. It is used mostly on a phone (Android first, iPhone kept working), with a bottom tab bar on phones and a top bar from 760 px.

### The screens (read 2026-11-10, `web/src/route.ts`, `App.tsx`)

The page has eight routes under `/lantern/`, with no router library.

| Screen | Route | File |
|---|---|---|
| Suggestions (home), with the kind filter | `/` | `web/src/SuggestionsPage.tsx`, `web/src/TitleRow.tsx` |
| Rate: the swipe cards, the four rating buttons, undo | `/rate` | `web/src/RatePage.tsx`, `web/src/SwipeCard.tsx` |
| Watchlist | `/watchlist` | `web/src/ListPage.tsx` |
| Ratings (tabs by rating, and not interested) | `/ratings` | `web/src/ListPage.tsx`, `web/src/ListPages.tsx` |
| Search, with results | `/search?q=` | `web/src/SearchPage.tsx` |
| A title: poster, details, credits, scores, the state picker | `/title/:id` | `web/src/TitlePage.tsx`, `web/src/StatePicker.tsx`, `web/src/Credits.tsx` |
| Account, with the theme switch | `/account` | `web/src/AccountPage.tsx` |
| Log in, and the gate's states | `/login` | `web/src/LoginPage.tsx`, `web/src/AuthGate.tsx` |
| The shell: top bar, bottom tab bar, brand | every page | `web/src/Shell.tsx` |
| Not found, and the empty poster placeholder | | `web/src/App.tsx`, `web/src/Placeholder.tsx`, `web/src/Poster.tsx` |

### What the design docs fix today

- There is no design document. [wiki/decisions.md](../../wiki/decisions.md) holds the locked calls: four rating steps plus "not interested" and "want to watch" (taste.io's scale, without its friends and match scores); rating cards that stay after the start, with swipes meaning right is want to watch, left is not interested and up is skip, while the four ratings are taps on big buttons ("Swipes on the cards are for the titles not seen"); English only; and the credit line for OMDb and IMDb's files, word for word. [wiki/architecture.md](../../wiki/architecture.md) describes the frame (a bottom tab bar on phones, the top bar from 760 px) and the tokens, and [wiki/glossary.md](../../wiki/glossary.md) fixes the words the interface uses.
- The theme switch is the owner's call of 2026-11-10 (Q18): Light / Dark / System, light on a first visit, `data-theme`. Brief 17 builds it.
- The family token names (`page`, `surface`, `ink`, `accent`, `line`, `danger`) are shared with wicket and the-board; Lantern's values are its own, a warm palette with four rating colours (`awful`, `meh`, `good`, `amazing`) that carry meaning. A redesign may change values freely; renaming a family token is raised on the board for all three.
- A poster appears only when its OMDb record is cached; the empty placeholder is the normal state without a key.

The redesign stays inside these decisions unless the owner reopens one on the board.

## Owner decisions

Answered 2026-11-10: Q39 (Hallmark, with taste-skill 2.5's useful parts; approval on the board first). Default: the proposal keeps the four rating steps and their colours, the swipe meanings, the bottom tab bar on phones, and the credit line. Anything that moves one of those is flagged on the board as a reopened decision.

No PRs, no branches (Q4): one commit per step, straight on `main`.

## Files you OWN

- `web/src/styles/index.css` (the tokens) and the screens listed above, one commit each.
- A design document recorded from the shipped result (`docs/design.md`, new; the repo has none today), linked from [wiki/decisions.md](../../wiki/decisions.md).
- Corpus: [wiki/architecture.md](../../wiki/architecture.md) (the frame and tokens paragraph), [wiki/decisions.md](../../wiki/decisions.md) (the visual direction, if it changes), [wiki/status.md](../../wiki/status.md), [log.md](../../log.md).

## Files you must NOT touch

- `server/` and `shared/`, including the suggestion scoring.
- `web/vendor/` (the vendored Ward hooks).
- The swipe gesture's behaviour in `SwipeCard.tsx` (its look may change), and the window key handling on `/rate`.
- The copy's meaning: its wording stays unless the board approves a change. No invented titles, scores or numbers.
- `docs/` screenshots, which are retaken in a later docs pass (the outcome note says so).

## What to do

1. **Today.** Take Playwright screenshots of every screen above at 1280 and 390 px, in light and dark, kept out of git. Use brief 17's recipe (a scratch database, the fixture titles, no `OMDB_API_KEY`, so posters are the placeholder and runs are deterministic). Include the rate page idle, mid-swipe and leaving, an undo notice, the ratings tabs, and the sign-in states.
2. **Propose.** With Hallmark (and taste-skill 2.5's trade palettes and copy layer where they help), make a proposal per screen, inside the recorded decisions. Check each against the Floor: contrast, a visible focus ring, a reduced-motion path, no invented facts, no broken phone layout. Posters in a proposal are credited, openly licensed photographs or clearly marked placeholders, never real film art.
3. **Board.** Put the proposals on this app's page of the estate board, beside today's screenshots at both widths.
4. **Approval.** The owner approves on the board. Nothing below starts before that, and the approval is recorded in `log.md` with its date.
5. **Build.** First as a token change in `web/src/styles/index.css` (colours, radii, shadows, type, spacing, both themes), then one screen per commit. Keep the Base UI wrappers, the swipe card and the theme switch working.

## Acceptance

- [ ] The owner's approval is on the board and recorded in `log.md` with the date.
- [ ] Contrast: every text and icon pair in both themes, rating colours included, clears 4.5:1 (3:1 for large text and UI parts), measured with a script over the built tokens and listed in the outcome note.
- [ ] A Playwright test tabs through each screen and asserts a visible focus ring on every stop.
- [ ] A Playwright test with `reducedMotion: "reduce"` asserts no running animation or transition on each screen, the swipe card included.
- [ ] A Playwright test at 390 px asserts `document.documentElement.scrollWidth <= window.innerWidth` on each screen.
- [ ] Every title, score and figure shown comes from the data or the copy; the outcome note lists none invented, and the credit line is unchanged.
- [ ] On `/rate`, the number keys, arrows and `Z` behave as before, and a swipe still commits right, left and up as recorded.
- [ ] The theme switch still gives Light, Dark and System, light on a first visit, and brief 17's theme tests pass.
- [ ] `npm run check` passes, and `bash corpus/lint.sh` ends clean.

## Interplay

- Brief 17 owns the token names, the wrappers' styling and the theme switch; this brief changes values and layout on top. Lantern's token names follow wicket's brief 12, so a rename is raised on the board for the whole family.
- Brief 16's `RadioGroup` (the kind filter and the theme control), `ToggleGroup` (the state picker) and `Tabs` (the ratings tabs) stay Base UI wrappers; the redesign restyles them. The `/rate` key rule from brief 16 holds.
- Brief 15's formatter and lint run on every redesign commit.
