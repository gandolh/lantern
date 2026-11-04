# Task 05: The TMDB and OMDb clients, the cache, the poster proxy

## Context

Every outside call is the server's, through a queue and a cache; the browser only talks to
Lantern ([decisions.md](../../wiki/decisions.md)). The endpoints, shapes, key forms, limits and
terms are in [sources.md](../../wiki/sources.md). Shelfmark's `server/src/lookup/` has the
pattern (one queue per source with a spacing, a cache table, clients with an injectable
`fetch`, readers tested on fixtures); copy the shape, not the code.

**No key is used in this brief.** The clients are written against the documented shapes and
tested with small hand-written fixtures. The first real calls open brief 07.

Depends on 02 (and 03 for the image route's guard).

## Files you OWN

- `server/src/sources/` (new): `queue.ts`, `http.ts`, `tmdb.ts`, `omdb.ts`, `cache.ts`,
  `titles.ts`, `images.ts`, `check.ts` (the live check script), fixtures and tests
- `server/src/db.ts` (a migration), `server/src/config.ts`, `server/src/app.ts`,
  `server/src/index.ts`, `server/package.json` (a `sources:check` script)
- `shared/src/` (the title summary and title details types)
- `.env.example`, `corpus/wiki/sources.md`, `corpus/wiki/data-model.md`,
  `corpus/wiki/status.md`, `corpus/log.md`

## What to do

1. **Settings.** `TMDB_API_KEY` and `OMDB_API_KEY`, both optional: without one, the server
   starts, says so in its log, and the routes that need it answer `503` `{ code: "no_key" }`.
   A JWT-shaped TMDB value goes in `Authorization: Bearer`, anything else in `api_key`. No URL
   with a key in it reaches a log line or an error message.
2. **Queues.** One per source, one request at a time with a spacing (TMDB about 10 a second,
   well under its ~40; OMDb one a second). A `429` backs off once and fails. Requests have a
   timeout. Two callers asking for the same thing at once share one request.
3. **Readers** (lenient, keep only what Lantern shows or scores): a **title summary** (media
   type, id, English title, year, poster path, genre ids, vote count, popularity) from search,
   popular, discover and recommendation lists, dropping people; **title details** from one
   call per title (`append_to_response`: films `keywords,credits,recommendations`; series
   `keywords,aggregate_credits,external_ids,recommendations`): title, year, dates, runtime or
   seasons and episodes, genres, overview, poster and backdrop paths, IMDb id, up to 30
   keywords, the top 10 cast, directors (films) or creators (series), and the recommendations as
   summaries; genre names; **scores** from OMDb (IMDb, Rotten Tomatoes, Metacritic, each
   optional, `N/A` read as missing).
4. **The cache.** TMDB answers stored already trimmed, keyed by what was asked (with a reader
   version, so a changed reader doesn't read old rows), with `fetched_at`. Fresh for: details
   90 days, list and search pages 1 day, genre names 30 days. Stale rows are served while a
   fresh one is fetched on the next use; **nothing older than 180 days is ever served**, and
   such rows are deleted at start-up and, at most hourly, when the cache is read. No timer.
   OMDb: a found answer kept for good (asked once per title), a not-found one for 30 days, a
   refusal (limit, bad key) or failure never stored.
5. **`titles.ts`**: get one title's details (cache or fetch); get many titles' summaries for a
   list page, fetching at most N missing or stale ones per call and reporting how many are
   still missing.
6. **The poster proxy**: `GET /v1/images/:size/:file`, behind sign-in. Sizes `w92`, `w185`,
   `w342`, `w500`, `w780`; the file a TMDB file name (letters, digits, `.jpg` or `.png`); fetched
   from `image.tmdb.org` only, at most 5 MB and 10 s, passed on with its content type and a
   private browser cache of 30 days. Nothing stored on the server.
7. **The live check** (`npm run sources:check -w @lantern/server`): with the keys in `.env`,
   makes four calls (one search, one film, one series, one OMDb) through the real clients and
   prints what each reader made of them, never the key. Written now, run first in brief 07.

## Acceptance

- `npm run typecheck`, `npm run lint` and `npm test` pass. Tests on fixtures: each reader
  (a film, a series with keywords under `results`, a search with a person dropped, an empty
  date, a null poster, OMDb with `N/A` and with `Response: "False"`); the key in the header or
  the query by its shape, and absent from errors; the queue's spacing and single flight; cache
  freshness, the stale-then-refresh path and the 180-day cut; OMDb's not-found and refusal
  rules; the poster proxy's allowlist and limits; `503 no_key` without keys.
- No real TMDB or OMDb call is made.

## Outcome (2026-11-04)

Built as specified, on hand-written fixtures; no real TMDB or OMDb call was made. How it works:
[source-calls.md](../../wiki/source-calls.md); the tables: [data-model.md](../../wiki/data-model.md).

- **Stale rows are refreshed on use, not in the background.** The brief said "served while a
  fresh one is fetched on the next use"; the build awaits the refresh instead, and serves the
  stale row only when the refresh fails. One wait now and then, and no work after a response
  ends, which keeps to "no background work".
- **The poster proxy refuses redirects** and anything but JPEG, PNG or WebP, on top of the size
  and time caps.
- **`GET /v1/sources`** (which keys are set, as booleans) was added for the page to explain a
  missing key. **`sourceFailure`** maps no key, a title TMDB doesn't have, and a source's
  failure to 503, 404 and 502 for the routes of brief 07 onward.
- **A series' runtime** falls back to its last episode's runtime when `episode_run_time` is
  empty.
- **The live check** (`npm run sources:check -w @lantern/server`) makes four calls and can save
  the raw answers outside the repo (`--save`); it refuses a folder inside it.

Checks: `npm run typecheck`, `npm run lint`, `npm test` (13 files, 85 tests; 46 new: the
readers on each fixture, the OMDb reader and client, the TMDB client's key forms, requests, 429
retry and key-free errors, the queue's spacing and single flight, the cache's freshness, stale
fallback, 180-day cut and hourly purge, summaries' budget, OMDb's caching rules, the poster
proxy's allowlist and limits, `/v1/sources`, the error mapping, and the key settings). No page
changes, so no browser walk.
