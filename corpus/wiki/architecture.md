---
summary: How Lantern is put together, as built from 2026-11-04. Three npm workspaces (the shared zod contract, the Fastify + SQLite server, the React page on Vite), the request path in dev (Vite on 5180 proxying /lantern-api to the API on 8810) and on the VPS (Caddy), the settings and their defaults, where the data lives, the page's router and frame, and the rule that the server works only while answering a request.
updated: 2026-11-13
---

# Architecture

The code wins where this page and it disagree. Why it is built this way:
[decisions.md](decisions.md).

## Pieces

npm workspaces, Node 24 or later, exact versions (`save-exact=true`), TypeScript strict,
Vitest (one project at the root, `forks` pool for the native SQLite addon), ESLint:

- `shared` (`@lantern/shared`): the API contract as zod schemas. The server builds its answers
  from them and the page parses answers with them.
- `server` (`@lantern/server`): Fastify 5 on better-sqlite3, in the house code structure
  ([decisions.md](decisions.md)):
  - `server.ts` is the only file that listens: settings, `buildApp`, `close-with-grace`, the
    timeouts and `trustProxy`. `app.ts` builds the app and never listens; it registers, in order, the
    errors plugin, the zod compilers, `plugins/auth` (the sign-in guard, [sign-in.md](sign-in.md)),
    then the features by name.
  - `config.ts` is the only reader of the environment: `loadConfig()`, `loadEnvFile()`,
    `repoRoot()`, `resolveDbPath()` and the seed's `loadSeedConfig()`.
  - `db.ts` opens the file and runs the migrations (`PRAGMA user_version`); `seed.ts` makes the
    local account.
  - `plugins/` holds the cross-cutting plugins, wrapped in `fastify-plugin`: `errors.ts` (the one
    error handler and `fail()`) and `auth/` (the guard, the 401 rewrite, the Origin check,
    `currentUserId`, the accounts).
  - `features/<name>/` holds one domain each: `states`, `pool`, `sources`, `titles`, `cards`,
    `suggestions`, `lists`, `health`. A feature is used through its `index.ts`; `routes.ts` is its
    plugin, `store.ts` its SQL. `states`, `pool` and `sources` are the leaves; nothing imports
    `titles`, `cards`, `lists` or `suggestions`. dependency-cruiser enforces both.
  - ward-auth is vendored in `server/vendor/ward/` and `web/vendor/ward/`.
  - Dependencies: `@fastify/type-provider-zod` 1.0.3 declares `@fastify/swagger` and
    `openapi-types` as required peers, so both are pinned in `server/package.json` though no API
    docs are served.
- `web` (`@lantern/web`): Vite and React 19. `route.ts` is a small hand-written router over
  `history`; `Shell.tsx` is the frame; each section is a page component.

## Request path

| Where | Page | API |
|---|---|---|
| Dev (`npm run dev`) | Vite at `http://localhost:5180/lantern/` | Vite proxies `/lantern-api/*` to `127.0.0.1:8810`, prefix stripped |
| `npm start` | the server serves `web/dist` at `/lantern/` | the same server, on `127.0.0.1:8810` |
| VPS | Caddy serves the built page at `/lantern/` | Caddy forwards `/lantern-api/*` to the container on `127.0.0.1:8810` |

The server strips `/lantern-api` itself too, so a request reaches the same route with or without
it. Every route is under `/v1` and needs a session, except `GET /v1/health` (`{ ok: true }`);
sign-in is under `/auth`. Every route declares its zod schemas (params, query string, body and the
statuses its handler sends), so a bad request is a 400 `invalid_request` naming the field and a
reply is stripped to its schema. Only the poster route has no response schema (it sends image
bytes). Errors are `{ code, message }`, and a message never quotes the request body.

## Settings

Read once at start from the environment, and from the repo's `.env` for what it leaves unset. An
empty value counts as unset; a bad one stops the start with a line naming the variable, never
its value.

| Variable | Default | What |
|---|---|---|
| `HOST` | `127.0.0.1` | where the server listens |
| `PORT` | `8810` | its port |
| `LANTERN_DB` | `data/lantern.sqlite` under the repo | the SQLite file |
| `PUBLIC_ORIGIN` | `http://localhost:5180` | the page's origin as the browser sees it |
| `LANTERN_API_PREFIX` | `/lantern-api` | the API's prefix as the browser sees it |
| `LANTERN_BASE` | `/lantern/` | the page's base path (the build reads it too) |
| `AUTH_TRUSTED_PROXIES`, `WARD_OIDC_*`, `SEED_*` | empty | sign-in ([sign-in.md](sign-in.md)); the proxies are also Fastify's `trustProxy`, with loopback |
| `OMDB_API_KEY` | empty | OMDb's key, a secret ([source-calls.md](source-calls.md)) |

## Data

One SQLite file, WAL mode ([data-model.md](data-model.md)). `data/` is gitignored; on the VPS it
is a bind-mounted directory.

## On the VPS

One container, `lantern-api`, from [infrastructure/Dockerfile](../../infrastructure/Dockerfile)
and [infrastructure/docker-compose.yml](../../infrastructure/docker-compose.yml) (compose
project `lantern`): `node:24-alpine`, the compiled `shared` and `server` with their runtime
dependencies and the vendored ward-auth, no test code. It listens on `0.0.0.0:8810` inside and
is published on `127.0.0.1:8810` only; `/data` is a bind mount. The page is built separately
(`npm run build`, `LANTERN_BASE=/lantern/`) and served by Caddy. Everything the vps-deploy stack
needs, and the owner's steps, are in [docs/owner-setup.md](../../docs/owner-setup.md).

## The page

Phone first. Below 760px the five sections (Suggestions, Rate, Watchlist, Ratings, Search) are
a tab bar at the bottom and the top bar holds the brand and the account; from 760px they move
into the top bar (`wide:`, a named breakpoint of exactly 760px). The look is Tailwind 4 in one
stylesheet, `web/src/styles/index.css`: the colours are `light-dark()` tokens in `@theme`, light
or dark by `data-theme` on `<html>` (light on a first visit; the Light / Dark / System switch on
the account page sets it), with one amber accent. The names are the small-tools family's
(`page`, `surface`, `ink`, `accent`, `line`, `danger`); the values are Lantern's, the "Lamplight" look of
2026-11-13 ([docs/design.md](../../docs/design.md)): a warm paper ground, an ink underline on the current
top-bar item and a pill behind the current tab, Hanken Grotesk and Bricolage Grotesque, six sizes. A title
page (`/lantern/title/:id`) belongs to no section. See [web-app.md](web-app.md).

## No background work

The server does work only while answering a request: no timers, no scheduled jobs, no open
WebSockets ([decisions.md](decisions.md)), so the container can sleep when idle.
