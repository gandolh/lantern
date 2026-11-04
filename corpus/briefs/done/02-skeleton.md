# Task 02: The skeleton: workspaces, settings, the database, the page's shell

## Context

Lantern has no code. This brief lays down the estate's stack the way Wicket has it (read its
root `package.json`, `tsconfig.base.json`, `eslint.config.js`, `vitest.config.ts`,
`server/src/{config,db,app,index}.ts`, `web/vite.config.ts` and `web/src/{base,route}.ts`;
copy patterns, not code verbatim) so every later brief only adds. No key and no sign-in yet.
See [decisions.md](../../wiki/decisions.md), "The estate's stack" and "On the VPS".

## Files you OWN

- Root: `package.json` (name `lantern`, workspaces `shared`, `server`, `web`, Node 24 or later,
  scripts `dev`, `build`, `start`, `test`, `typecheck`, `lint`), `package-lock.json`, `.npmrc`
  (`save-exact=true`), `tsconfig.base.json`, `tsconfig.json`, `eslint.config.js`,
  `vitest.config.ts`, `.gitignore`, `.env.example`
- `shared/` (`@lantern/shared`): the contract as zod schemas; for now the health answer, the
  error body `{ code, message }` and the media type (`movie` | `tv`)
- `server/` (`@lantern/server`): `src/config.ts`, `src/db.ts`, `src/app.ts`, `src/index.ts`,
  their tests
- `web/` (`@lantern/web`): `index.html`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`,
  `src/base.ts`, `src/route.ts`, `src/Shell.tsx`, `src/styles.css`, placeholder pages
- `corpus/wiki/architecture.md` (new), `corpus/wiki/status.md`, `corpus/log.md`

## What to do

1. **Workspaces and tooling.** Exact versions, the same majors Wicket pins (Fastify 5,
   better-sqlite3 13, zod 4, React 19, Vite 8, Base UI 1, Vitest 4, TypeScript 6, ESLint 10).
   One Vitest project at the root, `forks` pool. ESLint ignores `dist`, `data` and `vendor`.
2. **Settings** (`config.ts`): `HOST` (default `127.0.0.1`), `PORT` (`8810`), `LANTERN_DB`
   (empty means `data/lantern.sqlite` under the repo root), `PUBLIC_ORIGIN` (default the dev
   page, `http://localhost:5180`), `LANTERN_API_PREFIX` (`/lantern-api`), `LANTERN_BASE`
   (`/lantern/`). An empty value counts as unset. A bad value stops the start with a message
   naming the variable. The server reads the repo's `.env` for what the environment leaves
   unset (`process.loadEnvFile`), and never prints a value.
3. **The database** (`db.ts`): one SQLite file, WAL, foreign keys on, migrations in order under
   `PRAGMA user_version`. No tables yet beyond what the first migration needs to exist.
4. **The API** (`app.ts`): `GET /v1/health` → `{ ok: true }`; the API prefix stripped by the
   server too, so one build runs behind Caddy and on its own; errors as `{ code, message }`,
   never echoing a body; the built page served at the base with an SPA fallback when
   `web/dist` exists, and `/` redirecting to it.
5. **The page.** Vite on port 5180 (`strictPort`), base `/lantern/`, a dev proxy for
   `/lantern-api` to `127.0.0.1:8810` that strips the prefix as Caddy does. A small router
   (`route.ts`) for `/lantern/` (suggestions), `rate`, `watchlist`, `ratings`, `search`,
   `movie/:id`, `tv/:id`, `account`, `login`. A shell with conventional navigation: a top bar
   (brand, the five sections, account) on wide screens, a bottom tab bar on the phone. Each
   section a placeholder that says what will be there. Light and dark from the system.
6. **`.env.example`**: every variable above, commented, plus the two keys already there. No
   value is a secret's.
7. **`architecture.md`**: the three workspaces, the request path in dev and on the VPS, the
   ports, where the data lives.

## Acceptance

- `npm run typecheck`, `npm run lint` and `npm test` pass; tests cover the settings (defaults,
  an empty value, a bad port named in the error) and the health route under both `/v1/health`
  and `/lantern-api/v1/health`.
- `npm run dev` serves the page at <http://localhost:5180/lantern/> and the health answer through
  the proxy. A short browser walk at phone and desktop widths moves between the sections.
- No key, password, machine path or domain in the repo.

## Outcome (2026-11-04)

Built as specified; how it fits together is in [architecture.md](../../wiki/architecture.md).

- **Versions** are Wicket's exact pins. `npm audit` reports the same moderate advisories Wicket
  has, through `@fastify/static` 10.1.5 (its `glob` and `minimatch`); the fix, 10.1.9, wasn't
  two weeks old on 2026-11-04, so it waits (a line in status.md). In production Caddy serves the
  page and `@fastify/static` isn't reached.
- **The database** opens with an empty migration list; the first table comes with the states.
- **The router** reads `/lantern/search?q=` from the address, and an unknown path or a bad id
  (`/lantern/movie/0`) is "not found". The page's title follows the section.
- **No `LICENSE`**: the repo is public, but choosing a licence is the owner's call (Wicket is
  MIT). The vendored ward-auth will carry its own.

Checks: `npm run typecheck`, `npm run lint`, `npm test` (5 files, 16 tests: settings, the
database's migrations, health with and without the prefix, the built page and its fallback, the
router round trip, the shell). `npm run dev` with a scratch database: health through the proxy;
a browser walk at 1280 px and at 412 x 915 moved between the sections with the top bar and the
tab bar, Back, and a reload on `/lantern/tv/1399`.
