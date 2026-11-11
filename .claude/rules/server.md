---
paths:
  - "server/src/**"
  - "shared/src/**"
---

# The API (`server/src`, `shared/src`)

- Read the `code-structure` skill, [architecture](../../corpus/wiki/architecture.md) and
  [data-model](../../corpus/wiki/data-model.md) before you add or move a route or a module.
- Every row is scoped to the signed-in user (`userIdOf(request)` in `server/src/routes/states.ts`).
- Errors are `{ code, message }` (`errorBodySchema` in `shared/src/api.ts`), sent through `fail()`
  in `server/src/reply.ts`; the page parses them.
- The server works only while answering a request: no timers, no background jobs
  ([decisions](../../corpus/wiki/decisions.md), "No background work").
- No secret is logged or written to the repo; keys are named by their `.env` variable.
- `server/vendor/` is Ward's generated library. Never edit it.
- `npm run check:conventions` runs `check-structure` over these folders, `--warn-only` for now.
