---
summary: Locked calls for Lantern, settled by the owner on 2026-11-04, each with what was rejected and why. One user and no social features; on the VPS with Ward and local accounts, no sign-up, /lantern/ and /lantern-api/ on ports 5180 and 8810, no background work; films and series, a series rated once per show; four steps plus not interested and want to watch as states; English only; no where-to-stream; rating cards that stay after the start. Revisited the same day - TMDB dropped (its entries kept, marked superseded): OMDb for details, posters and scores plus IMDb's non-commercial files as the title pool, imported by hand; titles keyed by IMDb id; suggestions rank the pool by a plain taste profile of genres, directors and writers, with a reason and no match %; on the cards, swipes are for the titles not seen (right want to watch, left not interested, up skip) and ratings are taps. Read before proposing to change any of these. The server in the house code structure (features, zod type provider, timeouts).
updated: 2026-11-11
---

# Decisions

Each entry passed three tests: hard to reverse, surprising without context, and a real
trade-off. Changing one needs an explicit revisit and a [log.md](../log.md) entry. All were
settled by the owner in a grill on 2026-11-04; the facts behind them are in
[research.md](research.md) and [sources.md](sources.md). Later the same day the owner dropped
TMDB; the entries that depended on it are kept below, marked superseded, and the revisit is
[at the end](#revisited-2026-11-04-tmdb-dropped).

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
covers unevenly. _Still holds after TMDB was dropped: titles are IMDb's primary title (the one
IMDb's own site shows), never the original-language one; OMDb answers in English._

## No where-to-stream in this version
_2026-11-04_. Rejected for now: TMDB's watch providers (JustWatch data for Romania). Left for
later. _With TMDB dropped, a later where-to-stream would need another source._

## ~~TMDB for the data, OMDb for the scores, all through the server~~
_Superseded 2026-11-04 by "OMDb and IMDb's files, no TMDB" below; "all through the server"
still holds._ _2026-11-04_. TMDB gives titles, posters, genres, keywords, people and recommendations; OMDb
adds IMDb, Rotten Tomatoes and Metacritic scores on the title page, fetched once per title and
kept. Every outside call, posters included, is made by the server, through a queue and a cache;
the browser only ever talks to Lantern. TMDB's logo and its "not endorsed or certified" notice
are shown, and its data is cached six months at most. Rejected: calling TMDB from the browser,
which exposes the key and every page view; and OMDb as the main source, which has no
recommendations or keywords.

## ~~Suggestions by plain scoring, with a reason and no match %~~
_Superseded 2026-11-04 by "Suggestions rank the pool" below; the reason line, the plain scoring
and no match % still hold._ _2026-11-04_. The candidates are TMDB's recommended titles for everything rated good or amazing.
They are ranked by a taste profile built from the genres, keywords and people of what was rated,
likes and dislikes both, and each says why ("because you liked X"). Titles already rated, not
interested or on the watchlist never come back. Rejected: a trained model or collaborative
filtering, which TMDB's licence forbids on its data and which one user can't feed; and a match
percentage, which the owner declined.

## Rating cards for the first ratings, and after
_2026-11-04_. Cards deal popular titles one at a time (_since TMDB was dropped: the pool's
most-voted titles not yet marked_); each can be rated, marked not interested,
put on the watchlist, or skipped. They are swiped on the phone (Android first, iPhone kept
working) and stay available after the start. Rejected: an onboarding that picks genres first
and then disappears.

## The estate's stack
_2026-11-04_. npm workspaces `shared`, `server` and `web`; Node 24 or later; TypeScript strict;
exact versions; Vitest; ESLint; Fastify 5, better-sqlite3 and zod; Vite with React 19 and Base
UI; ward-auth vendored from Ward's shared library. Wicket is the model for the shell and the
sign-in, Shelfmark for the server-side lookup queue and cache. Rejected: anything else, which
nobody in the estate maintains.

## Revisited 2026-11-04: TMDB dropped

Later on 2026-11-04 the owner said: "Drop tmdb, keep only omdb." OMDb alone has no list of
popular titles for the cards and no recommended or similar titles for suggestions. Asked what
fills that gap, the owner chose OMDb plus IMDb's free non-commercial data files. The entries
below replace the two marked superseded above; the rest stand.

## OMDb and IMDb's files, no TMDB
_2026-11-04_. OMDb gives each title's details (poster, plot, actors, director, writer, runtime)
and its three scores, asked by IMDb id, once per title, and kept. IMDb's non-commercial data
files (datasets.imdbws.com) give the pool of titles to search, deal and suggest from. Every
outside call is still the server's, posters included. Credit line on the page, word for word:
"Information courtesy of IMDb (https://www.imdb.com). Used with permission." Rejected: TMDB (the
owner's call); OMDb plus Wikidata, a weaker pool, slower queries and more code; and OMDb alone,
which leaves fixed starter cards and suggestions that never find new titles.

## A title pool imported by hand
_2026-11-04_. `npm run titles:import -w @lantern/server`, run by the owner (about monthly),
streams `title.basics`, `title.ratings` and `title.crew` over HTTP, parses them line by line
without keeping the downloads, and keeps films and series above a vote threshold
([titles.md](titles.md)): IMDb id, title, years, genres, rating, votes, director and writer ids.
A re-run replaces the pool in one transaction and never touches the states. Rejected: a timer
or a background refresh (no background work); `title.principals` and `name.basics` (about
1.1 GB together), since the reason line names a title, not a person, and names on the title
page come from OMDb.

## Titles are IMDb ids
_2026-11-04_. A title is its IMDb id (`tt…`) everywhere: the states, the pool, OMDb's cache,
the page's addresses. Rejected: keeping TMDB's ids, which nothing else uses now.

## OMDb only for what is shown
_2026-11-04_. A free OMDb key allows 1,000 calls a day, so OMDb is asked only for a title about
to be shown in full: the title page, and the card on screen. Lists (search, watchlist, ratings,
suggestions) draw from the pool and show a poster only when its OMDb record is already cached.
A found record is kept for good. Rejected: enriching whole lists from OMDb, which would spend
the day's calls in a few pages.

## Suggestions rank the pool
_2026-11-04_. Every title in the pool without a state is a candidate. A taste profile is built
from the genres, directors and writers of everything rated, likes and dislikes both, and ranks
them; each suggestion says "because you liked X", X being the rated title that adds the most to
its score. Plain arithmetic: TMDB's AI rule no longer applies, but the owner's choice of plain
scoring stands. No match %. Rejected: a trained model; and similarity from IMDb's people file,
which the pool leaves out.

## Swipes on the cards are for the titles not seen
_2026-11-04_, taken while building the cards (the owner asked for swiping, not for a mapping).
Right is want to watch, left is not interested, up is skip; the four ratings are taps, on big
buttons under the card. Every choice also has a button, and Undo takes the last one back. The
cards deal the best-known titles, so a quick "not seen, want it / not for me / no opinion"
deserves a gesture, while a rating is a choice among four that a swipe can't carry. Rejected:
taste.io's right for love (it collapses four steps into one), and swiping to rate good or meh
(two of four ratings on a gesture, the other two hidden).

## The house style, formatted and checked
_2026-11-11_. Lantern adopts the estate's quality harness: Prettier at width 120 (one commit
reformatted 52 files, 199 old lines), the house ESLint config with six typed rules through
`projectService`, `verbatimModuleSyntax` and `erasableSyntaxOnly`, and `npm run check` as the gate.
The configs are a vendored copy of the skills library's `house-style` folder, refreshed by
`npm run house-style:sync`, because the image's `npm ci` runs without git and a git dependency would
need it. For the same reason `tsconfig.base.json` holds the house flags itself: the image copies
only that file before `tsc -b server`. Markdown stays out of Prettier. Rejected: width 150, which
fits Lantern's wide lines but splits the estate in two; a vitest alias in place of `pretest`, which
would test source the server never ships.

## Base UI for the filter, the picker and the tabs, hand-built where it has no part
_2026-11-11_. Lantern declared `@base-ui/react` and used none of it; three kinds of hand-built button
rows (the kind filter in four copies, the state picker, the ratings tabs) had no keyboard model beyond
Tab. They moved onto Base UI wrappers in `web/src/components/ui/`: the filter a `RadioGroup` (nothing
is saved, so arrows choose), the picker a `ToggleGroup` whose arrow keys only move focus (a choice is a
write), the ratings tabs `Tabs` with `activateOnFocus`. The swipe card, the rating actions, the undo
notice and the text inputs stay hand-built or native. Rejected: a `ToggleGroup` for the filter (the
estate's rule gives a filter arrows that choose), a Base UI toast for the undo notice (it would time out
on a list people scroll), and keeping the `/rate` filter as plain buttons to spare the key handler.
The key guard skips radio groups and tab strips but not a plain `role=group`, because the rating buttons
sit in one. See [web-app.md](web-app.md).

## Tailwind on the family's token names, Lantern's values
_2026-11-11_. The page's one plain stylesheet (933 lines, 92 classes) became Tailwind 4.3.5 utilities on
the estate's rule that whole apps move. The token names are the small-tools family's (`page`, `surface`,
`ink`, `ink-muted`, `line`, `accent`, `danger`, the radii `control`, `card` and `pill`), which Wicket and
the-board share; the values stay Lantern's warm palette, and Lantern-only tokens take the same namespaces.
Tailwind's own colour, type, radius, shadow, container and breakpoint scales are cleared, so only these
names exist. Colours are `light-dark()` pairs and `color-scheme` follows `data-theme` on `<html>`, so the
Light / Dark / System switch (light on a first visit, kept in `localStorage`) needs no `dark:` class and
System follows the operating system in CSS. Type is a named scale at the old 15 px root's pixels, with the
15 px on `body` (`html` keeps the reader's size). Rejected: keeping Lantern's own names (`--bg`, `--text`)
until the redesign, which would split the family's naming; Tailwind's default scales alongside the tokens,
which lets an off-palette colour in unseen; and a `[data-theme="dark"]` block redefining every colour, which
the skill's `light-dark()` makes unnecessary. Revisits the earlier line "dark mode follows the system".

## The server in the house code structure
_2026-11-11_. The server moved from a layer split (`routes/`, `pool/`, `sources/`, `suggest/` and a flat
root) to the estate's code structure: `server.ts` listens and `app.ts` builds, `config.ts` is the one
reader of the environment, cross-cutting plugins in `plugins/` wrapped in `fastify-plugin`, one folder
per domain under `features/<name>/` used through its `index.ts`, and a zod schema on every route through
`@fastify/type-provider-zod`, so a field the schema doesn't name never leaves the server. The error body
stays Lantern's `{ code, message }`, which the page parses. Tests pass dependencies as plugin options
(`buildTestApp`), with no decorators as a test seam. Rejected: keeping the layer split, which scatters one
domain over four folders; `@fastify/autoload`, which hides the registration order that is the
architecture; TypeBox, because the contract is already zod in `shared/`. Two settings are Lantern's own:
`connectionTimeout` is 45 s, because it cuts a response still being computed and the record route waits
in the OMDb queue and on a slow call for about 26 s with no byte sent (a 20 s run completed at 45 s and
was cut at 10 s); `keepAliveTimeout` is 125 s, above Caddy's two-minute idle keep-alive. A route declares
only the statuses its own handler sends: a declared 401 would run the session guard's reply through the
serializer. The poster route sends image bytes, so it has no response schema.
