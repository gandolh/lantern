# Lantern

Rate the films and series you have watched, and get suggestions for what to watch next: a Fastify and
SQLite API with a React page on Vite, three npm workspaces (`shared`, `server`, `web`). Read
[corpus/index.md](corpus/index.md) first.

## Commands

- `npm run dev`: the API on 8810 and the page on 5180 at `/lantern/`.
- `npm run check`: typecheck, lint, format check, conventions, tests. Run it before every hand-back.
- `npm run check:fast`: the typecheck, then ESLint on the changed files. The Stop hook runs it.
- `npx vitest run <file>`: one test file.
- `npm run format`: Prettier writes every file it covers (Markdown stays out).
- `npm run seed -w @lantern/server`: a local account.
- `npm run titles:import -w @lantern/server`: build the title pool from IMDb's files.

## Places that mislead

- The typecheck is two runs: `tsc -b` (shared, server), then `tsc -p web --noEmit`.
- `.env` sits at the repo root, not in `server/`.
- Two dev ports: 8810 is the API, 5180 the page. Vite forwards `/lantern-api` to the API.
- With `OMDB_API_KEY` unset there are no posters and the record route answers 503 `no_key`. That is
  normal in development.
- `npm test` builds `shared` first (`pretest`): the tests import it from `shared/dist`.
- `vendor/house-style/`, `server/vendor/` and `web/vendor/` are generated copies. Never edit them;
  `npm run house-style:sync` refreshes the first.

## Hard rules

- **No secrets.** Never write a key, token or password into the corpus or the repo. Name a secret by
  its `.env` variable. Never write the production domain.
- **No CI.** Don't add GitHub Actions, runners or other GitHub-specific automation.
- **No pushes, no deploys.** Commit locally. The owner pushes and deploys.
- **No cross-app features.** Lantern is independent of the owner's other apps; copy patterns, share
  no data.

## brief-board

Brief progress goes on brief-board. Run `brief-board guide` before you
start or resume a brief, and follow it.
