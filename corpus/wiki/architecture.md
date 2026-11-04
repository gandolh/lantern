---
summary: How Lantern is put together, as built from 2026-11-04. Three npm workspaces (the shared zod contract, the Fastify + SQLite server, the React page on Vite), the request path in dev (Vite on 5180 proxying /lantern-api to the API on 8810) and on the VPS (Caddy), the settings and their defaults, where the data lives, the page's router and frame, and the rule that the server works only while answering a request.
updated: 2026-11-04
---

# Architecture

The code wins where this page and it disagree. Why it is built this way:
[decisions.md](decisions.md).

## Pieces

npm workspaces, Node 24 or later, exact versions (`save-exact=true`), TypeScript strict,
Vitest (one project at the root, `forks` pool for the native SQLite addon), ESLint:

- `shared` (`@lantern/shared`): the API contract as zod schemas. The server builds its answers
  from them and the page parses answers with them.
- `server` (`@lantern/server`): Fastify 5 on better-sqlite3. `config.ts` reads the settings,
  `db.ts` opens the file and runs the migrations (`PRAGMA user_version`), `app.ts` builds the
  routes, `index.ts` starts it.
- `web` (`@lantern/web`): Vite and React 19. `route.ts` is a small hand-written router over
  `history`; `Shell.tsx` is the frame; each section is a page component.

## Request path

| Where | Page | API |
|---|---|---|
| Dev (`npm run dev`) | Vite at `http://localhost:5180/lantern/` | Vite proxies `/lantern-api/*` to `127.0.0.1:8810`, prefix stripped |
| `npm start` | the server serves `web/dist` at `/lantern/` | the same server, on `127.0.0.1:8810` |
| VPS | Caddy serves the built page at `/lantern/` | Caddy forwards `/lantern-api/*` to the container on `127.0.0.1:8810` |

The server strips `/lantern-api` itself too, so a request reaches the same route with or without
it. Every route is under `/v1`; `GET /v1/health` answers `{ ok: true }`. Errors are
`{ code, message }`, and a message never quotes the request body.

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

## Data

One SQLite file, WAL mode. `data/` is gitignored; on the VPS it is a bind-mounted directory.

## The page

Phone first. Below 760px the five sections (Suggestions, Rate, Watchlist, Ratings, Search) are
a tab bar at the bottom and the top bar holds the brand and the account; from 760px they move
into the top bar. Colours are tokens in `styles.css`, light or dark as the system says, with one
amber accent. A title page (`/lantern/movie/:id`, `/lantern/tv/:id`) belongs to no section.

## No background work

The server does work only while answering a request: no timers, no scheduled jobs, no open
WebSockets ([decisions.md](decisions.md)), so the container can sleep when idle.
