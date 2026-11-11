# The API (`server/src`, `shared/src`)

- Read the `code-structure` skill, [architecture](../../corpus/wiki/architecture.md) and
  [data-model](../../corpus/wiki/data-model.md) before you add or move a route or a module.
- `server.ts` listens and `app.ts` builds; `config.ts` is the only reader of `process.env` (and of the
  `.env`). A feature is `server/src/features/<name>/`, used through its `index.ts`; its routes are a
  `FastifyPluginAsyncZod` taking its dependencies as options, its SQL is in `store.ts`.
- Every route declares its schemas (`params`, `querystring`, `body` and the response statuses the
  handler itself sends), from `shared/` when the page imports them. Never declare a `401`, `403` or
  `400`: the guard and the validator send those, and a declared status runs them through the
  serializer. No handler parses request input. The poster route is the one with no response schema.
- Every row is scoped to the signed-in user (`currentUserId(request)` in
  `server/src/plugins/auth/index.ts`).
- Errors are `{ code, message }` (`errorBodySchema` in `shared/src/api.ts`), sent through `fail()`
  in `server/src/plugins/errors.ts`; the page parses them.
- Tests build the app with `buildTestApp` (`server/src/testing.ts`) and read its handles; no decorator
  is a test seam.
- `connectionTimeout` in `server.ts` must stay above the record route's silent wait (about 26 s).
- The server works only while answering a request: no timers, no background jobs
  ([decisions](../../corpus/wiki/decisions.md), "No background work").
- No secret is logged or written to the repo; keys are named by their `.env` variable.
- `server/vendor/` is Ward's generated library. Never edit it.
- `npm run check:conventions` runs `check-structure` strictly and dependency-cruiser over these folders.
