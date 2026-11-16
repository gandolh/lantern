# Getting started

The full local setup that the [main README](../README.md) shortens. The VPS, the container and
production Ward are in [owner-setup.md](owner-setup.md).

## Prerequisites

- Node 24 or later (`engines` in `package.json`) and its npm.
- Optional: an OMDb key, free by email (<https://www.omdbapi.com/apikey.aspx>, 1,000 requests a
  day). Without one there are no posters, plots, people or scores, and that is normal in development.
- Optional: a local Ward, for "Sign in with Ward". Local accounts work without it.

## Install

```bash
npm ci
```

`npm ci` installs exactly what `package-lock.json` pins. Every dependency is pinned to an exact
version (`.npmrc` sets `save-exact=true`).

## Configure

```bash
cp .env.example .env
```

`.env` sits at the repo root, not in `server/`, and git ignores it. The server reads it for whatever
the environment leaves unset, and an empty value counts as unset, so every line may stay empty for
local development.

| Variable | What | Where the value comes from |
|---|---|---|
| `OMDB_API_KEY` | OMDb's key. A secret | the email OMDb sends |
| `SEED_USERNAME`, `SEED_PASSWORD` | the account the seed makes; it asks on a terminal for what is empty | your choice |
| `WARD_OIDC_*` (five) | "Sign in with Ward"; with `WARD_OIDC_ISSUER` empty, local accounts only. `WARD_OIDC_CLIENT_KEY` is a secret | Ward's local seed writes them (below) |
| `HOST`, `PORT`, `LANTERN_DB`, `PUBLIC_ORIGIN`, `LANTERN_API_PREFIX`, `LANTERN_BASE`, `AUTH_TRUSTED_PROXIES` | where the server listens, the SQLite file, the page's origin and paths | the defaults suit local development |

Every setting with its default: [the wiki's settings table](../corpus/wiki/architecture.md#settings).

## Your account and the titles

```bash
npm run seed -w @lantern/server
npm run titles:import -w @lantern/server
```

The seed makes one local account (there is no sign-up page) and leaves an existing one as it is.
Passwords are at least 8 characters.

The import streams IMDb's `title.basics`, `title.ratings` and `title.crew` (about 310 MB, half a
minute) and keeps films and series with 1,000 votes or more. It replaces the pool in one go and never
touches your ratings. Add `-- --min-votes 2000` for a smaller pool, or `-- --from <folder>` to read
files you already downloaded. IMDb's data is for personal, non-commercial use only.

Both write to `data/lantern.sqlite` under the repo root, or to `LANTERN_DB`.

## Run

```bash
npm run dev
```

The API listens on `127.0.0.1:8810` and the page is at <http://localhost:5180/lantern/>. Vite forwards
`/lantern-api` to the API with the prefix stripped, as Caddy does on the VPS.

- **The built page:** `npm run build`, then `PUBLIC_ORIGIN=http://127.0.0.1:8810 npm start`. The
  server serves the page at <http://127.0.0.1:8810/lantern/> and the API on the same port.
- **Check OMDb once:** `npm run sources:check -w @lantern/server` makes one real call and prints what
  came back, never the key.

## Checks

| Command | What it runs |
|---|---|
| `npm run check` | typecheck, lint, format check, conventions (knip, dependency-cruiser, the house checks), tests. Run it before every hand-back |
| `npm run check:fast` | the typecheck, then ESLint on the changed files |
| `npm test` | Vitest over every workspace; `pretest` builds `shared` first |
| `npx vitest run <file>` | one test file |
| `npm run format` | Prettier over every file it covers; Markdown stays out |

The browser specs in `web/e2e/` (Playwright 1.63.0, headless Chromium) check a focus ring on every
Tab stop, no motion under reduced motion, no sideways scroll at 390 px, the theme switch and the swipe
card. They run against a running page with a seeded local account, and stub the data routes with
invented titles, so they need no title pool and no OMDb key. With `npm run dev` up, from `web/`:

```bash
LANTERN_DEMO_USER=<account> LANTERN_DEMO_PASSWORD=<its password> npx playwright test --workers=2
```

`LANTERN_URL` points them at another address (default `http://localhost:5180`). Playwright's
Chromium must be installed for them to run.

## Sign in with Ward, locally

Ward's local seed (`infrastructure/local/seed.mjs` in the Ward repo, `wzd_auth`) lists Lantern as

```
{ slug: "lantern", name: "Lantern", repo: "lantern", envFiles: [".env"], dev: "http://localhost:5180/lantern/", api: "/lantern-api" },
```

Run `node seed.mjs` there. It writes the five `WARD_OIDC_*` values into this repo's `.env` and keeps
the rest of the file. Restart `npm run dev`.

## Common problems

- **Port 5180 or 8810 is taken.** Vite's port is fixed with `strictPort`. Stop whatever holds it, or
  run the two halves yourself, each in its own terminal, on ports of your choice:

  ```bash
  npx tsc -b shared
  PORT=<api> PUBLIC_ORIGIN=http://localhost:<page> npm run dev -w @lantern/server
  PORT=<api> PUBLIC_ORIGIN=http://localhost:<page> npm run dev -w @lantern/web -- --port <page> --strictPort
  ```

- **A title page says OMDb has no key.** The record route answers 503 `no_key` while `OMDB_API_KEY` is
  empty. Set it in `.env` and restart the API.
