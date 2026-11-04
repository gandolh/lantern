---
summary: Brief 01's research on taste.io and the owner's stack, closed on 2026-11-04. taste.io sits behind a Cloudflare check, so its layout came from the Wayback Machine's index and its features from news coverage (four-step scale, about 20 ratings before suggestions, a match %, a streaming filter). The stack is the estate's (npm workspaces, Fastify + SQLite, React + Vite + Base UI, vendored ward-auth). Which questions the grill settled, and which research it made moot (where to stream, MovieLens, match %, the scale comparison). The film data sources are in sources.md.
updated: 2026-11-04
---

# Research: taste.io and the stack

Written for [brief 01](../briefs/done/01-research-taste-io-and-the-first-version.md),
started 2026-10-28 and closed 2026-11-04 after the owner's grill. The data
sources Lantern builds on (TMDB, OMDb) have their own page,
[sources.md](sources.md); what was decided is in [decisions.md](decisions.md),
and the first version in one page is [overview.md](overview.md).

## taste.io

### Reading the site

On 2026-10-28 every direct read of `www.taste.io` got Cloudflare's "Just a moment..." challenge
page (HTTP 403): the fetch tool, `curl` with a browser user agent, and the local headless browser.
No account was made; the run's rules forbid sign-ups.

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

### What news coverage says

Not checked against the site itself. Sources: WRDW "What the Tech: How Taste app can help you
find a movie to watch", 2023-08-14,
<https://www.wrdw.com/2023/08/14/what-tech-how-taste-app-can-help-you-find-movie-watch>, and the
same syndicated segment on KOB and KAAL; read via search on 2026-10-28.

| Feature | What is reported | In Lantern (settled 2026-11-04) |
|---|---|---|
| Rating scale | Four steps: "awful", "meh", "good", "amazing" | Kept as is |
| First ratings | New users pick favourite films and genres, then rate; suggestions start after about 20 ratings | Rating cards deal popular titles, and stay available after the start |
| Swiping | Swipe right to love, left for "not interested" | Cards are swiped on the phone; "not interested" is a state, not a rating |
| Match % | Each title shows a percentage, from how much like-minded users liked it | Left out: the owner declined it |
| Where to stream | Shows only titles on the services you subscribe to | Not in the first version |
| Sign-up | Asks for name, phone number and birthdate | No sign-up: local accounts from a seed, and Ward |
| Price | Free on iPhone and Android | n/a |

A Dealroom profile (<https://app.dealroom.co/companies/taste>, read via search 2026-10-28) gives
Taste as a New York company founded in 2018 at thetasteapp.com, but its header calls it a dining
app, so it is not relied on.

The archived pages themselves were never read. The grill made the open points (friends, the
paid tier, how taste.io rates series) moot, so the research stopped there.

## The owner's usual stack

Read on 2026-10-28 from Shelfmark and on 2026-11-04 from Wicket, the newest app built this way.
Read only; Lantern shares no code or data with either.

- npm workspaces `shared`, `server`, `web`; Node 24 or later; TypeScript strict; exact versions
  (`save-exact=true`); Vitest; ESLint.
- `server`: Fastify 5, better-sqlite3, zod. The only module that runs SQL. Outside lookups go
  through a server-side queue and cache (Shelfmark's pattern), so the browser never calls an
  outside source.
- `web`: Vite and React 19, Base UI components, a small hand-written router.
- Sign-in: ward-auth, Ward's shared library, vendored as a built copy into `server/vendor/ward`
  and `web/vendor/ward`; local accounts made by a seed command, plus "Sign in with Ward". No
  sign-up page.
- Deploy: a container behind Caddy on the shared VPS, the app at `/<app>/` and the API at
  `/<app>-api/`, written into vps-deploy as a stack. Deploys are the owner's.

## What the grill settled (2026-11-04)

The brief's question list, answered by the owner; the reasons are in
[decisions.md](decisions.md).

- One user, the owner. No friends, no match with others.
- Deployed on the VPS with Ward and local accounts, no sign-up; `/lantern/` and `/lantern-api/`,
  dev page on port 5180, API on loopback 8810. No background work, so it can sleep when idle.
- Films and series; a series is rated once, per show.
- taste.io's four steps plus "not interested" as a separate state, and a watchlist ("want to
  watch") as a state of its own.
- English only, for the interface, titles and posters.
- Where to stream: not in this version.
- Suggestions from TMDB's recommendations, ranked by a plain taste profile, each with a reason;
  no match %.
- OMDb's IMDb, Rotten Tomatoes and Metacritic scores on the title page.
- TMDB's logo and notice shown; its data cached six months at most; every outside call made by
  the server.

## Made moot by the answers

Not researched further, and not needed for the first version:

- **Where to stream in Romania** (JustWatch data through TMDB's watch providers): left out.
- **Collaborative filtering and MovieLens**: one user has no neighbours, and TMDB's licence rules
  out a trained model on its data anyway ([sources.md](sources.md), "Terms").
- **A match %**: declined.
- **Rating scales compared** (stars, thumbs, 1-10): the owner kept taste.io's four steps.
- **Other sources** (Wikidata, the IMDb datasets, TVmaze, Trakt): TMDB covers films, series,
  recommendations, keywords and people in one API, and OMDb adds the scores.
