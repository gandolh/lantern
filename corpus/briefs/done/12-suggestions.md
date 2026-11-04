# Task 12: Suggestions from the pool

## Context

Every pool title without a state is a candidate. A taste profile from the genres, directors and
writers of everything rated, likes and dislikes both, ranks them; each suggestion says "because
you liked X", X being the rated title that adds the most to its score. Plain arithmetic, no match
% ([decisions.md](../../wiki/decisions.md), "Suggestions rank the pool";
[overview.md](../../wiki/overview.md)). No outside call: posters show only when cached.

Depends on 04, 08 and 09.

## Files you OWN

- `server/src/suggest/` (new): the profile and the ranking as pure functions, and the reads that
  feed them; tests
- `server/src/routes/`, `shared/src/`, `web/src/` (the suggestions page, the home page)
- `corpus/wiki/suggestions.md` (new), `corpus/wiki/status.md`, `corpus/log.md`

## What to do

1. **The profile**: rating weights awful -2, meh -1, good +1, amazing +2. Each genre, director
   and writer of a rated title gets the weight, summed and damped by how often it appears, so a
   common genre doesn't drown the rest; directors and writers count for more than a genre. Not
   interested is not a rating and stays out (the page says so).
2. **The score** of a candidate: the profile's weights of its genres, directors and writers,
   plus a small nudge from its IMDb rating; only candidates sharing something with a liked title
   are ranked. Each rated title's share of the score is kept, for the reason.
3. **The reason**: the liked title whose share is largest: "Because you liked X", linking to it.
4. **`GET /v1/suggestions?kind=&limit=`**: the ranked list, each with the pool's facts, the
   reason, and whether a poster is cached. Fast enough on the whole pool for one person (say
   under half a second).
5. **The page**, at home (`/lantern/`): the list with the reason under each, the state picker
   inline (a title given a state leaves the list), filter by kind. Too few ratings: a line and a
   link to the cards.
6. **`suggestions.md`**: the method, the weights and why, what it can't do.

## Acceptance

- `npm run typecheck`, `npm run lint` and `npm test` pass. Tests on a hand-made pool where the
  right order is obvious: likes pull up, dislikes push down, stated titles excluded, the reason
  is the biggest share, damping keeps one genre from deciding.
- A browser walk: with the ratings made so far, suggestions show with reasons; rating one
  removes it.

## Outcome (2026-11-04)

Built as specified; the method, the weights and what it can't do are in
[suggestions.md](../../wiki/suggestions.md).

- **The spread** (each title's weight shared 1/√k over its features of one kind) was added after
  the first real run: IMDb lists every episode's director and writer for a series, and Game of
  Thrones' crowd put eight HBO series above every Nolan film. With it, two ratings gave 11 Nolan
  films and 19 series in the top 30.
- **Weights**: director 2, writer 1.5, genre 0.5; the IMDb nudge 0.4 per rating point above 7 and
  0.2 per tenfold of votes; a suggestion needs a liked title with a share of 0.5.
- **The pool's features** are read once per import (the newest `pool_imports` row) and kept in
  memory; the route answered in about 40 ms.
- **Skipped cards** can still be suggested (a skip is not a state).

Checks: `npm run typecheck`, `npm run lint`, `npm test` (17 files, 99 tests; 15 new: the
features, the profile's sums, spread and damping, a director over shared genres, dislikes
pushing down, one genre not deciding, a series' crowd not outweighing an auteur, the reason as
the largest share, the 0.5 floor, the nudge and ties, the limit; the route empty until a like,
stated titles left out, by kind, a re-import read again). A browser walk at 412 x 915 on the
real pool: suggestions with reasons on the home page; rating the top one took it off the list.
