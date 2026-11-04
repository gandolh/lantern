---
summary: Where Lantern stands, per area, as of 2026-11-04. Briefs 01-13 built (skeleton, sign-in, states, container, TMDB taken out for OMDb and IMDb ids, the title pool import, search, the OMDb title page, the rating cards, suggestions, the lists); the owner dropped TMDB the same day for OMDb plus IMDb's files, so 07-14 were rewritten (the README to come). What is open, the todos (bump @fastify/static), and the owner's next steps.
updated: 2026-11-04
---

# Status

_2026-11-04_. Brief 01 is done: the owner settled the first version in a grill
([decisions.md](decisions.md)). Later that day the owner dropped TMDB for OMDb plus IMDb's
non-commercial files ([decisions.md](decisions.md), "Revisited"), and the plan became briefs 07
to 14 ([overview.md](overview.md), "The build"). The owner pushes; nothing here is deployed.

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
- **OMDb** (2026-11-04). TMDB taken out; titles are IMDb ids. The OMDb client reads a title's
  whole record and keeps it once found; posters come through `/v1/posters/:id` from kept
  records only ([source-calls.md](source-calls.md)). Checked against real answers: 3 calls on
  2026-11-04. The title page shows the poster, plot, people and the three scores.
- **Container and owner setup** (2026-11-04). `infrastructure/` holds the API's Dockerfile and
  a compose file (`lantern-api` on loopback 8810); `docs/owner-setup.md` is the vps-deploy
  stack's brief. The compose file parses; the image was not built on the shared machine.
- **Watchlist and ratings pages** (2026-11-04). `GET /v1/lists/:list`; the watchlist, and the
  ratings by step with not interested as a tab, counts on each; change in place, a title that
  leaves the list can be undone.
- **Suggestions** (2026-11-04). The home page: the pool ranked by a taste profile of genres,
  directors and writers, each with "Because you liked X"; about 40 ms on the real pool
  ([suggestions.md](suggestions.md)).
- **Rating cards** (2026-11-04). `GET /v1/cards` deals the pool's most-voted titles without a
  state or a skip; the cards page asks OMDb for the card on screen and the next one only. Swipe
  right want to watch, left not interested, up skip; ratings are taps; Undo and keys (1-4,
  arrows, Z) ([decisions.md](decisions.md)).
- **Search and the title page** (2026-11-04). `GET /v1/search` over the pool (exact title first,
  then prefix, then the rest, most-voted first; accents and case ignored), `GET /v1/titles/:id`;
  the search page, the state picker (four ratings, want to watch, not interested; tap again to
  clear) and a title page from the pool's facts. No outside call.
- **Title pool** (2026-11-04). `npm run titles:import -w @lantern/server` (in the container:
  `node server/dist/pool/cli.js`) streams IMDb's files into `titles`; 65,732 titles at 1,000
  votes on 2026-11-04 ([titles.md](titles.md)). IMDb's credit line in the footer and on the
  account page.
- **Research** (2026-10-28 to 2026-11-04, done). taste.io and the stack in
  [research.md](research.md); TMDB and OMDb, their endpoints and terms, in
  [sources.md](sources.md). No real call made yet.

## Open briefs

14, in `briefs/todo/`, run in number order, rewritten on 2026-11-04 after TMDB was
dropped.

## Todos

- Move `@fastify/static` to 10.1.9 or later once it is two weeks old (about 2026-11-18): it
  clears the moderate `glob` and `minimatch` advisories `npm audit` reports.

## Next (owner)

In this order; the details are in `docs/owner-setup.md`.

- Run Ward's local seed once Lantern is in it (the Ward repo's own brief), so `.env` gains the
  five `WARD_OIDC_*` lines, then try "Sign in with Ward" at <http://localhost:5180/lantern/>.
- When the first version is done: register Lantern in production Ward (slug `lantern`), put the
  two secrets (`OMDB_API_KEY`, `WARD_OIDC_CLIENT_KEY`) in vps-deploy, have the stack written from the table in `docs/owner-setup.md`,
  deploy, then run the title import and seed your account in the container, and link Ward
  (`docs/owner-setup.md`, steps 6 and 7).
- Optionally, check the container locally (`docs/owner-setup.md`, step 4).
