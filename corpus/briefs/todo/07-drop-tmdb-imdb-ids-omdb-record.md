# Task 07: Drop TMDB: IMDb ids, the OMDb record, posters from OMDb

_Rewritten 2026-11-04 when the owner dropped TMDB; this number was "First real calls; search
and the title page" before._

## Context

The owner dropped TMDB for OMDb plus IMDb's data files ([decisions.md](../../wiki/decisions.md),
"Revisited"). Brief 05 built a TMDB client, its cache and a TMDB poster proxy on fixtures; none
of it ever made a real call. This brief takes TMDB out, keys every title by its IMDb id, and
turns the OMDb client into the full record Lantern shows (see
[sources.md](../../wiki/sources.md)). No real OMDb call: fixtures only.

Depends on 04 and 05.

## Files you OWN

- `server/src/sources/` (remove the TMDB files; the OMDb record, its cache, the poster fetch,
  the live check), `server/src/routes/`, `server/src/states.ts`, `server/src/db.ts` (a
  migration), `server/src/config.ts`, `server/src/app.ts`, `server/src/index.ts`, their tests
- `shared/src/` (states by IMDb id; the OMDb record type)
- `.env.example`, `docs/owner-setup.md`
- `corpus/wiki/source-calls.md`, `corpus/wiki/data-model.md`, `corpus/wiki/status.md`,
  `corpus/log.md`

## What to do

1. **Out**: the TMDB client, its readers, fixtures and tests, the TMDB cache table, the TMDB
   poster route, `TMDB_API_KEY` everywhere (settings, start log, `.env.example`, docs).
2. **IMDb ids.** A title is `tt` plus 7 to 10 digits. A new migration drops and recreates
   `title_states` and `card_skips` keyed by user and IMDb id (no real data exists yet), drops
   `tmdb_cache` and `omdb_cache`, and creates `omdb_records`. The states routes become
   `/v1/titles/:id/state` and `/v1/titles/:id/skip`; the list loses its media-type filter until
   the pool can answer it.
3. **The OMDb record** (`plot=full`, by IMDb id): title, years (a series' `2011–2019` or
   `2019–`), kind, rated, released, runtime in minutes, genres, directors, writers (without
   "(screenplay)" notes), actors, plot, language, country, awards, the poster URL (https on
   `m.media-amazon.com` only, else none), seasons, and the three scores (`N/A` read as none).
   Cached: found for good, not found for 30 days, a refusal or failure never. One queue, one
   call a second, single flight.
4. **Posters**: `GET /v1/posters/:id` serves the poster of a title whose record is already
   cached, and never asks OMDb (404 otherwise). Fetched from the record's URL (host allowlist,
   no redirects, JPEG/PNG/WebP, 5 MB, 10 s), passed on with a 30-day private browser cache,
   stored nowhere. `?size=large` asks Amazon for the 600-pixel version of the same image and
   falls back to the record's own URL.
5. **`GET /v1/sources`** answers `{ omdb }`. The live check makes one OMDb call (a film).

## Acceptance

- `npm run typecheck`, `npm run lint` and `npm test` pass; no file, setting or doc mentions a
  TMDB key. Tests on fixtures: the record reader (a film, a series with open-ended years, `N/A`
  fields, a poster on another host dropped, not found, a refusal), the cache rules, states by
  IMDb id (a bad id is a 400), the poster route (cached record only, allowlist, sizes,
  signed-out 401).
- No real OMDb call is made.
