# Log

## [2026-10-27] start | Folder and brief 01

The owner asked for a local folder for an app like taste.io: pick a film, rate how much you liked
it, and get suggestions from what you liked and watched. The remote repository comes later.
[Brief 01](briefs/done/01-research-taste-io-and-the-first-version.md)
is research and ends in a proposed first version; the grill comes when work starts.

## [2026-10-27] name | Lantern

The folder started as "matinee", a working name. The owner picked Lantern the same day, in line
with the other apps' names (satchel, postern, atrium, almanac): the magic lantern was the
projector before cinema.

## [2026-10-28] research | Brief 01 started, stopped partway

A full-auto run started brief 01 and stopped when the session ran out. taste.io answers every
direct read with a Cloudflare check, so its layout came from the Wayback Machine's index and its
features (four-step scale awful/meh/good/amazing, about 20 ratings before suggestions, a match %,
streaming filter) from news coverage. The owner's stack was read from Shelfmark. Findings and a
starting grill list are in [wiki/research.md](wiki/research.md); the data sources, suggestion
methods, rating scales and the proposal are left. No key was registered or used. The brief stays
in todo/ with a note.

## [2026-11-02] maintenance | Briefs reset

Part of an estate-wide reset in which every repo folded its done briefs into its wiki and restarted
numbering at 01. Lantern had none done, so brief 01 keeps its number. [wiki/status.md](wiki/status.md)
gives a dated line per area instead of one per brief, and [CLAUDE.md](CLAUDE.md) gains the rule that
code comments don't cite brief numbers.

## [2026-11-04] decision | The owner registers TMDB and OMDb keys

In a grill, after reading what each costs: both are free for a personal app. The owner registers a
TMDB account and an OMDb key and puts them in `.env` as `TMDB_API_KEY` and `OMDB_API_KEY`; brief 01
resumes with real calls then. TMDB's licence forbids AI or machine-learning use of its data, so the
suggestions stay plain scoring. The terms, with links and the date read, are in
[wiki/research.md](wiki/research.md).

## [2026-11-04] done | Brief 01: research closed, the first version in briefs 02-11

The owner's grill answered brief 01's questions: one user; on the VPS with Ward and local
accounts at `/lantern/` and `/lantern-api/` (ports 5180 and 8810), no background work; films and
series rated once per show; four steps plus not interested and want to watch; English only; no
where-to-stream; suggestions from TMDB's recommendations ranked by a plain taste profile, with
reasons and no match %; rating cards; OMDb scores on the title page; TMDB's credit and six-month
cache rule. Recorded in [wiki/decisions.md](wiki/decisions.md), with
[wiki/glossary.md](wiki/glossary.md) and [wiki/overview.md](wiki/overview.md). The TMDB and OMDb
docs were read for the endpoints the build needs ([wiki/sources.md](wiki/sources.md)); no real
call yet. Briefs 02 to 11 written, ordered so 02-06 need no key. The corpus gained a lint script.
See [briefs/done/01-research-taste-io-and-the-first-version.md](briefs/done/01-research-taste-io-and-the-first-version.md).

## [2026-11-04] done | Brief 02: the skeleton

npm workspaces `shared`, `server` and `web` on Wicket's pins. The server reads its settings
(port 8810, `/lantern-api`, `/lantern/`), opens the SQLite file with versioned migrations, and
answers `GET /v1/health`; the page has its frame (top bar on wide screens, tab bar on the phone)
and five placeholder sections on Vite's port 5180. Walked in a browser at desktop and phone
widths. See [briefs/done/02-skeleton.md](briefs/done/02-skeleton.md) and
[wiki/architecture.md](wiki/architecture.md).

## [2026-11-04] done | Brief 03: sign-in

ward-auth 0.7.0 vendored from Ward's built library (byte-identical to Wicket's copy, no change in
the Ward repo). Local accounts from `npm run seed -w @lantern/server`, Sign in with Ward when the
five `WARD_OIDC_*` are set, no sign-up or rename; every `/v1` route but health needs a session,
and writes refuse other sites. The login page, the gate (which returns to the page you were
headed for) and the account page. Local sign-in walked in a browser; Ward not, since `.env` had
no Ward lines yet. See [wiki/sign-in.md](wiki/sign-in.md) and
[briefs/done/03-sign-in.md](briefs/done/03-sign-in.md).

## [2026-11-04] done | Brief 04: states

`title_states` (one state per user and title: a rating, not interested or want to watch) and
`card_skips`, with no TMDB facts in either, so the six-month cache rule never reaches the
owner's ratings. Routes to set, clear, list (newest first, cursor-paged) and count, and to skip
and unskip. See [wiki/data-model.md](wiki/data-model.md) and
[briefs/done/04-states-store.md](briefs/done/04-states-store.md).

## [2026-11-04] done | Brief 05: the TMDB and OMDb clients, the cache, the poster proxy

The server's door to the sources: one queue per source, single flight, a 429 retry, errors that
never carry a key, and TMDB's key read as either kind. Lenient readers keep only what Lantern
shows or scores. The cache serves fresh rows, refreshes stale ones on use, and never serves
TMDB data past 180 days; OMDb answers are kept once found. Posters come through
`/v1/images/:size/:file`. Built and tested on hand-written fixtures only: the live check,
`npm run sources:check -w @lantern/server`, waits for the keys. See
[wiki/source-calls.md](wiki/source-calls.md) and
[briefs/done/05-tmdb-and-omdb-clients.md](briefs/done/05-tmdb-and-omdb-clients.md).

## [2026-11-04] done | Brief 06: the container and the owner's setup

One container, `lantern-api`, from `infrastructure/` (compose project `lantern`, loopback 8810,
`/data` bind-mounted). `docs/owner-setup.md` holds the Ward registration, the three secrets by
name, the vps-deploy stack table and the owner's steps. The compose file parses; the image was
not built on the shared machine. Everything that needs no key is now built; brief 07 waits for
the keys. See [briefs/done/06-container-and-owner-setup.md](briefs/done/06-container-and-owner-setup.md).

## [2026-11-04] pause | The owner drops TMDB; replan in progress, run paused

Later on 2026-11-04 the owner said "Drop tmdb, keep only omdb", and chose OMDb plus IMDb's free
non-commercial data files to fill the gap (a title pool for search, the cards and the
suggestions). The owner then paused the run. Where it stands, for the resume:

- **Done and committed:** briefs 01-06 (`60179cd`, `7679b40`, `79e992a`, `f5df29c`, `ddca44f`,
  `1b1c067`). Brief 05's TMDB client is still in the code and is to be removed.
- **In progress, not committed (left in the tree):** the replan. Edited: `wiki/decisions.md`
  (the TMDB entries marked superseded, a "Revisited" section with the owner's words and five new
  entries), `wiki/sources.md` (rewritten for IMDb's files and OMDb, with IMDb's terms and credit
  line read 2026-11-04), `wiki/overview.md` (the new plan, briefs 07-14), `wiki/glossary.md`,
  `wiki/research.md` (a note), and the new `wiki/titles.md` (the pool, as planned).
- **Left of the replan:** rewrite briefs 07-11 and write 12-14 as `wiki/overview.md`'s table
  lists them (07 drop TMDB: IMDb ids, the full OMDb record, posters from OMDb; 08 the pool
  import; 09 search over the pool; 10 cards; 11 suggestions; 12 watchlist and ratings pages; 13
  the title page and the first real OMDb calls; 14 README); drop `TMDB_API_KEY` from
  `.env.example`; update `wiki/status.md`; regenerate the index and lint; commit; run
  `brief-board sync` from /tmp.
- **Then build** 07 to 14 in order. The owner has created `.env` with `OMDB_API_KEY` (the Ward
  lines are empty), so brief 13 can make real OMDb calls; `.env` is the owner's and is never
  edited.
- **Choices so far:** vote threshold 1,000 IMDb votes, to be checked against the counts the
  real import prints at 500, 1,000, 2,000 and 5,000; `tvMovie` kept, as a film; no OMDb search
  fallback in the first version (search covers the pool only; listed under "Later"); the pool's
  size is unknown until the one real import runs (not run yet). States move to IMDb ids through a
  new migration that drops and recreates `title_states` and `card_skips` and drops `tmdb_cache`
  (no real data exists yet).

## [2026-11-04] decision | TMDB dropped: OMDb plus IMDb's files; briefs 07-14 rewritten

The owner: "Drop tmdb, keep only omdb", then chose IMDb's free non-commercial files to fill the
gap OMDb leaves (rejected: OMDb plus Wikidata, and OMDb alone). [wiki/decisions.md](wiki/decisions.md)
marks the TMDB entries superseded and adds a "Revisited" section: OMDb and IMDb's files, a title
pool imported by hand, titles keyed by IMDb id, OMDb asked only for what is shown, suggestions
ranking the pool. IMDb's terms read the same day: personal and non-commercial use, and a credit
line ([wiki/sources.md](wiki/sources.md), [wiki/titles.md](wiki/titles.md)). Briefs 07-11 were
rewritten in place and 12-14 added: 07 drop TMDB, 08 the pool import, 09 search, 10 the OMDb
title page (the first real calls), 11 cards, 12 suggestions, 13 lists, 14 README.
`TMDB_API_KEY` is gone from `.env.example`. The owner resumed the paused run; `.env` holds
`OMDB_API_KEY`.

## [2026-11-04] done | Brief 07: TMDB out; IMDb ids, the OMDb record, posters from OMDb

Brief 05's TMDB client, cache and poster route removed, with `TMDB_API_KEY`. Migration 3
rebuilds the states on IMDb ids and keeps OMDb's whole record per title (found for good, not
found 30 days, a refusal never). Posters come through `/v1/posters/:id`, for titles whose
record is kept, never asking OMDb. Fixtures only. See
[wiki/source-calls.md](wiki/source-calls.md) and
[briefs/done/07-drop-tmdb-imdb-ids-omdb-record.md](briefs/done/07-drop-tmdb-imdb-ids-omdb-record.md).

## [2026-11-04] done | Brief 08: the title pool, imported from IMDb's files

`npm run titles:import -w @lantern/server` (in the container `node server/dist/pool/cli.js`)
streams `title.ratings`, `title.basics` and `title.crew` and replaces the pool in one
transaction. Films (with `tvMovie`) and series with 1,000 votes or more: 65,732 titles on
2026-11-04, 32 s, 14.5 MiB. The one real run peaked at 665 MiB because kept fields pinned their
read chunks (V8 sliced strings); copying them cut a synthetic run from 565 to 246 MiB. IMDb's
credit line is in the footer and on the account page. See [wiki/titles.md](wiki/titles.md) and
[briefs/done/08-title-pool-import.md](briefs/done/08-title-pool-import.md).

## [2026-11-04] done | Brief 09: search over the pool, the state picker, the title page

`GET /v1/search` and `GET /v1/titles/:id` read the pool only. The search page (query in the
address, a kind filter), the state picker (tap again to clear) and a title page from the pool's
facts. Walked on the real pool. See
[briefs/done/09-search-over-the-pool.md](briefs/done/09-search-over-the-pool.md).

## [2026-11-04] done | Brief 10: the title page with OMDb, the first real calls

`GET /v1/titles/:id/record`, the only route that asks OMDb, and the title page with OMDb's
poster, plot, people and three scores. The live check matched the reader; OMDb's poster URLs
had changed form, so the large size now swaps any Amazon modifier for 760 pixels. Three real
OMDb calls in all. See [briefs/done/10-title-page-with-omdb.md](briefs/done/10-title-page-with-omdb.md).

## [2026-11-04] done | Brief 11: the rating cards

`GET /v1/cards` deals the pool's most-voted unmarked titles; the cards page asks OMDb for the
card on screen and the next only. Swipes are for titles not seen (right want to watch, left not
interested, up skip), ratings are taps; Undo and keys. Walked with pointer drags on an emulated
phone; six OMDb calls. See [briefs/done/11-rating-cards.md](briefs/done/11-rating-cards.md).

## [2026-11-04] done | Brief 12: suggestions from the pool

The home page ranks the pool by a taste profile of genres, directors and writers, likes and
dislikes both, with "Because you liked X". The first real run showed a series' episode crowd
swamping everything, so each title's weight is now spread over its features of a kind. About
40 ms per request. See [wiki/suggestions.md](wiki/suggestions.md) and
[briefs/done/12-suggestions.md](briefs/done/12-suggestions.md).

## [2026-11-04] done | Brief 13: the watchlist and ratings pages

`GET /v1/lists/:list` joins the states with the pool (or OMDb's kept record for a title the
import dropped). The watchlist and the ratings pages, with tabs and counts, changes in place and
Undo. See [briefs/done/13-watchlist-and-ratings-pages.md](briefs/done/13-watchlist-and-ratings-pages.md).

## [2026-11-04] done | Brief 14: the README and the docs; the first version is built

The README describes Lantern as built, with IMDb's credit and OMDb's, and local development
including the title import. `docs/owner-setup.md` was checked against the code for the
vps-deploy stack: `lantern-api` on loopback 8810, data at `/data`, two secrets, the seed and the
import as `node server/dist/…` inside the container. Briefs 01 to 14 are done; nothing is
deployed. See [briefs/done/14-readme-and-docs.md](briefs/done/14-readme-and-docs.md) and
[wiki/status.md](wiki/status.md).

## [2026-11-10] todo | Briefs 15-18: the estate's three calls, specified for Lantern

Four briefs for the owner's calls of 2026-11-09, written from measurements on a scratch copy:
15 the house style and harness (Prettier churn by width, 5 `erasableSyntaxOnly` errors, 29
non-null `!`, 4 other typed-lint findings, a missing `pretest`: 10 of 18 test files fail on a
fresh clone), 16 Base UI by the conventions (declared but unused; three hand-built widget kinds
to adopt; no bump brief since 1.9.0 is pinned), 17 the web app to Tailwind (21 token names in 38
definitions, a 15 px root with rem type, the 760 px breakpoint), 18 the server in the code
structure (17 routes, four copies of the repo-root and `.env` read, `connectionTimeout` sized for
OMDb). `.claude` and `scripts` added to `.planned-roots`. See [briefs/todo/](briefs/todo/) and
[wiki/status.md](wiki/status.md).

## [2026-11-10] brief | Briefs 15-18 revised to the owner's answers; brief 19 added

The owner's grilling of 2026-11-10 answered the open questions the briefs were built on. Brief 15:
`house-style` is vendored (no git dependency, so the Dockerfile is untouched), Prettier width 120
(201 lines in 50 files as the one-off reformat, replacing the 150 default). Brief 16: Lantern
adopts Base UI (Q22); the kind filter is a `RadioGroup`, the state picker a guarded `ToggleGroup`
that still allows clearing, the ratings tabs `Tabs`; jsdom only for the guarded wrapper. Brief 17:
family token names `page`, `surface`, `ink`, `accent`, `line`, `danger`, a Light / Dark / System
switch on `data-theme` (light first, with the `theme-color` meta following it), the 15 px on
`body` with px type tokens, "close enough" parity. Brief 18: the poster route is exempt from
response schemas with a `conventions.json` entry, the CLIs sit beside their feature, the test
decorators go (`buildTestApp`, plugin options), the start command is Lantern's own (Q1), and the
26 s record route keeps its `connectionTimeout` of 45 s. Brief 19 is new: a redesign with Hallmark
on the estate board. Work happens on `main`, with no PRs. Nothing was changed outside `corpus/`.

## [2026-11-11] brief | 15: the house style and the quality harness

Adopted house-style 1.0.0 (vendored, `npm run house-style:sync`), Prettier at 120 (52 files, 856 lines
in, 199 out, in one commit), the two tsconfig flags (5 parameter properties became fields), the house
ESLint config (16 source `!`, 3 needless casts and 1 open-union switch fixed; 12 test `!` and 6
`process.env` reads left as warnings), `check`, `check:fast`, `check:conventions` (knip,
dependency-cruiser strict with no violation, the two checkers `--warn-only`), `pretest`, the root
`CLAUDE.md` and `.claude/rules/`. `check` 31 s, `check:fast` 5.6 s warm. Details in the brief's outcome note.
