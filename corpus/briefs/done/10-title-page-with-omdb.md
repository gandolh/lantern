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

## Outcome (2026-11-04)

Built as specified; how the record and posters work: [source-calls.md](../../wiki/source-calls.md).

- **The live check** (one call, Inception) matched the reader field for field: years, runtime,
  genres, people, plot, the three scores. No reader change was needed.
- **Posters**: OMDb's URLs no longer end in `_SX300` but in `._V1_QL75_UX380_CR0,0,380,562_.jpg`
  (380 wide). The large size now swaps any `._V1_` modifier for `SX760`; the walk got a
  760-pixel poster through Lantern.
- **The title page** shows the pool's facts at once and OMDb's part as it comes: poster, rated,
  seasons for a series, plot, the three scores (OMDb credited, linked), directed or created by,
  written by, starring, released, language, country, awards. Without a record it says why (no
  key, OMDb's daily limit, OMDb not knowing the title) and offers Try again. A title the pool
  lacks shows from its record alone.
- **Real OMDb calls made: 3** (the live check, The Dark Knight, Breaking Bad). Reopening The Dark
  Knight asked nothing (the kept record count stayed at 2).

Checks: `npm run typecheck`, `npm run lint`, `npm test` (14 files, 79 tests; 4 new for the
record route: asked once then kept, the poster URL never sent, null when unknown, 502 on a
refusal, 503 without a key; the large-size swap on the new URL form). A browser walk at 412 x 915:
a film and a series with poster, plot, people and scores; the browser's resource list held only
Lantern's origin.
