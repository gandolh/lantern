# Index

The front door to Lantern's wiki and work tracker. Rules: [CLAUDE.md](CLAUDE.md). History:
[log.md](log.md). Triage on the summary lines below and open at most two or three pages.

## Wiki

<!-- BEGIN CATALOG -->

- [wiki/decisions.md](wiki/decisions.md) - Locked calls for Lantern, settled by the owner in a grill on 2026-11-04, each with what was rejected and why. One user and no social features; on the VPS with Ward and local accounts, no sign-up, /lantern/ and /lantern-api/ on ports 5180 and 8810, no background work; films and series, a series rated once per show; four steps plus not interested and want to watch as states; English only; no where-to-stream; TMDB with OMDb scores, every outside call made by the server, TMDB data cached six months at most; suggestions from TMDB's recommendations ranked by a plain taste profile, with reasons and no match %; rating cards that stay after the start. Read before proposing to change any of these.
- [wiki/glossary.md](wiki/glossary.md) - Lantern's vocabulary. Title, rating and the four steps, not interested, want to watch and the watchlist, state, card and skip, seed, taste profile, suggestion and its reason, and the sources, each with the words they replace.
- [wiki/overview.md](wiki/overview.md) - What Lantern is and what its first version does, on one page, as settled on 2026-11-04. Rate films and series on four steps, mark them not interested or want to watch, deal rating cards, search, see a title's page with OMDb scores, and get suggestions with a reason; the screens, the data kept, the sources, how suggestions are ranked, the briefs that build it (02-11), and what is left for later.
- [wiki/research.md](wiki/research.md) - Brief 01's research on taste.io and the owner's stack, closed on 2026-11-04. taste.io sits behind a Cloudflare check, so its layout came from the Wayback Machine's index and its features from news coverage (four-step scale, about 20 ratings before suggestions, a match %, a streaming filter). The stack is the estate's (npm workspaces, Fastify + SQLite, React + Vite + Base UI, vendored ward-auth). Which questions the grill settled, and which research it made moot (where to stream, MovieLens, match %, the scale comparison). The film data sources are in sources.md.
- [wiki/sources.md](wiki/sources.md) - The two outside sources Lantern's server calls, as read in their docs on 2026-11-04. TMDB (films, series, search, details with keywords, credits, external ids and recommendations in one call, the popular lists for the rating cards, genre lists, image sizes, the two kinds of key, about 40 requests a second) and OMDb by IMDb id (IMDb, Rotten Tomatoes and Metacritic scores; 1,000 calls a day; its error answers). The terms: TMDB non-commercial, logo plus the "not endorsed or certified" notice, six months of caching at most, no AI or machine learning; OMDb CC BY-NC 4.0. What still needs checking against a real call.
- [wiki/status.md](wiki/status.md) - Where Lantern stands, per area, as of 2026-11-04. Brief 01 (research) closed after the owner's grill; the first version is written as briefs 02-11 (skeleton, sign-in, states, the TMDB and OMDb clients, the container and owner setup, then the key-needing search and title page, lists, rating cards, suggestions, README). No code yet. The owner's next steps.

<!-- END CATALOG -->

## Work

- Where the work stands, per area: [wiki/status.md](wiki/status.md).
- [briefs/todo/](briefs/todo/): open work specs, run in number order.
- [briefs/done/](briefs/done/) and [briefs/superseded/](briefs/superseded/): closed specs, kept
  with their numbers.
