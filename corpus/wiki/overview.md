---
summary: What Lantern is and what its first version does, on one page, as replanned and built on 2026-11-04 after the owner dropped TMDB. Rate films and series on four steps, mark them not interested or want to watch, deal rating cards from a title pool built from IMDb's files, search the pool, open a title's page with OMDb's details and scores, and get suggestions with a reason; the screens, the data kept, the sources, how suggestions are ranked, the briefs that build it, and what is left for later.
updated: 2026-11-04
---

# Overview

Lantern is the owner's own taste.io: rate the films and series you have watched, and get
suggestions for what to watch next from what you liked. The name is the magic lantern, the
projector before cinema. One user, English only, on the estate's VPS behind sign-in
([decisions.md](decisions.md)).

## What the owner can do

- **Rate** a title awful, meh, good or amazing; or mark it **not interested**; or put it on the
  **watchlist** (want to watch). Change or clear any of these.
- **Deal rating cards**: the pool's most-voted titles not yet marked, one at a time, swiped on
  the phone or answered with buttons, with skip and undo.
- **Search** films and series by name, in the pool.
- **Open a title**: poster, year, genres, runtime or seasons, plot, director, writers and actors
  from OMDb, its IMDb, Rotten Tomatoes and Metacritic scores, and its state.
- **See the lists**: the watchlist, the ratings by step, and not interested.
- **Get suggestions**: ranked from the pool, each saying "because you liked X".

## Screens

Conventional navigation: a top bar on wide screens and a bottom tab bar on the phone, with
Suggestions, Rate, Watchlist, Ratings and Search; the account page from the top bar. IMDb's
credit line sits in the footer and on the account page, OMDb's beside the scores. The cards are
built for the phone first.

## Data kept

In one SQLite file ([data-model.md](data-model.md)):

- **Accounts and sessions**: ward-auth's own tables.
- **States**: per user, per IMDb id, the state and when it was set; and the skipped cards.
- **The title pool**: from IMDb's files, films and series above a vote threshold, with title,
  years, genres, rating, votes, director and writer ids ([titles.md](titles.md)). Replaced by
  each import, which the owner runs by hand.
- **OMDb's records**: each title shown in full, asked once and kept.

## Suggestions, in short

1. A taste profile from every rated title: each of its genres, directors and writers gets the
   rating's weight (awful -2, meh -1, good +1, amazing +2), summed and damped by how often it
   appears, so a common genre doesn't drown the rest.
2. Every pool title without a state is a candidate; its score is the sum of the profile's
   weights for its genres, directors and writers, with a small nudge for IMDb's rating.
3. The reason is the liked title that adds the most to that score: "because you liked X".

The exact weights are set and tested in the suggestions brief; no model, no match %.

## The build

The briefs are in `briefs/` (todo, then done once built), run in number order. Briefs 07 to 11
were rewritten on 2026-11-04 when TMDB was dropped, and 12 to 14 added; the OMDb key was in
`.env` by then, so nothing pauses for it.

| Brief | What | Real OMDb calls |
|---|---|---|
| 02-04 | Skeleton, sign-in, states | no (done) |
| 05 | Source clients on fixtures (its TMDB part undone by 07) | no (done) |
| 06 | The container and `docs/owner-setup.md` | no (done) |
| 07 | Drop TMDB: IMDb ids, the OMDb record, posters from OMDb | no (fixtures; done) |
| 08 | The title pool, imported from IMDb's files by hand | no (done) |
| 09 | Search over the pool, the state picker, a title page from the pool | no (done) |
| 10 | The title page with OMDb: poster, plot, people, scores | yes, the first (done) |
| 11 | The rating cards | yes, for the card on screen (done) |
| 12 | Suggestions | no (done) |
| 13 | The watchlist and ratings pages | no (done) |
| 14 | The README and the docs index | no (done) |

## Later

Where to stream, a PWA install, import from IMDb or Letterboxd, ratings per season, a search
fallback through OMDb for titles the pool lacks, and anything social. None is promised.
