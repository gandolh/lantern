---
summary: Where Lantern stands, per area, as of 2026-11-04. The first version is built (briefs 01-14), on OMDb plus IMDb's files after the owner dropped TMDB the same day; not deployed. Each area as built, the checks, the todo (bump @fastify/static), and the owner's next steps in order (push, Ward registration, two secrets, the vps-deploy stack, the title import, the account).
updated: 2026-11-04
---

# Status

_2026-11-04_. **The first version is built**: briefs 01 to 14, all on 2026-11-04. The owner
settled it in a grill ([decisions.md](decisions.md)), then dropped TMDB the same day for OMDb
plus IMDb's non-commercial files ("Revisited"), and briefs 07 to 14 were rewritten and built on
that ([overview.md](overview.md)). **Not deployed**, and the container image was never built
on the shared machine. 104 tests; typecheck and lint clean. The owner pushes.

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

None.

## Todos

- Move `@fastify/static` to 10.1.9 or later once it is two weeks old (about 2026-11-18): it
  clears the moderate `glob` and `minimatch` advisories `npm audit` reports.

## Next (owner)

In this order; the details are in `docs/owner-setup.md`.

1. Push this repo (local `main` is ahead of GitHub).
2. Locally, "Sign in with Ward" once Ward's local seed has run (it needs your Ward login and
   writes the five `WARD_OIDC_*` lines into `.env`); only local sign-in was walked.
3. Register Lantern in production Ward (slug `lantern`) and grant your account (step 1).
4. Put the two secrets in vps-deploy: `OMDB_API_KEY` and `WARD_OIDC_CLIENT_KEY` (step 2).
5. Have the `lantern` stack written from the table in step 3, and deploy (step 5). Optionally
   check the container locally first (step 4).
6. In the container: import the titles (`node server/dist/pool/cli.js`, step 6), then seed your
   account and link Ward (step 7). Repeat the import about monthly.
7. Choose a licence for the public repo, if any (none is set).
