# Task 09: The rating cards

## Context

**Needs the TMDB key.** Cards deal popular titles one at a time; each can be rated, marked not
interested, put on the watchlist, or skipped. They are swiped on the phone (Android first, the
iPhone kept working) and stay available after the start
([decisions.md](../../wiki/decisions.md)). Popular lists lean to what is new
([sources.md](../../wiki/sources.md)), so the deck also draws on the best-known titles
(`discover` by vote count), which the owner has more likely seen.

Depends on 04, 05 and 07 (the state picker).

## Files you OWN

- `server/src/cards.ts` (new), `server/src/app.ts` (the route), tests
- `shared/src/` (the deck's answer)
- `web/src/` (the cards page, the swipe handling)
- `corpus/wiki/decisions.md` (the swipe mapping, if it holds), `corpus/wiki/status.md`,
  `corpus/log.md`

## What to do

1. **The deck** (`GET /v1/cards?type=&count=`): the next titles that have no state and weren't
   skipped by this user, interleaving films and series (or one, by `type`) and the popular with
   the best-known lists, walking their pages through the cache. A capped depth per list; any
   error ends the walk with what was found. Each card: summary, genre names, overview.
2. **The cards page**: one card at a time, poster large, title, year, type, genres, a short
   overview. Under it, every choice as a button: awful, meh, good, amazing; not interested; want
   to watch; skip. Undo brings back the last card and clears what it set. The next cards load
   ahead, so the deck never waits on a tap.
3. **Swiping**: pointer events with the card following the finger, a label showing what the
   swipe will do, a threshold to commit, and a snap back below it. Every action keeps its
   button; a swipe is a shortcut for at most a few of them (a proposal: right for want to watch,
   left for not interested, up for skip; ratings by tap). Record the mapping in decisions.md.
   Vertical page scroll must still work outside the card. Keyboard shortcuts on a desktop.
4. Empty deck: say so, and offer search.

## Acceptance

- `npm run typecheck`, `npm run lint` and `npm test` pass; the deck is tested on fixtures
  (skips and states excluded, interleaving, the depth cap, an error mid-walk).
- A browser walk in a phone-sized window with touch emulation: a swipe each way, a tap rating,
  a skip, an undo; the rated titles then show on the ratings page.
