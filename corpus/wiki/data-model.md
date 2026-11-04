---
summary: What Lantern keeps in its one SQLite file, as built from 2026-11-04. The owner's own data (title_states: one state per user and title; card_skips) holds no TMDB facts, so TMDB's six-month cache rule never touches it; ward-auth's own tables; the migrations under PRAGMA user_version; the states routes and the rules they follow (one state at a time, a state drops a skip, every query scoped to the user, paging by a cursor).
updated: 2026-11-04
---

# Data model

One SQLite file (`LANTERN_DB`, or `data/lantern.sqlite`), WAL mode, foreign keys on. Lantern's
schema is versioned with `PRAGMA user_version` ([db.ts](../../server/src/db.ts)): migrations
run once, in order, each in a transaction, and a shipped one is never edited. ward-auth
migrates its own tables (`auth_users`, `auth_sessions`, `auth_ward_links`, tracked in
`auth_migrations`) and never touches `user_version` ([sign-in.md](sign-in.md)).

## The owner's own data

A title is its media type (`movie` or `tv`) and TMDB's id. Neither table holds a title, a
poster or any other TMDB fact: those live in the cache and are joined in when a page lists
titles. So TMDB's rule that its data is cached six months at most ([sources.md](sources.md))
never reaches the ratings, and a rating made today is still there in ten years.

| Table | Key | Columns |
|---|---|---|
| `title_states` | `user_id`, `media_type`, `tmdb_id` | `state` (one of six, checked), `updated_at` |
| `card_skips` | `user_id`, `media_type`, `tmdb_id` | `skipped_at` |

Times are epoch milliseconds. `user_id` is ward-auth's user id; there is no foreign key to
`auth_users`, because the library creates that table after Lantern's migrations run.

## The rules

All in [states.ts](../../server/src/states.ts), the only module that runs SQL on these tables:

- A title has at most one state per user: `awful`, `meh`, `good`, `amazing`, `not_interested`
  or `want_to_watch`. Setting one replaces the one before, so rating a title on the watchlist
  takes it off. Clearing deletes the row.
- Setting a state drops a skip of that title. A skip never touches a state.
- Every query is scoped to the signed-in user. Two accounts never see each other's rows.
- Lists are newest first and paged by a cursor (`updated_at`, media type, id), so titles set in
  the same millisecond are never lost between pages.

## The routes

Behind sign-in; the writes behind the Origin check ([sign-in.md](sign-in.md)). Code:
[routes/states.ts](../../server/src/routes/states.ts); contract:
[states.ts](../../shared/src/states.ts).

| Route | Answer |
|---|---|
| `GET /v1/titles/:type/:id/state` | `{ row }`, null when untouched |
| `PUT /v1/titles/:type/:id/state` `{ state }` | the row |
| `DELETE /v1/titles/:type/:id/state` | `{ cleared }` |
| `POST /v1/titles/:type/:id/skip` | `{ skipped: true }` |
| `DELETE /v1/titles/:type/:id/skip` | `{ skipped: false }` (the cards' undo) |
| `GET /v1/states?state=&type=&limit=&cursor=` | `{ rows, next }`; `state` is one of the six or `rated` (any of the four); `limit` up to 200, default 50 |
| `GET /v1/states/counts` | `{ counts }`: per state, `{ movie, tv }` |

`:type` is `movie` or `tv` and `:id` a positive 32-bit integer; anything else, an unknown state
or an extra body field is a 400 whose message starts with the field's name.

For later pages the store also answers the states of many titles in one query (marking search
results), every title with a state (keeping suggestions out), and every skipped title (the
cards).
