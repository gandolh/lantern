# Task 07: First real calls; search and the title page

## Context

**Needs both keys in `.env`** (`TMDB_API_KEY`, `OMDB_API_KEY`). Never print, log, echo or commit
their values; the server reads them through its own env loading. Keep real calls few: OMDb's
free key allows 1,000 a day.

The clients from brief 05 were written against the docs. This brief checks them against the
real answers first, then builds the two pages everything else links to.

Depends on 04 and 05.

## Files you OWN

- `server/src/sources/` (fixes the live check calls for), `server/src/app.ts` (routes), tests
- `shared/src/` (the routes' answers)
- `web/src/` (the search page, the title page, a state picker component, the TMDB credit,
  `web/public/` for TMDB's logo)
- `corpus/wiki/sources.md` (what the real calls showed), `corpus/wiki/status.md`,
  `corpus/log.md`

## What to do

1. **The live check.** Run `npm run sources:check -w @lantern/server` once. Compare each answer
   with its fixture and the shapes marked "check" in [sources.md](../../wiki/sources.md) (the
   recommendations list, OMDb's fields). Fix the readers if they differ, and replace a
   hand-written fixture with a trimmed real answer where that is clearer. Note the result in
   sources.md, in words.
2. **Routes** (behind sign-in):
   - `GET /v1/search?q=&page=` → films and series with each one's state for this user
   - `GET /v1/titles/:type/:id` → the details and this user's state
   - `GET /v1/titles/:type/:id/scores` → OMDb's scores, or none (no IMDb id, not found, no key,
     the daily limit); a separate call, so a slow or spent OMDb never holds the page
3. **The search page**: one box (films and series together), results as posters with title,
   year, type and a state badge, more pages on demand. The query sits in the address, so Back
   returns to the results.
4. **The title page** (`/lantern/movie/:id`, `/lantern/tv/:id`): poster, title, year, genres,
   runtime or seasons, overview, directors or creators, the top cast, the scores with OMDb
   credited, the state picker (awful, meh, good, amazing; not interested; want to watch; clear),
   and TMDB's similar titles from the recommendations, each linking to its page. Posters through
   the proxy only.
5. **TMDB's credit**: one of TMDB's approved logos (downloaded once into `web/public/`) and the
   notice "This product uses the TMDB API but is not endorsed or certified by TMDB." on the
   account page and in the footer.

## Acceptance

- `npm run typecheck`, `npm run lint` and `npm test` pass; the routes are tested on fixtures.
- A browser walk on a phone-sized window: search a film, open it, rate it, see the badge in the
  results; open a series and put it on the watchlist; the scores show for a film. The walk's
  real calls are counted in the outcome.
- No request from the browser leaves Lantern's origin (the network log of the walk).
