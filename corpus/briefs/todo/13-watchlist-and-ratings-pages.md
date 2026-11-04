# Task 13: The watchlist and ratings pages

## Context

The watchlist is a page of its own ([decisions.md](../../wiki/decisions.md)); the ratings page
lets the owner look back over what was rated and change it. States hold only IMDb ids, so each
list joins the pool for titles, years and kinds; a title the latest import dropped still shows,
from its cached OMDb record or by its id. No outside call.

Depends on 08 and 09.

## Files you OWN

- `server/src/routes/` (the list route), `server/src/states.ts` (the kind filter), tests
- `shared/src/`, `web/src/` (the watchlist page, the ratings page)
- `corpus/wiki/data-model.md`, `corpus/wiki/status.md`, `corpus/log.md`

## What to do

1. **`GET /v1/lists/:list?kind=&state=&cursor=`**, `:list` being `watchlist`, `ratings` (one
   step or all four) or `not-interested`: rows newest first with the state, when it was set, the
   pool's facts (or the record's, or none) and whether a poster is cached; counts per step.
2. **The watchlist page**: rows with title, year, kind; filter by kind; rate from it (the title
   leaves the list), or remove with undo. Empty: a line pointing to search and the cards.
3. **The ratings page**: the same rows, a filter per step with counts, not interested as a tab,
   change or clear inline.

## Acceptance

- `npm run typecheck`, `npm run lint` and `npm test` pass; the route is tested on a small pool,
  including a title missing from the pool.
- A browser walk in a phone-sized window: the titles marked in earlier walks show; rate one from
  the watchlist and it moves to the ratings page; remove and undo.
