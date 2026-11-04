# Task 06: The container and the owner's setup

## Context

The stack goes into vps-deploy later, as the owner's step; this repo carries what that stack
needs. Wicket's `infrastructure/Dockerfile`, `infrastructure/docker-compose.yml`,
`.dockerignore` and `docs/owner-setup.md` are the model. Lantern has one container, the API; in
production Caddy serves the built page.

Depends on 02, 03 and 05 (the settings it lists).

## Files you OWN

- `infrastructure/Dockerfile`, `infrastructure/docker-compose.yml`, `.dockerignore` (new)
- `docs/owner-setup.md`, `docs/README.md` (new)
- `corpus/wiki/architecture.md`, `corpus/wiki/status.md`, `corpus/log.md`

## What to do

1. **The image.** Multi-stage on `node:24-alpine`: compile `shared` and `server`, install the
   server's runtime dependencies only, copy `server/vendor`, drop test files. `HOST=0.0.0.0`,
   `PORT=8810`, `LANTERN_DB=/data/lantern.sqlite`, `/data` a volume, a health check on
   `/v1/health`. Runs as container root for the rootless daemon's bind mount, as Wicket explains.
2. **Compose.** One service `lantern-api`, image `lantern-api:1.0`, published on
   `127.0.0.1:8810` only, `env_file: .env` in `infrastructure/`, `/data` bind-mounted from
   `LANTERN_DATA_DIR`. No other container.
3. **`docs/owner-setup.md`**, like Wicket's: register Lantern in production Ward (slug
   `lantern`, the redirect and sign-out URIs under `<production origin>`); the secrets by name
   (`WARD_OIDC_CLIENT_KEY`, `TMDB_API_KEY`, `OMDB_API_KEY`); the stack table for vps-deploy
   (repo, container, server dir, port 8810 on loopback, the page built with
   `LANTERN_BASE=/lantern/` and served at `/lantern/` with an SPA fallback, `/lantern-api/*` to
   the API with the prefix stripped, the health check, the data directory, plain env); the
   first account with the seed in the container, then Link Ward; the local Ward seed entry; and
   local development (`.env` from `.env.example`, the seed, `npm run dev`).
4. **`docs/README.md`**: a short index of `docs/` and the corpus pages.

## Acceptance

- `docker compose -f infrastructure/docker-compose.yml config` parses (a light check; the image
  is not built on the shared machine, and the outcome says so).
- `docs/owner-setup.md` names every secret by variable only, and writes `<production origin>`,
  never the domain.
- `npm run typecheck`, `npm run lint` and `npm test` still pass.
