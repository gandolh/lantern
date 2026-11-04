---
summary: Where Lantern stands, per area, as of 2026-11-04. Research closed after the owner's grill; the first version is briefs 02-11, of which 02-04 (skeleton, sign-in, states) are built. What is open, the todos (bump @fastify/static), and the owner's next steps.
updated: 2026-11-04
---

# Status

_2026-11-04_. Brief 01 is done: the owner settled the first version in a grill
([decisions.md](decisions.md)), and it is written as briefs 02 to 11
([overview.md](overview.md), "The build"). The owner pushes; nothing here is deployed.

## By area

- **Skeleton** (2026-11-04). Workspaces, settings, the SQLite file with migrations, `GET
  /v1/health`, the page's frame with five placeholder sections at `/lantern/`, dev on 5180 and
  8810 ([architecture.md](architecture.md)).
- **Sign-in** (2026-11-04). ward-auth 0.7.0 vendored; local accounts from the seed, Sign in
  with Ward when the five `WARD_OIDC_*` are set, no sign-up; every `/v1` route but health needs
  a session, and writes refuse other sites ([sign-in.md](sign-in.md)). Ward not yet walked
  locally: Lantern's `.env` had no `WARD_OIDC_*` lines on 2026-11-04.
- **States** (2026-11-04). Ratings, not interested, want to watch and skipped cards, per user,
  with no TMDB facts in them; set, clear, list and count over `/v1`
  ([data-model.md](data-model.md)). No page uses them yet.
- **Research** (2026-10-28 to 2026-11-04, done). taste.io and the stack in
  [research.md](research.md); TMDB and OMDb, their endpoints and terms, in
  [sources.md](sources.md). No real call made yet.

## Open briefs

05 to 11, in `briefs/todo/`, run in number order. 05 and 06 need no key; 07 opens with the first
real TMDB and OMDb calls.

## Todos

- Move `@fastify/static` to 10.1.9 or later once it is two weeks old (about 2026-11-18): it
  clears the moderate `glob` and `minimatch` advisories `npm audit` reports.

## Next (owner)

- Run Ward's local seed once Lantern is in it (the Ward repo's own brief), so `.env` gains the
  five `WARD_OIDC_*` lines, then try "Sign in with Ward" at <http://localhost:5180/lantern/>.
- Create `.env` from `.env.example` and fill `TMDB_API_KEY` and `OMDB_API_KEY` (registered on
  2026-11-04). Either TMDB value works: the API key or the API Read Access Token.
