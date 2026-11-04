# Task 04: States: ratings, not interested, watchlist and skips

## Context

A title has at most one state per user: one of the four ratings, not interested, or want to
watch ([decisions.md](../../wiki/decisions.md), [glossary.md](../../wiki/glossary.md)). Skips
from the rating cards are kept apart: they are not a state. This brief stores and serves them,
with no TMDB data at all: a row is the user, the media type, TMDB's id, the state and when.
Titles and posters come from the cache (brief 05), joined in when a page lists them.

Depends on 03 (the user id comes from the session).

## Files you OWN

- `server/src/db.ts` (a migration), `server/src/states.ts` (new: the only module that runs
  SQL on these tables), `server/src/app.ts` (the routes), their tests
- `shared/src/` (the state schemas and the routes' bodies)
- `corpus/wiki/data-model.md` (new), `corpus/wiki/status.md`, `corpus/log.md`

## What to do

1. **Tables.** `title_states` keyed by user, media type and TMDB id, with the state (checked
   against the six values) and `updated_at`; `card_skips` keyed the same way with `skipped_at`.
   Times are epoch milliseconds. An index for listing one user's titles in one state, newest
   first.
2. **Rules.** Setting a state replaces the one before (rating a title on the watchlist takes it
   off). Setting a state drops a skip of that title. Clearing deletes the row. Every query is
   scoped to the signed-in user.
3. **Routes** (behind sign-in; writes behind the Origin check):
   - `PUT /v1/titles/:type/:id/state` `{ state }` → the stored row
   - `DELETE /v1/titles/:type/:id/state` → `{ cleared: boolean }`
   - `POST /v1/titles/:type/:id/skip` and `DELETE /v1/titles/:type/:id/skip` (undo)
   - `GET /v1/states?state=&type=&limit=&before=` → rows newest first, paged by `updated_at`
   - `GET /v1/states/counts` → how many titles per state, by media type
   `:type` is `movie` or `tv`, `:id` a positive integer; anything else is a 400 naming the field.
4. **The module's reads for later briefs**: the states of a list of titles in one query (for
   marking search results and cards), every title with a state (for excluding suggestions), and
   the skipped titles (for the cards).
5. **`data-model.md`**: the tables so far, and why no TMDB fact is stored with a state (the
   six-month rule).

## Acceptance

- `npm run typecheck`, `npm run lint` and `npm test` pass. Tests: set, replace, clear; a rating
  takes a title off the watchlist; a state drops a skip; paging; counts; two users never see
  each other's rows; bad type, id or state are 400s; signed out is 401; a cross-site write is
  refused.
- No page changes yet; nothing calls TMDB.
