---
summary: How Lantern's server calls TMDB and OMDb, as built 2026-11-04 on hand-written fixtures (no real call yet). The key settings and how TMDB's two key kinds are told apart; one queue per source with its spacing, single flight, the 429 retry and errors that never carry a key; the readers and what they keep; the cache (fresh for 90 days, 1 day or 30 days, refreshed on use, never served past 180 days, purged at start-up and hourly on read; OMDb kept once found); the poster proxy; GET /v1/sources; the 503/404/502 mapping; and the live check script that opens brief 07.
updated: 2026-11-04
---

# Calling the sources

What TMDB and OMDb offer, and their terms, are in [sources.md](sources.md); this page is how
Lantern uses them. Code: [server/src/sources/](../../server/src/sources/titles.ts). Every call
is the server's; the browser only talks to Lantern ([decisions.md](decisions.md)).

## Keys

`TMDB_API_KEY` and `OMDB_API_KEY` in `.env`, both optional. Without one the server still starts,
logs that it is missing, and what needs it answers `503 { code: "no_key" }`; `GET /v1/sources`
says `{ tmdb, omdb }` (booleans) so the page can say why. TMDB's value can be the API key or the
API Read Access Token: a JWT-shaped value (`eyJ…`, three dot-separated parts) goes in
`Authorization: Bearer`, anything else in `api_key`. The start log names which kind, never the
value. Errors name the source and the path (`TMDB /3/movie/1: answered 404`), never a query
string, where a key sits.

## Queues

One queue per source ([queue.ts](../../server/src/sources/queue.ts)): one request at a time, each
starting at least the spacing after the last: TMDB 100 ms (ten a second, under its ~40), OMDb
1 s. Cache hits never queue. Two callers asking for the same thing at once share one request
(single flight). A `429` waits `Retry-After` (at most 5 s) and retries once; a second `429`
fails `rate_limited`. Requests time out after 10 s.

## Readers

Lenient ([tmdbReaders.ts](../../server/src/sources/tmdbReaders.ts),
[omdb.ts](../../server/src/sources/omdb.ts)): a missing or odd field degrades a page instead of
breaking it. They keep only what Lantern shows or scores, in the shapes of
[shared/src/titles.ts](../../shared/src/titles.ts):

- **Summary** (lists): media type, id, English title, year, poster path, genre ids, overview,
  vote average and count, popularity. People and adult titles are dropped, repeats too.
- **Details** (one call per title): the summary plus genres, dates, end year, runtime (a
  series' usual episode, or its last one's), seasons, episodes, status, tagline, backdrop, IMDb
  id, up to 30 keywords, the top 10 cast with characters, directors (films) or creators
  (series), and up to 20 recommendations, never the title itself.
- **Scores** (OMDb): IMDb rating and votes, Rotten Tomatoes %, Metascore, each null when OMDb
  has `N/A` or nothing. "Incorrect IMDb ID" or "not found" is a not-found; any other
  `Response: "False"` (a bad key, the daily limit) is a refusal.
- An image path is kept only if it is a TMDB file name (`/abc123.jpg`), so the proxy is never
  asked for anything else.

## The cache

[cache.ts](../../server/src/sources/cache.ts), tables in [data-model.md](data-model.md). TMDB's
answers are stored as the readers left them, keyed by what was asked and the readers' version:

| Kind | Fresh for |
|---|---|
| Title details | 90 days |
| Search and list pages | 1 day |
| Genre names | 30 days |

A fresh row is served as is. A stale one is refreshed when it is next used, and served as it
was if the refresh fails. **No row is served at 180 days or older**; such rows are deleted when
the server starts and, at most once an hour, when the cache is read. No timer. A title TMDB
answers 404 for is dropped from the cache.

OMDb: a found answer is kept for good (a title's scores are asked once), a not-found one for 30
days, a refusal or failure never.

For list pages, `summaries` takes many titles and fetches at most a budget of them per call,
missing ones before stale ones, and says how many are still pending, so a page with hundreds of
ratings never waits on hundreds of calls.

## The poster proxy

`GET /v1/images/:size/:file`, behind sign-in ([images.ts](../../server/src/sources/images.ts)).
Sizes `w92`, `w185`, `w342`, `w500`, `w780`; the file a TMDB file name. Fetched from
`image.tmdb.org` only, redirects refused, at most 5 MB and 10 s, JPEG, PNG or WebP only; passed
on with `Cache-Control: private, max-age=2592000, immutable` (30 days in the browser, since a
TMDB image path changes when the image does). Nothing is stored on the server.

## Route errors

`sourceFailure` in [routes/sources.ts](../../server/src/routes/sources.ts): no key → `503
no_key`; a title TMDB doesn't have → `404 not_found`; any other source failure → `502
source_failed` (logged as a warning with the failure kind and status).

## The live check

```
npm run sources:check -w @lantern/server
npm run sources:check -w @lantern/server -- --save <a folder outside the repo>
```

Four real calls through the real clients, no cache: a search ("inception"), a film (27205), a
series (1399) and the film's OMDb scores. It prints each answer's top-level fields and what the
readers made of them; `--save` writes the raw answers for refreshing fixtures by hand. It needs
both keys and is the first step of brief 07.
