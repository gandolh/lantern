---
summary: Locked calls for Lantern, settled by the owner in a grill on 2026-11-04, each with what was rejected and why. One user and no social features; on the VPS with Ward and local accounts, no sign-up, /lantern/ and /lantern-api/ on ports 5180 and 8810, no background work; films and series, a series rated once per show; four steps plus not interested and want to watch as states; English only; no where-to-stream; TMDB with OMDb scores, every outside call made by the server, TMDB data cached six months at most; suggestions from TMDB's recommendations ranked by a plain taste profile, with reasons and no match %; rating cards that stay after the start. Read before proposing to change any of these.
updated: 2026-11-04
---

# Decisions

Each entry passed three tests: hard to reverse, surprising without context, and a real
trade-off. Changing one needs an explicit revisit and a [log.md](../log.md) entry. All were
settled by the owner in a grill on 2026-11-04; the facts behind them are in
[research.md](research.md) and [sources.md](sources.md).

## One user, no social features
_2026-11-04_. Lantern is the owner's alone: no friends, no shared lists, no match with other
people. Rejected: taste.io's friends and their match scores, which need other users and their
ratings. Each account's data is still kept apart by user id, since Ward can create a second
account.

## On the VPS, with Ward and local accounts, and no sign-up
_2026-11-04_. Like the owner's other apps: a local account made by a seed command, plus "Sign in
with Ward", and no register page. The page at `/lantern/`, the API at `/lantern-api/`; the dev
page on port 5180 and the API on loopback port 8810, both free across the estate that day.
Rejected: a local-only app, which can't be used from the phone away from home.

## No background work
_2026-11-04_. The server does work only while answering a request: no timers, no scheduled
refreshes, no open WebSockets, so the container can sleep when idle. Stale cache rows are
refreshed when a page needs them, and expired ones are deleted at start-up and when the cache
is read. Rejected: a nightly refresh of the cache or the popular lists.

## Films and series, a series rated once
_2026-11-04_. Both from the first version; a series gets one rating for the whole show. Rejected:
films only, and ratings per season, which multiply the cards and the scoring for little gain.

## Four steps, and two states that aren't ratings
_2026-11-04_. A title the owner has seen is rated awful, meh, good or amazing (taste.io's
scale). "Not interested" and "want to watch" are states of their own, not ratings, and a title
has at most one of the six at a time; rating a title on the watchlist takes it off. Rejected:
stars or 1-10, which give finer numbers than a person rates consistently; and treating not
interested as a low rating, which would punish titles never seen.

## English only
_2026-11-04_. The interface, the titles and the posters are TMDB's `en-US`; a title's
original-language or Romanian name is never shown. Rejected: Romanian first, which TMDB
covers unevenly.

## No where-to-stream in this version
_2026-11-04_. Rejected for now: TMDB's watch providers (JustWatch data for Romania). Left for
later.

## TMDB for the data, OMDb for the scores, all through the server
_2026-11-04_. TMDB gives titles, posters, genres, keywords, people and recommendations; OMDb
adds IMDb, Rotten Tomatoes and Metacritic scores on the title page, fetched once per title and
kept. Every outside call, posters included, is made by the server, through a queue and a cache;
the browser only ever talks to Lantern. TMDB's logo and its "not endorsed or certified" notice
are shown, and its data is cached six months at most. Rejected: calling TMDB from the browser,
which exposes the key and every page view; and OMDb as the main source, which has no
recommendations or keywords.

## Suggestions by plain scoring, with a reason and no match %
_2026-11-04_. The candidates are TMDB's recommended titles for everything rated good or amazing.
They are ranked by a taste profile built from the genres, keywords and people of what was rated,
likes and dislikes both, and each says why ("because you liked X"). Titles already rated, not
interested or on the watchlist never come back. Rejected: a trained model or collaborative
filtering, which TMDB's licence forbids on its data and which one user can't feed; and a match
percentage, which the owner declined.

## Rating cards for the first ratings, and after
_2026-11-04_. Cards deal popular titles one at a time; each can be rated, marked not interested,
put on the watchlist, or skipped. They are swiped on the phone (Android first, iPhone kept
working) and stay available after the start. Rejected: an onboarding that picks genres first
and then disappears.

## The estate's stack
_2026-11-04_. npm workspaces `shared`, `server` and `web`; Node 24 or later; TypeScript strict;
exact versions; Vitest; ESLint; Fastify 5, better-sqlite3 and zod; Vite with React 19 and Base
UI; ward-auth vendored from Ward's shared library. Wicket is the model for the shell and the
sign-in, Shelfmark for the server-side lookup queue and cache. Rejected: anything else, which
nobody in the estate maintains.
