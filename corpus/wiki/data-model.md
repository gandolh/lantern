---
summary: What Lantern keeps in its one SQLite file, as built from 2026-11-04. The owner's own data (title_states: one state per user and IMDb id; card_skips) holds no outside facts; OMDb's records (omdb_records, found kept for good); the title pool (titles, pool_imports); ward-auth's own tables; the migrations under PRAGMA user_version (the third rebuilt the states on IMDb ids when TMDB was dropped); the states routes and the rules they follow (one state at a time, a state drops a skip, every query scoped to the user, paging by a cursor).
updated: 2026-11-04
---

# Data model

One SQLite file (`LANTERN_DB`, or `data/lantern.sqlite`), WAL mode, foreign keys on. Lantern's
schema is versioned with `PRAGMA user_version` ([db.ts](../../server/src/db.ts)): migrations
run once, in order, each in a transaction, and a shipped one is never edited. ward-auth
migrates its own tables (`auth_users`, `auth_sessions`, `auth_ward_links`, tracked in
`auth_migrations`) and never touches `user_version` ([sign-in.md](sign-in.md)).

## The owner's own data

A title is its IMDb id (`tt0111161`). Neither table holds a title, a poster or any other outside
fact: those come from the pool and OMDb's records, joined in when a page lists titles, so the
ratings never depend on a source keeping its data.

| Table | Key | Columns |
|---|---|---|
| `title_states` | `user_id`, `imdb_id` | `state` (one of six, checked), `updated_at` |
| `card_skips` | `user_id`, `imdb_id` | `skipped_at` |

Times are epoch milliseconds. `user_id` is ward-auth's user id; there is no foreign key to
`auth_users`, because the library creates that table after Lantern's migrations run.

## OMDb's records

What OMDb answered per title, already read; how it is used is in
[source-calls.md](source-calls.md).

| Table | Key | Columns |
|---|---|---|
| `omdb_records` | `imdb_id` | `outcome` (`found` or `not_found`), `body` (the record, JSON), `poster` (1 when it has one), `fetched_at` |

## The title pool

Written only by the import ([titles.md](titles.md)), replaced whole by each run.

| Table | Key | Columns |
|---|---|---|
| `titles` | `imdb_id` | `kind` (`movie` or `series`), `imdb_type`, `title`, `search_title`, `start_year`, `end_year`, `runtime`, `genres` (comma-separated), `rating`, `votes`, `directors` and `writers` (comma-separated `nm…` ids) |
| `pool_imports` | `id` | `imported_at`, `min_votes`, `movies`, `series`, `took_ms` |

Indexed by votes (most-voted first) and by kind and votes.

## History

Migrations 1 and 2 keyed the states by TMDB's media type and id and cached TMDB's answers. When
the owner dropped TMDB (2026-11-04), migration 3 dropped those tables and rebuilt the states on
IMDb ids; no real data existed yet, so nothing was converted.

## The rules

All in [states.ts](../../server/src/states.ts), the only module that runs SQL on `title_states`
and `card_skips`:

- A title has at most one state per user: `awful`, `meh`, `good`, `amazing`, `not_interested`
  or `want_to_watch`. Setting one replaces the one before, so rating a title on the watchlist
  takes it off. Clearing deletes the row.
- Setting a state drops a skip of that title. A skip never touches a state.
- Every query is scoped to the signed-in user. Two accounts never see each other's rows.
- Lists are newest first and paged by a cursor (`updated_at`, IMDb id), so titles set in the
  same millisecond are never lost between pages.

## The routes

Behind sign-in; the writes behind the Origin check ([sign-in.md](sign-in.md)). Code:
[routes/states.ts](../../server/src/routes/states.ts); contract:
[states.ts](../../shared/src/states.ts).

| Route | Answer |
|---|---|
| `GET /v1/titles/:id/state` | `{ row }`, null when untouched |
| `PUT /v1/titles/:id/state` `{ state }` | the row |
| `DELETE /v1/titles/:id/state` | `{ cleared }` |
| `POST /v1/titles/:id/skip` | `{ skipped: true }` |
| `DELETE /v1/titles/:id/skip` | `{ skipped: false }` (the cards' undo) |
| `GET /v1/states?state=&limit=&cursor=` | `{ rows, next }`; `state` is one of the six or `rated` (any of the four); `limit` up to 200, default 50 |
| `GET /v1/states/counts` | `{ counts }`: per state |

`:id` is an IMDb id (`tt` and 7 to 10 digits); anything else, an unknown state or an extra body
field is a 400 whose message starts with the field's name.

For later pages the store also answers the states of many titles in one query (marking search
results), every title with a state (keeping suggestions out), and every skipped title (the
cards).
