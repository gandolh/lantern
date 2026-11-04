# Task 10: The title page with OMDb, and the first real OMDb calls

_Rewritten 2026-11-04 when the owner dropped TMDB; this number was "The taste profile and the
suggestions page" before._

## Context

**Makes real OMDb calls.** `OMDB_API_KEY` is in `.env` (the owner's file: never print, log,
echo or edit it). A free key allows 1,000 calls a day: keep the calls few. The OMDb record and
the poster route were built on fixtures in brief 07; this brief checks them against real
answers and puts them on the title page.

Depends on 07 and 09.

## Files you OWN

- `server/src/sources/` (reader fixes the real answers call for), `server/src/routes/`, tests
- `shared/src/`, `web/src/` (the title page)
- `corpus/wiki/sources.md`, `corpus/wiki/source-calls.md`, `corpus/wiki/status.md`,
  `corpus/log.md`

## What to do

1. **The live check**: run `npm run sources:check -w @lantern/server` once (one call). Compare
   the answer with the fixtures and the fields [sources.md](../../wiki/sources.md) marks as
   from common use; fix the reader if they differ. Note the result in sources.md, in words.
2. **`GET /v1/titles/:id/record`**: the OMDb record, from the cache or asked once; `none` when
   OMDb doesn't know the title; `503 no_key`, `502` on OMDb's refusal or failure (the daily
   limit says so).
3. **The title page**: the pool's facts at once, then the record: the poster (large), plot,
   runtime or seasons, rated, directors, writers, actors, language and country, and the three
   scores with OMDb credited, linking to the title on IMDb. A missing record or poster
   degrades to the pool's facts.
4. **The credits**: IMDb's line stays in the footer; "Scores and details from OMDb" beside the
   scores.

## Acceptance

- `npm run typecheck`, `npm run lint` and `npm test` pass; the record route is tested on
  fixtures (cached, asked once, not found, no key, refusal).
- A browser walk in a phone-sized window: open a film and a series from search, see the poster
  and scores; reopen one and see no new call. The outcome counts the real OMDb calls made.
- No request from the browser leaves Lantern's origin.
