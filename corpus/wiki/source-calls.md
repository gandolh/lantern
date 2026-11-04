---
summary: How Lantern's server calls OMDb, as built 2026-11-04 (TMDB taken out the same day). The key setting; one queue (a call a second), single flight, the 429 retry and errors that never carry the key; the record reader and what it keeps; the record cache (found for good, not found 30 days, a refusal never); GET /v1/titles/:id/record, the only route that asks OMDb; the poster proxy (kept records only, never asks OMDb, Amazon's 760-pixel size); GET /v1/sources; the 503/502 mapping; and the one-call live check.
updated: 2026-11-04
---

# Calling OMDb

What OMDb offers, and its terms, are in [sources.md](sources.md); IMDb's files feed the pool
([titles.md](titles.md)), which needs no call at all. This page is how the server asks OMDb.
Code: [server/src/sources/](../../server/src/sources/records.ts). Every call is the server's;
the browser only talks to Lantern ([decisions.md](decisions.md)).

## The key

`OMDB_API_KEY` in `.env`, optional. Without it the server still starts, logs that it is
missing, and what needs OMDb answers `503 { code: "no_key" }`; `GET /v1/sources` says
`{ omdb }` (a boolean) so the page can say why. Errors name the source and the path, never the
query string, where the key sits.

## The queue

One queue ([queue.ts](../../server/src/sources/queue.ts)): one request at a time, each at least
a second after the last started. Kept records never queue. Two callers asking for the same
title at once share one request. A `429` waits `Retry-After` (at most 5 s) and retries once.
Requests time out after 10 s. A free key allows 1,000 calls a day, so OMDb is asked only for a
title shown in full: the title page and the card on screen.

## The record

[omdb.ts](../../server/src/sources/omdb.ts) asks `?i=<id>&plot=full` and reads leniently: title,
type, years (`2010`; `2011–2019`; `2019–` read as still running), rated, released, runtime in
minutes, genres, directors, writers (the "(screenplay)" notes dropped), actors, plot, language,
country, awards, seasons, and the three scores (IMDb rating and votes, Rotten Tomatoes %,
Metascore). `N/A` reads as none. The poster's URL is kept only if it is https on
`m.media-amazon.com`; the page never gets the URL, only whether there is a poster.
"Incorrect IMDb ID" or "not found" is a not-found; any other `Response: "False"` (a bad key,
the daily limit) is a refusal, which throws.

## The cache

[cache.ts](../../server/src/sources/cache.ts), table `omdb_records` ([data-model.md](data-model.md)):

| Answer | Kept |
|---|---|
| Found | for good: a title's details are asked once |
| Not found | 30 days, then asked again (OMDb may add it) |
| Refused or failed | never: the next view asks again |

`cached` reads a kept record without ever asking, for the poster route and for lists that show
a poster only when one is kept.

## The record route

`GET /v1/titles/:id/record` answers `{ record }` (null when OMDb doesn't know the title), from
the cache or asked once. It is the only route that ever asks OMDb; the title page calls it, and
the rating cards for the card on screen and the next one.

## The poster proxy

`GET /v1/posters/:id?size=normal|large`, behind sign-in
([routes/sources.ts](../../server/src/routes/sources.ts),
[posters.ts](../../server/src/sources/posters.ts)). It serves the poster of a title whose OMDb
record is kept, and answers 404 otherwise: **it never asks OMDb**. OMDb's poster URLs end in
Amazon's image modifiers after `._V1_` (on 2026-11-04 `._V1_QL75_UX380_CR0,0,380,562_.jpg`, 380
pixels wide); `large` swaps them for `SX760`, the same image 760 wide (checked on a real poster),
and falls back to OMDb's own URL. Fetched from `m.media-amazon.com` only, redirects refused, JPEG, PNG or WebP, at
most 5 MB and 10 s; passed on with `Cache-Control: private, max-age=2592000, immutable`.
Nothing is stored on the server.

## Route errors

`sourceFailure`: no key → `503 no_key`; any OMDb failure (the daily limit included, which the
message says) → `502 source_failed`, logged as a warning with the failure kind.

## The live check

```
npm run sources:check -w @lantern/server [-- tt0111161] [-- --save <a folder outside the repo>]
node server/dist/sources/check.js [tt0111161]      (built, from the repo root)
```

One real call (Inception, `tt1375666`, unless an id is given) through the real client and
reader, no cache. It prints the answer's fields and what the reader made of them, never the
key; `--save` writes the raw answer for refreshing a fixture by hand.
