---
summary: What Lantern is and what its first version does, on one page, as settled on 2026-11-04. Rate films and series on four steps, mark them not interested or want to watch, deal rating cards, search, see a title's page with OMDb scores, and get suggestions with a reason; the screens, the data kept, the sources, how suggestions are ranked, the briefs that build it (02-11), and what is left for later.
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
- **Deal rating cards**: popular and well-known titles one at a time, swiped on the phone or
  answered with buttons, with skip and undo.
- **Search** films and series by name.
- **Open a title**: poster, year, genres, runtime or seasons, overview, director or creators, the
  main cast, IMDb, Rotten Tomatoes and Metacritic scores, its state and TMDB's similar titles.
- **See the lists**: the watchlist, the ratings by step, and not interested.
- **Get suggestions**: ranked, each saying "because you liked X".

## Screens

Conventional navigation: a top bar on wide screens and a bottom tab bar on the phone, with
Suggestions, Rate, Watchlist, Ratings and Search; the account page from the top bar. The TMDB
logo and notice sit on the account page and in the footer. The cards are built for the phone
first.

## Data kept

In one SQLite file:

- **Accounts and sessions**: ward-auth's own tables.
- **States**: per user, per title (media type and TMDB id), the state and when it was set; and
  the skipped cards. These are the owner's own data and hold no TMDB facts.
- **The cache**: TMDB's answers trimmed to what Lantern shows or scores (title details, list
  pages, search pages, genre names), each with when it was fetched, deleted after six months at
  most; and OMDb's scores per IMDb id, fetched once.

## Suggestions, in short

1. Seeds: every title rated good (weight 1) or amazing (weight 2).
2. Candidates: the TMDB recommendations of each seed (from its cached details), minus every
   title that has a state.
3. A taste profile from all ratings: each genre, keyword and person of a rated title gets the
   rating's weight (awful -2, meh -1, good +1, amazing +2), summed and damped by how often it
   appears.
4. Score: how many seeds recommended the candidate, by their weight, plus the profile's weights
   of its genres, keywords and people. Ties go to TMDB's vote count.
5. Reason: the strongest seeds behind it, "because you liked X and Y".

The exact weights are set and tested in the suggestions brief; no model, no match %.

## The build

The briefs are in `briefs/` (todo, then done once built), run in number order.

| Brief | What | Needs a key |
|---|---|---|
| 02 | Workspaces, settings, the database, health, the page's shell | no |
| 03 | Local accounts, the seed, Sign in with Ward | no |
| 04 | Ratings, not interested, watchlist and skips, stored and served | no |
| 05 | The two clients, the queue, the cache, the poster proxy, on fixtures | no |
| 06 | The container and `docs/owner-setup.md` | no |
| 07 | First real calls; search and the title page | yes |
| 08 | The watchlist and ratings pages | yes |
| 09 | The rating cards | yes |
| 10 | The taste profile and the suggestions page | yes |
| 11 | The README and the docs index | yes |

## Later

Where to stream, a PWA install, import from IMDb or Letterboxd, ratings per season, and
anything social. None is promised.
