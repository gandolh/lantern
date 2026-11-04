# Task 14: The README and the docs index

## Context

The README still says nothing is built. Once the first version works end to end, it needs the
estate's README shape (Wicket's is the newest): what Lantern is in two lines, what it does, how
to run it locally, where the docs are. No screenshots: captures would show the owner's ratings,
and a later README pass can add clean ones. vps-deploy's `lantern` stack is written from
`docs/owner-setup.md`, so that file must match the code exactly.

Depends on 02-13.

## Files you OWN

- `README.md`, `docs/README.md`, `docs/owner-setup.md`
- `corpus/wiki/status.md`, `corpus/log.md`

## What to do

1. **`README.md`**: what Lantern is, the features as built, the stack in a line, local
   development in a few commands (the import included), the IMDb credit line and OMDb's, and
   links to `docs/` and the corpus.
2. **`docs/README.md`**: the question-to-page table.
3. **`docs/owner-setup.md`** checked against the code: the service name, port and data
   directory; every secret by name (`OMDB_API_KEY`, `WARD_OIDC_CLIENT_KEY`); the seed and the
   import as the owner runs them inside the container (built JavaScript, started by `node`); the
   stack table.

## Acceptance

- Every link in the README and `docs/` resolves; no domain, path, username or secret.
- `npm run typecheck`, `npm run lint` and `npm test` still pass.

## Outcome (2026-11-04)

Built as specified.

- **`README.md`** in Wicket's shape: what Lantern is, what it does, how it works (the pool from
  IMDb's files, OMDb for what is shown in full, nothing in the background), running it locally
  with the import, the layout, and the credits (IMDb's line word for word, OMDb's licence). No
  screenshots: captures would show the owner's ratings.
- **`docs/owner-setup.md`** checked against the code: service `lantern-api`, port 8810 on
  loopback, `/srv/lantern-api/data` at `/data`, the two secrets (`OMDB_API_KEY`,
  `WARD_OIDC_CLIENT_KEY`), the seed (`node server/dist/seed.js`) and the import
  (`node server/dist/pool/cli.js`) as built JavaScript inside the container. Both commands were
  run from `server/dist` against a scratch database. Added: wake a sleeping container before
  `exec`.
- **`docs/README.md`** gained the pool and suggestions pages.

Checks: every link in the README and `docs/` resolves; no domain, machine path, username or
secret in them; `npm run typecheck`, `npm run lint`, `npm test` (18 files, 104 tests) pass.
`docker compose config` could not run this time (Docker's WSL integration was off after a
restart); the compose file is unchanged since brief 06, where it parsed.
