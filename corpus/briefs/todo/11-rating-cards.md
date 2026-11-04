# Task 11: The rating cards

_Rewritten 2026-11-04 when the owner dropped TMDB; this number was "The README and the docs
index" before._

## Context

Cards deal titles one at a time; each can be rated, marked not interested, put on the
watchlist, or skipped. They are swiped on the phone (Android first, the iPhone kept working)
and stay available after the start ([decisions.md](../../wiki/decisions.md)). Since TMDB was
dropped, the deck is the pool's most-voted titles not yet marked: well known, so likely seen.
OMDb is asked only for the card on screen (and the next one, loaded ahead), never the whole
deck.

Depends on 08, 09 (the state picker) and 10 (the record route).

## Files you OWN

- `server/src/cards.ts` (new), `server/src/routes/`, tests
- `shared/src/`, `web/src/` (the cards page, the swipe handling)
- `corpus/wiki/decisions.md` (the swipe mapping), `corpus/wiki/status.md`, `corpus/log.md`

## What to do

1. **The deck** (`GET /v1/cards?kind=&count=`): the most-voted pool titles with no state and
   not skipped by this user, films and series together or one kind. Each card: the pool's facts
   and the cached record if there is one.
2. **The cards page**: one card at a time, poster large, title, year, kind, genres, the plot's
   first lines. Under it every choice as a button: awful, meh, good, amazing; not interested;
   want to watch; skip. Undo brings back the last card and clears what it set. The record of the
   card on screen and of the next one is fetched as they come up, and a card shows its pool
   facts while it waits.
3. **Swiping**: pointer events, the card follows the finger, a label shows what the swipe will
   do, a threshold commits it, and below it the card snaps back. Every action keeps its button;
   a swipe is a shortcut for a few of them. Record the mapping in decisions.md. The page still
   scrolls outside the card. Keyboard shortcuts on a desktop.
4. An empty deck (or an empty pool) says so and points to search or the import.

## Acceptance

- `npm run typecheck`, `npm run lint` and `npm test` pass; the deck is tested on a small pool
  (states and skips excluded, by kind, most-voted first).
- A browser walk in a phone-sized window with touch: a swipe each way, a tap rating, a skip, an
  undo; the rated titles then show on the ratings list. The outcome counts the OMDb calls made.
