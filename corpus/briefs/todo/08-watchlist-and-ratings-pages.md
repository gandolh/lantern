# Task 08: The watchlist and ratings pages

## Context

**Needs the TMDB key** (titles and posters for the rows). The watchlist is a page of its own
([decisions.md](../../wiki/decisions.md)); the ratings page lets the owner look back over what
was rated and change it. States hold no TMDB facts (brief 04), so each list joins the cached
title summaries, fetching the missing or stale ones a few at a time (brief 05's `titles.ts`).

Depends on 07.

## Files you OWN

- `server/src/app.ts` (the list route), tests
- `shared/src/` (the list answer)
- `web/src/` (the watchlist page, the ratings page, a title row or poster card shared with
  search)
- `corpus/wiki/status.md`, `corpus/log.md`

## What to do

1. **Route**: `GET /v1/lists/:list?type=&state=&before=` where `:list` is `watchlist`,
   `ratings` (optionally one step) or `not-interested`. Rows newest first, each with the state,
   when it was set and the title's summary, or a placeholder when the summary isn't fetched yet
   (and how many are pending, so the page can ask again). At most a handful of TMDB calls per
   request.
2. **The watchlist page**: posters with title, year and type; filter by films or series; on
   each, "rate" (the state picker; rating takes it off the list) and remove. Empty: a line
   pointing to search and the cards.
3. **The ratings page**: the same rows, a filter per step (awful, meh, good, amazing) and the
   not interested list as a tab, counts on each, change or clear inline.
4. A row whose state changes leaves or moves at once, with an undo for a removal.

## Acceptance

- `npm run typecheck`, `npm run lint` and `npm test` pass; the route is tested on fixtures,
  including a list whose summaries aren't cached yet.
- A browser walk on a phone-sized window: the titles rated and listed in brief 07's walk show
  up; rate one from the watchlist and it moves to the ratings page; remove and undo.
