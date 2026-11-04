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

## Outcome (2026-11-04)

Built as specified.

- **`GET /v1/lists/:list?kind=&rating=&cursor=`**: 50 rows a page, newest first, with counts per
  state for the tabs. The kind filter joins the pool, so a title the latest import dropped falls
  out of a filtered list (its kind is unknown) but shows in the unfiltered one, from OMDb's kept
  record or by its id, marked "No longer in Lantern's title list".
- **The pages** share one list component: a kind filter, "Show more", and the state picker on
  every row. A title whose new state no longer fits the list leaves it, and a line says what
  happened, with Undo (which sets the old state back). On the ratings page the tabs are All,
  Awful, Meh, Good, Amazing and Not interested, each with its count.
- **Remove** is the picker's second tap (clearing want to watch); there is no separate button.

Checks: `npm run typecheck`, `npm run lint`, `npm test` (18 files, 104 tests; 5 new for the
lists: the watchlist with facts and counts, ratings all or one step, not interested, the kind
filter, a dropped title from the kept record or its id, bad lists and queries). A browser walk at
412 x 915: the watchlist held the two titles marked in earlier walks; rating one Good moved it
to the ratings page ("Breaking Bad is now good. Undo"); clearing the other and Undo brought it
back; the ratings tabs showed All 4, Good 3, Amazing 1, Not interested 1.
