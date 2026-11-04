---
summary: Brief 01's research, partial. Stopped on 2026-10-28 after step 1 (taste.io) was only half done and the owner's stack was read from Shelfmark. taste.io is behind a Cloudflare check that blocked every direct read; what is known comes from news coverage and the Wayback Machine's index. Steps 2-5 (data sources, suggestions, rating, the proposal) are not started.
updated: 2026-11-04
---

# Research: taste.io, film data and suggestions (partial)

Written for [brief 01](../briefs/todo/01-research-taste-io-and-the-first-version.md). The run
stopped early on 2026-10-28 because the session ran out. This page holds what was found; the
section "Where it stopped" lists the rest.

## 1. taste.io (half done)

### Reading the site

On 2026-10-28 every direct read of `www.taste.io` got Cloudflare's "Just a moment..." challenge
page (HTTP 403): the fetch tool, `curl` with a browser user agent, and the local headless browser
(which failed to start for an unrelated permission error). No account was made; the run's rules
forbid sign-ups.

The Wayback Machine's index (its CDX API, keyless, read 2026-10-28) answers for `taste.io/*` and
shows how the site is laid out. Snapshots run to at least 2026-07-04, so the site was live then.
The archived paths:

- `/movies/<slug>`: one page per film, slug = title, year and a short id
  (`/movies/the-departed-2006-H1n7-SuQnQf`).
- `/movies/like/<slug>`: "movies like X" pages, the most archived kind (118 distinct URLs in the
  first 3,000 rows).
- `/movies/matches`: the personal match list.
- `/browse/` (108 URLs, including `/browse/4.5`), which looks like browsing by score.
- `/tv/...`: series have their own section.
- `/about`, and `explore` data files from a Next.js front end.
- One archived campaign is named `match-percentage` (`utm_campaign=match-percentage`, 2025-08-23),
  so the match percentage is what they advertise.

The archived pages themselves were not read yet; that is the next step (see below).

### What news coverage says

Not checked against the site itself. Sources: WRDW "What the Tech: How Taste app can help you
find a movie to watch", 2023-08-14,
<https://www.wrdw.com/2023/08/14/what-tech-how-taste-app-can-help-you-find-movie-watch>, and the
same syndicated segment on KOB and KAAL; read via search on 2026-10-28.

| Feature | What is reported | What it would take in Lantern |
|---|---|---|
| Rating scale | Four steps: "awful", "meh", "good", "amazing" | A four-value field per title; trivial |
| First ratings | New users pick favourite films and genres, then rate; suggestions start after about 20 ratings | An onboarding queue of well-known titles, ordered by popularity within the picked genres |
| Swiping | Swipe right to love, left for "not interested" | A card view on the phone; "not interested" is a fifth state, not a rating |
| Match % | Each title shows a percentage, from how much like-minded users liked it | Needs many users' ratings, or a public dataset; see step 3 (not done) |
| Where to stream | Shows only titles on the services you subscribe to | Needs a watch-provider source for Romania; see step 2 (not done) |
| Sign-up | Asks for name, phone number and birthdate | Lantern would use its own login or Ward |
| Price | Free on iPhone and Android | n/a |

A Dealroom profile (<https://app.dealroom.co/companies/taste>, read via search 2026-10-28) gives
Taste as a New York company founded in 2018 at thetasteapp.com, but its header calls it a dining
app, so it is not relied on.

Not yet found: friends and their matches, the watchlist, how series are rated (per show or per
season), and whether there is a paid tier.

## The owner's usual stack (read from Shelfmark, 2026-10-28)

Read only, to describe the stack; nothing is shared with Shelfmark. Shelfmark
(`shelfmark`, `package.json` files and `corpus/wiki/architecture.md`):

- npm workspaces `shared`, `server`, `web`; Node 24 or later; TypeScript strict; exact versions;
  Vitest; ESLint.
- `server`: Fastify 5, better-sqlite3, zod. The only module that runs SQL. Lookups go through a
  server-side queue and cache, so the browser never calls an outside source.
- `web`: Vite and React 19, a PWA (vite-plugin-pwa, Workbox), Base UI components.
- Sign-in: a vendored `ward-auth` Fastify plugin, local login plus "Sign in with Ward".
- Deploy: a container behind Caddy on the shared VPS, the app at `/<app>/*` and the API at
  `/<app>-api/*`, deployed by `vps-deploy`. Deploys are the owner's.
- Shelfmark's lookup-then-confirm flow: a lookup returns a draft from the cache or the outside
  sources, the user edits and saves it. Lantern could copy the pattern (search a title, confirm
  it, then rate) without sharing code or data.

## Where it stopped

Done: the taste.io site map from the Wayback index, the news-coverage feature list above, the
stack. No API was called; no key was used or written.

Left, in order:

1. **taste.io:** fetch two or three archived pages through the Wayback Machine with `curl` (a
   film page, `/movies/matches`, `/about`, and the `movies/like/inception-...json` data file) to
   confirm the scale, the match % and the series handling. Look for friends, watchlist and a paid
   tier.
2. **Data sources:** TMDB, OMDb, Wikidata, the IMDb non-commercial datasets, TVmaze, Trakt and
   JustWatch: coverage, Romanian titles and posters, "similar" lists, watch providers for Romania,
   rate limits, caching terms, attribution, and keys. Each terms claim cited with its page and the
   date read. Real calls only where no key is needed (Wikidata, TVmaze); the run's rules forbid
   registering keys, so the TMDB and OMDb calls the brief asks for wait for the owner.
3. **Suggestions:** the three methods at 50, 200 and 1,000 ratings, which can explain itself, and
   the MovieLens licence for a personal app.
4. **Rating:** taste.io's four steps against stars, thumbs and 1-10.
5. **The one-page proposal** and the grill list.

## Grill questions so far

A starting list, from the brief and the coverage above; the proposal will sharpen it.

- One user, a household, or friends with match scores?
- Films only, or series too from the start? Rated per show or per season?
- Romanian or English first, for the interface and for titles and posters?
- Local only, or deployed with Ward sign-in?
- Keep taste.io's four steps (awful, meh, good, amazing) plus "not interested", or another scale?
- Show where to stream in Romania in the first version, or later?
- ~~May the owner register a TMDB key?~~ Answered 2026-11-04: the owner registers both a TMDB
  and an OMDb key (see "Keys and terms" below); the research resumes once they are in `.env`.
- Does TMDB's attribution (its logo and the "not endorsed" notice) fit the design?

## Keys and terms (read 2026-11-04)

The owner registers both keys, in the local `.env` as `TMDB_API_KEY` and `OMDB_API_KEY`
(never committed). What the terms say, read on 2026-11-04:

- **TMDB** ([API terms of use](https://www.themoviedb.org/api-terms-of-use)): free for
  non-commercial use; commercial use needs a separate paid agreement. The app must show TMDB's
  logo and a notice that it is not endorsed or certified by TMDB. Data may be cached for at most
  six months. The terms set no rate limit (TMDB's developer docs give roughly 50 requests a
  second). The licence forbids using TMDB or its content "in connection with, including for
  training," an AI or machine-learning application, so Lantern's suggestions built on TMDB data
  stay plain scoring (TMDB's own similar and recommended lists, genre, keyword and people
  weights), not a trained model. Where-to-stream data comes from JustWatch and is credited to it.
- **OMDb** ([API keys](https://www.omdbapi.com/apikey.aspx)): a free key allows 1,000 requests a
  day and is sent by email; Patreon tiers add more (their limits and prices aren't on the page).
  IMDb-style data in English with IMDb, Rotten Tomatoes and Metacritic scores; no similar lists and
  no Romanian titles, so it is an extra for scores, not the main source.
