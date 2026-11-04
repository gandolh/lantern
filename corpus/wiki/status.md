---
summary: Where Lantern stands, per area, as of 2026-11-04. Research closed after the owner's grill; the first version is briefs 02-11, of which the skeleton (02) is built. What is open, the todos (bump @fastify/static), and the owner's next steps.
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
- **Research** (2026-10-28 to 2026-11-04, done). taste.io and the stack in
  [research.md](research.md); TMDB and OMDb, their endpoints and terms, in
  [sources.md](sources.md). No real call made yet.

## Open briefs

03 to 11, in `briefs/todo/`, run in number order. 03 to 06 need no key; 07 opens with the first
real TMDB and OMDb calls.

## Todos

- Move `@fastify/static` to 10.1.9 or later once it is two weeks old (about 2026-11-18): it
  clears the moderate `glob` and `minimatch` advisories `npm audit` reports.

## Next (owner)

- Create `.env` from `.env.example` and fill `TMDB_API_KEY` and `OMDB_API_KEY` (registered on
  2026-11-04). Either TMDB value works: the API key or the API Read Access Token.
