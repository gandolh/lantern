---
summary: How Lantern ranks suggestions, as built 2026-11-04. Plain arithmetic over the title pool, no model: a taste profile per genre, director and writer from the four ratings (awful -2 to amazing +2), each title's weight spread over its features of a kind (1/√k, so a series' dozens of episode directors don't swamp a film's one) and damped by how often a feature recurs (1/√n); features weighted director 2, writer 1.5, genre 0.5; a nudge for IMDb's rating and votes; at least one liked title must account for 0.5 of the score; the reason is the liked title with the largest share. What it can't do, and how it ran on the real pool.
updated: 2026-11-04
---

# Suggestions

What was decided: [decisions.md](decisions.md), "Suggestions rank the pool". Code:
[score.ts](../../server/src/suggest/score.ts) (pure functions) and
[suggest.ts](../../server/src/suggest/suggest.ts) (what feeds them).
`GET /v1/suggestions?kind=&limit=` answers the ranked titles, each with the liked title behind
it; the home page shows them. No OMDb call: a poster shows only when one is already kept.

## The method

1. **Features.** Each pool title has up to three genres and the ids of its directors and writers
   (from IMDb's `title.crew`). For a series that means every episode's director and writer.
2. **The profile.** Every rated title adds its rating's weight to each of its features: awful
   -2, meh -1, good +1, amazing +2. Not interested and want to watch aren't ratings and add
   nothing.
   - **Spread**: a title's weight is shared among its features of one kind, 1/√k each when it
     has k of that kind. Without it, Game of Thrones (dozens of episode directors) outweighed
     every film in the first real run.
   - **Damping**: each feature's sum is divided by √n, n being how many rated titles have it,
     so a genre on half of what was rated doesn't decide everything.
3. **The score** of a candidate (every pool title without a state, of the kind asked): for each
   of its features, the profile's weight × the kind's weight (director 2, writer 1.5, genre 0.5)
   × the candidate's own spread, summed; plus a nudge of 0.4 per IMDb rating point above 7 and
   0.2 per tenfold of votes above 10,000. Only candidates that share a feature with a liked
   title are scored.
4. **The reason.** For the best-scored candidates, each liked title's share of the score is
   worked out the same way; the largest names the reason ("Because you liked X"). A candidate
   whose largest share is under 0.5 is dropped: one shared director or writer is enough, and
   so is every genre of a title rated good, but one genre out of several isn't.

Ties go to the most-voted. The pool's features (about 66,000 titles) are read once per import
and kept in memory; the route answered in about 40 ms on the real pool.

## How it looked

On 2026-11-04 with two ratings (The Dark Knight good, Game of Thrones amazing), the top 30 were
11 Nolan films for The Dark Knight (The Dark Knight Rises, Batman Begins, The Prestige, Memento,
Interstellar…) and 19 series for Game of Thrones (3 Body Problem, by the same creators,
Boardwalk Empire, The Sopranos, True Detective, Better Call Saul…).

## What it can't do

- Know actors: the pool leaves out IMDb's people file, so a favourite actor counts for nothing.
- Know that two titles are alike in mood or theme beyond IMDb's genres.
- Find titles outside the pool (fewer than 1,000 votes).
- Learn from not interested, skips or the watchlist.

All of these are deliberate for the first version; a later change starts with a revisit in
[decisions.md](decisions.md).
