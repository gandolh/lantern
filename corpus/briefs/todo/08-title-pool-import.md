# Task 08: The title pool, imported from IMDb's files by hand

_Rewritten 2026-11-04 when the owner dropped TMDB; this number was "The watchlist and ratings
pages" before._

## Context

Search, the cards and the suggestions draw from a pool of titles built from IMDb's
non-commercial files ([titles.md](../../wiki/titles.md), [sources.md](../../wiki/sources.md)).
The owner runs the import by hand, about monthly; nothing runs it on a timer. IMDb's terms ask
for a credit line on the page.

Depends on 07.

## Files you OWN

- `server/src/pool/` (new): the file reader, the row parsers, the import, the command, the
  pool's reads; fixtures (small TSV files) and tests
- `server/src/db.ts` (a migration), `server/src/app.ts`, `server/package.json` (a
  `titles:import` script), `shared/src/` (the pool's answers)
- `web/src/` (the credit line in the footer and on the account page; the pool's state on the
  account page)
- `infrastructure/Dockerfile` (if the command needs anything), `docs/owner-setup.md`
- `corpus/wiki/titles.md`, `corpus/wiki/data-model.md`, `corpus/wiki/status.md`,
  `corpus/log.md`

## What to do

1. **The command**: `npm run titles:import -w @lantern/server` in development, and
   `node server/dist/pool/cli.js` (built JavaScript) in the container. Options: the vote
   threshold (default 1,000) and a local folder of files instead of the download (for tests
   and offline runs). Same database as the server (`LANTERN_DB`).
2. **Streaming**: `title.ratings` first (kept when votes reach the threshold), then
   `title.basics` (kept when rated enough, not adult, and `movie`, `tvMovie`, `tvSeries` or
   `tvMiniSeries`), then `title.crew` for the kept titles. Each file is fetched over HTTPS,
   gunzipped and read line by line; nothing is written to disk but the database. `\N` is none.
3. **The pool**: per title the IMDb id, kind (film or series), IMDb's type, primary title, a
   normalised title for search, start and end years, runtime, up to three genres, rating,
   votes, director ids and writer ids. Indexed for the most-voted first, by kind.
4. **Replacing**: the new pool replaces the old one in one transaction, with a record of the
   import (when, the threshold, how many films and series, how long). A failed import leaves
   the old pool. States, skips and OMDb's records are never touched.
5. **Its report**: titles kept, by kind; the counts at 500, 1,000, 2,000 and 5,000 votes; the
   time taken; peak memory; the pool's size in the database.
6. **`GET /v1/pool`**: how many titles, by kind, and when they were imported. The account page
   shows it; an empty pool says to run the import.
7. **The credit**: "Information courtesy of IMDb (https://www.imdb.com). Used with permission."
   in the footer and on the account page, word for word.

## Acceptance

- `npm run typecheck`, `npm run lint` and `npm test` pass. Tests on small fixture files: the
  filters (type, adult, threshold), `\N`, titles with quotes and commas, crew joined, a
  re-run replacing the pool without touching states, a failed run leaving the old pool.
- The real import runs **once**, into a scratch database; its time, peak memory, table size and
  the threshold counts go in the outcome and in `titles.md`.
