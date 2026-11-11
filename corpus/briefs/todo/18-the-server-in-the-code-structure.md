# Task 18: The server in the house code structure

**Depends on:**

- In Lantern: brief 15, for the gate, `eslint-plugin-n`'s `no-process-env` (a warning until this brief) and `.claude/rules/server.md`.
- In the owner's skills library:
  - brief 03, *A code-structure skill for the Fastify + React apps*: rules 1-11, the `server-skeleton.md` and `zod-type-provider.md` references, `migrating-a-server.md`, `check-structure.mjs`, and the dependency-cruiser and knip presets;
  - brief 16, *The Fastify servers adopt the code structure*: the per-server table and the method;
  - brief 15, *Enforce the base-ui and code-structure skills in every repo*: `check-structure` runs `--warn-only` until this brief is done.
- The owner's grilling of 2026-11-10: Q1 (how the service starts), Q23 (`server/src/features/`), Q24 (plugin options, explicit registration), Q25 and Q53 (response schemas, and their exemptions), Q27 (the test runner), Q43 (error bodies), Q55 and Q56 (where schemas live, no decorators as a test seam, a feature's CLI beside it). All decided; see Owner decisions.

**Order:** after 15. It touches no file that 16 or 17 touch except `package-lock.json`, so it may run before them, but never at the same time as either. (If it runs first, brief 17's fixture path for the title import moves with the pool feature.)

**Before you start:** run `brief-board guide` ([corpus/CLAUDE.md](../../CLAUDE.md)).

## Context

The owner asked on 2026-11-09 for one researched code structure, enforced in every repo. Lantern's server is already near its spirit:

- `buildApp(options)` in `server/src/app.ts:135` never listens;
- `server/src/config.ts` parses the environment once with zod (`loadConfig(env)`, line 108);
- the stores are built from the database handle and passed in (`createStatesStore`, `createPool`, `createRecords`);
- every 4xx and 5xx answer goes through one shape (`fail()`, `server/src/reply.ts:6`) and one handler (`app.ts:152`);
- 8 test files drive the app with `inject()`.

What is missing:

- the `server.ts` name, and one reader of the environment (there are four copies of `REPO_ROOT` and `loadEnvFile`);
- feature folders: today `server/src/routes/`, `server/src/pool/`, `server/src/sources/`, `server/src/suggest/` and a flat root;
- route schemas: the contract has zod schemas for 16 of 17 routes, but handlers call a hand-written `parse()` and return typed objects, so nothing validates or strips a reply;
- `fastify-plugin` on the cross-cutting parts, `close-with-grace`, timeouts and `trustProxy`.

### The versions (verified 2026-11-10)

- **zod 4.6.7** in `shared/package.json`, `server/package.json`, with a single copy in `package-lock.json` (line 4832) and no root `overrides` for it. `@fastify/type-provider-zod` 1.0.3 needs `>=4.2.0`, so **no zod move**.
- **fastify 5.12.7** (`server/package.json`, lockfile line 2886); the latest is 5.12.8, and the provider needs `^5.5.0`.
- **`@fastify/type-provider-zod` 1.0.3** declares `@fastify/swagger >=9.5.1` and `openapi-types ^12.1.3` as required peers: pin both and note them in [wiki/architecture.md](../../wiki/architecture.md). `fastify-plugin` 6.0.1 is already in the lockfile transitively and becomes a direct pinned dependency; `close-with-grace` 2.5.0 is new.
- **No `git` in the image** (`infrastructure/Dockerfile:26-29`): none of these is a `github:` dependency, so the `deps` stage's `npm ci` is unaffected.
- The `proddeps` stage installs only `@lantern/server`'s production dependencies (line 60), so the provider, `fastify-plugin` and `close-with-grace` go in `server/package.json` `dependencies`, not the root.

### Two traps checked in the shared schemas (2026-11-10)

1. **`.transform()` in a response schema.** The provider's serializer throws on any zod `.transform()` it has to encode. `grep -n "\.transform(\|preprocess\|\.pipe(" shared/src/*.ts` finds **none**; the only transforms are in `server/src/config.ts` (the environment schema, never a response). So no output-safe twin schema is needed here. The three `z.coerce.number<string>()` calls (`shared/src/cards.ts:23`, `pool.ts:66`, `states.ts:61`) sit in query schemas, which are decoded, and decoding is fine.
2. **A declared status the handler doesn't send.** The response schema for a status is applied to whatever is sent with it. Lantern's session guard (the vendored Ward plugin) answers an unsigned request with `{ error: "unauthorized" }`, and `app.ts:206-219` rewrites it in `onSend` into `{ code, message }`. The guard sends from a hook, inside the route's context, so **a declared `401` schema would run the guard's body through the serializer and turn it into a 500**. The rule: **declare only the statuses the handler itself sends** (the `200`, and the `404`, `502` and `503` below), never `400`, `401` or `403`, which the validator, the guard and the origin hook send.

### The move map: every file under `server/src/` (56 files: 33 source, 15 tests, 8 data)

A bare file name sits at the root of `server/src/`; every other path is given from the repo root.

| Today | Lines | Target | Note |
|---|---|---|---|
| `index.ts` | 73 | `server.ts` | The entry: config, `buildApp`, `listen`, `close-with-grace`. The `.env` read and the data-path rule move to `config.ts`. |
| `app.ts`, `app.test.ts` | 264, 62 | the same | Keeps `buildApp`, `AppOptions`, the static page (lines 249-266) and the 404 handler. The error handler (152-168) goes to `server/src/plugins/errors.ts`; the guard, the 401 rewrite and the origin hook (170-225) go to `server/src/plugins/auth/index.ts`; the health route (227) goes to `server/src/features/health/routes.ts`. |
| `config.ts`, `config.test.ts` | 126, 112 | the same | Gains `loadEnvFile()` and `repoRoot()` (from the four copies), `resolveDbPath()` and `loadSeedConfig()`. |
| `accounts.ts` | 30 | `server/src/plugins/auth/accounts.ts` | |
| `reply.ts` | 20 | `server/src/plugins/errors.ts` | `fail()` stays, as the one way a handler sends an error body. `parse()` is deleted: the provider validates. |
| `db.ts`, `db.test.ts` | 137, 31 | the same | |
| `testing.ts` | 61 | the same | `signIn`, `seedPool`, `TEST_ORIGIN`. Nine files import it. |
| `seed.ts` | 81 | the same | A CLI at the `src/` root: the container runs `node server/dist/seed.js` (`docs/owner-setup.md:128`). Its three environment reads move to `config.ts`. |
| `states.ts`, `states.test.ts` | 129, 155 | `server/src/features/states/store.ts`, `store.test.ts` | |
| `server/src/routes/states.ts` | 96 | `server/src/features/states/routes.ts` | `userIdOf` (line 19) moves out: `server/src/plugins/auth/index.ts` exports it as `currentUserId`. Four other route files import it today from `./states.js` (`cards.ts:9`, `lists.ts:8`, `suggestions.ts:7`, `titles.ts:9`), one feature reaching into another. |
| `server/src/pool/pool.ts` | 104 | `server/src/features/pool/store.ts` | `toPoolTitle`, `POOL_COLUMNS` and `PoolRow` are what other features use. |
| `server/src/pool/import.ts`, `import.test.ts`, `files.ts`, `normalise.ts`, `fixtures/` | 180, 102, 60, 14, 3 files | `server/src/features/pool/` (same names) | |
| `server/src/pool/cli.ts` | 69 | `server/src/features/pool/cli.ts` | The title import's CLI. Decision 5. |
| `server/src/routes/pool.ts` | 10 | `server/src/features/pool/routes.ts` | |
| `server/src/sources/cache.ts`, `http.ts`, `omdb.ts`, `posters.ts`, `queue.ts`, `read.ts`, `records.ts`, `testing.ts` | 60, 87, 159, 59, 63, 22, 42, 49 | `server/src/features/sources/` (same names) | |
| `server/src/sources/omdb.test.ts`, `queue.test.ts`, `records.test.ts`, `fixtures/` | 105, 55, 73, 5 files | `server/src/features/sources/` (same names) | |
| `server/src/sources/check.ts` | 52 | `server/src/features/sources/check.ts` | The one-call live check, `npm run sources:check`. |
| `server/src/routes/sources.ts`, `server/src/routes/sources.test.ts` | 44, 123 | `server/src/features/sources/routes.ts`, `routes.test.ts` | `sourceFailure` (line 12) is used by the titles routes: exported from `server/src/features/sources/index.ts`. |
| `server/src/routes/titles.ts`, `server/src/routes/titles.test.ts` | 59, 115 | `server/src/features/titles/routes.ts`, `routes.test.ts` | Uses pool, states and sources through their `index.ts`. |
| `cards.ts`, `server/src/routes/cards.ts`, `server/src/routes/cards.test.ts` | 30, 34, 64 | `server/src/features/cards/deal.ts`, `routes.ts`, `routes.test.ts` | |
| `server/src/suggest/score.ts`, `score.test.ts` | 161, 85 | `server/src/features/suggestions/score.ts`, `score.test.ts` | Pure: no import at all. |
| `server/src/suggest/suggest.ts` | 52 | `server/src/features/suggestions/service.ts` | |
| `server/src/routes/suggestions.ts`, `server/src/routes/suggestions.test.ts` | 32, 58 | `server/src/features/suggestions/routes.ts`, `routes.test.ts` | |
| `server/src/routes/lists.ts`, `server/src/routes/lists.test.ts` | 64, 79 | `server/src/features/lists/routes.ts`, `routes.test.ts` | |
| `auth.test.ts` | 124 | `server/src/plugins/auth/auth.test.ts` | |
| (new) | | `server/src/plugins/auth/index.ts`, `server/src/plugins/errors.ts` | `fastify-plugin`-wrapped, so the guard and the handler are root hooks. |
| (new) | | `server/src/features/<name>/index.ts` | What other features may import. |
| (new) | | `server/src/features/health/routes.ts` | `GET /v1/health`. |

**The feature graph is already a DAG** (read from the imports on 2026-11-10): `states` and `pool` and `sources` import only `db.ts` and themselves; `suggestions` imports `states`; `cards` imports `pool`; `titles` and `lists` import `pool`, `states` and `sources`. After the move, features import each other only through `index.ts`: `pool`, `states` and `sources` are the three leaves, and nothing imports `titles`, `cards`, `lists` or `suggestions`. dependency-cruiser enforces both.

Every file one folder deeper needs its relative imports updated. **The vendored Ward library is the trap:** `app.ts`, `accounts.ts` and `config.ts` import it as `../vendor/ward/ward-auth.js` (`app.ts:5`, `accounts.ts:1`, `config.ts:2`). `accounts.ts` moves to `server/src/plugins/auth/`, so its path gains one `../`. The Dockerfile copies `server/vendor` next to `server/dist`, so `dist/` mirrors `src/` depth for files at the root and the image needs no change for them.

### Every reader of the environment, and a silent-failure trap

| Where | What | Afterwards |
|---|---|---|
| `index.ts:31` | `loadConfig(process.env)` | `server.ts` calls `loadConfig()`, which defaults its argument to `process.env`: the one reader |
| `server/src/sources/check.ts:35` | `loadConfig(process.env)` | `loadConfig()` |
| `index.ts:21-27`, `seed.ts:25-31`, `server/src/pool/cli.ts:21-26`, `server/src/sources/check.ts:21-26` | **four copies** of `REPO_ROOT` and `process.loadEnvFile(.env)` | `repoRoot()` and `loadEnvFile()` in `config.ts` |
| `seed.ts:60, 61` | `SEED_USERNAME`, `SEED_PASSWORD` | `loadSeedConfig()` in `config.ts` |
| `seed.ts:67`, `server/src/pool/cli.ts:38` | `LANTERN_DB`, each with its own default under `data`, beside a third in `index.ts:38` | `resolveDbPath(config)`: one rule |
| `auth.test.ts:110` | sets the environment | a test, excepted |
| `web/vite.config.ts:43` | `PUBLIC_ORIGIN`, `PORT` | out of scope: a build config |

**The trap:** `REPO_ROOT` is `new URL("../../", import.meta.url)` in `index.ts` and `seed.ts`, but `"../../../"` in `server/src/pool/cli.ts` and `server/src/sources/check.ts`, because those two sit one folder deeper. And every copy swallows `ENOENT` (`catch (err) { if (err.code !== "ENOENT") throw err }`). Move a file without fixing its depth and the `.env` and the data path are silently not found: the server starts on a different database with no key. So the move keeps **one** `repoRoot()`, resolved from `config.ts`'s own location, and a test that `repoRoot()` contains `package.json` named `lantern` and the lockfile. A depth error then fails a test instead of dropping the settings.

No file reads `NODE_ENV`. The Dockerfile sets `NODE_ENV=production`, which only Fastify's dependencies may read.

### Every route: 17, by feature, each with its schemas from `shared/`

The vendored `wardAuth` plugin's `/auth/*` routes are generated code and out of scope. Every schema named below exists in `shared/` today, except where marked **new**. "404" and the like are statuses the handler itself sends.

| Feature | Method and path | params | querystring | body | response |
|---|---|---|---|---|---|
| health (1) | `GET /v1/health` | | | | `200`: `healthResponseSchema` (`shared/src/api.ts:10`). Public. |
| states (7) | `GET /v1/titles/:id/state` | `titleParamsSchema` | | | `200`: `titleStateResponseSchema` |
| | `PUT /v1/titles/:id/state` | `titleParamsSchema` | | `setStateRequestSchema` | `200`: `stateRowSchema` |
| | `DELETE /v1/titles/:id/state` | `titleParamsSchema` | | | `200`: `clearStateResponseSchema` |
| | `POST /v1/titles/:id/skip` | `titleParamsSchema` | | | `200`: `skipResponseSchema` |
| | `DELETE /v1/titles/:id/skip` | `titleParamsSchema` | | | `200`: `skipResponseSchema` |
| | `GET /v1/states` | | `statesQuerySchema` | | `200`: `statesResponseSchema` |
| | `GET /v1/states/counts` | | | | `200`: `stateCountsResponseSchema` |
| titles (3) | `GET /v1/search` | | `searchQuerySchema` | | `200`: `searchResponseSchema` |
| | `GET /v1/titles/:id` | `titleParamsSchema` | | | `200`: `titleItemSchema`; `404`: `errorBodySchema` |
| | `GET /v1/titles/:id/record` | `titleParamsSchema` | | | `200`: `recordResponseSchema`; `502`, `503`: `errorBodySchema` |
| pool (1) | `GET /v1/pool` | | | | `200`: `poolInfoSchema` |
| sources (2) | `GET /v1/sources` | | | | `200`: `sourcesResponseSchema` |
| | `GET /v1/posters/:id` | plain strings (below) | plain string `size` | | **none**: the body is image bytes |
| cards (1) | `GET /v1/cards` | | `cardsQuerySchema` | | `200`: `cardsResponseSchema` |
| suggestions (1) | `GET /v1/suggestions` | | `suggestionsQuerySchema` | | `200`: `suggestionsResponseSchema` |
| lists (1) | `GET /v1/lists/:list` | plain string (below) | `listQuerySchema` | | `200`: `listResponseSchema`; `404`: `errorBodySchema` |

**Two routes keep plain-string params on purpose.** `GET /v1/posters/:id` answers a bad id or size with 404 `not_found`, not 400 (`sources.ts:31-35`), and `GET /v1/lists/:list` answers an unknown list with 404 (`lists.ts:39`); a schema would turn both into a 400. The handlers keep their checks.

**The poster route is the exception to "a response schema on every route":** it sends bytes with a content type from the upstream (`sources.ts:42`), and an error status that is the upstream's (`poster.status`, line 41). Q25's "pass-through" question has this one answer. It declares no response, and the skill's checker needs the exception in `scripts/conventions.json`.

**Hand parsing removed: 13 calls of the helper `parse(schema, request.x, reply)`** in 6 files (`suggestions.ts:16`, `lists.ts:40`, `cards.ts:19`, `states.ts:43, 50, 52, 59, 66, 74, 82`, `titles.ts:32, 40, 49`), plus the one `imdbIdSchema.safeParse(request.params.id)` in `sources.ts:31`, which stays (decision above). The skill's `check-structure` looks for `.parse(request.` and would count **0** here, because the call goes through a helper: the checker must follow `parse(`, or this repo's count reads zero while the real one is 13. Report that to the skill.

**What the validator must reproduce.** Every query schema is `z.strictObject` (`shared/src/cards.ts:21`, `pool.ts:53, 64, 90`, `states.ts:59`), so an unknown query key is a 400 today and stays one. `titleParamsSchema` is the IMDb-id regex (`shared/src/states.ts:22`): a bad id on a state or title route is a 400, and the posters route is the only one that answers 404.

### The error plugin

`server/src/plugins/errors.ts`, wrapped in `fastify-plugin` and registered first. It **keeps Lantern's body, the flat `{ code, message }`** (`errorBodySchema`, `shared/src/api.ts:14`), because `web/src/api.ts:66` parses exactly that (decision 3). The handler, in order:

1. `hasZodFastifySchemaValidationErrors(error)` → 400 `invalid_request`, with the message `parse()` builds today: the first issue's path and message, `path: message`, with `request: message` when the path is empty, and **never the value** (`reply.ts:11-17`). The provider's `instancePath` `/id` becomes `id`.
2. `isResponseSerializationError(error)` → 500 `internal`, logged with the method and URL, never shown (the message today is "Lantern hit an error; see its log", `app.ts:156`).
3. Fastify's own 4xx (bad JSON, body too large, wrong media type) → its status and the three messages `app.ts:158-167` gives, which must not quote the body.
4. Anything else → 500 `internal`, logged with `{ name, code }` only (`app.ts:147`), no detail to the client.

The 404 handler stays in `app.ts` with the page, and isn't rate-limited: `@fastify/rate-limit` is not a dependency.

### The `server.ts` / `app.ts` split, and the entry file

`server.ts`:

1. `loadEnvFile()` and `loadConfig()`. A `ConfigError` goes to stderr and the process exits 1, before any logger exists (`index.ts:32-36` today).
2. `buildApp({ …, logger: true, server: { connectionTimeout, requestTimeout, keepAliveTimeout, trustProxy } })`. `AppOptions` gains `server`, spread into `Fastify()`. `rewriteUrl`, `bodyLimit` and `logger` stay where they are.
3. `close-with-grace`, in place of the two signal handlers (`index.ts:56-66`).
4. `listen({ host, port })`.

`app.ts` registers in a fixed order: the errors plugin; the provider's two compilers; `server/src/plugins/auth`; then the features (`health`, `states`, `pool`, `sources`, `titles`, `cards`, `suggestions`, `lists`); then the page and the 404 handler. The `.js` import suffixes stay.

**Renaming the entry moves the built file** from `server/dist/index.js` to `server/dist/server.js`. These name it:

- `infrastructure/Dockerfile:111`: `CMD ["node", "server/dist/index.js"]`;
- the root `package.json:18`: `start`;
- `server/package.json`: `main` (line 7), `dev` (`tsx watch src/index.ts`, line 10), `start` (line 11).

No code imports `@lantern/server`. Q1 (a fact, 2026-11-10) settles how the service starts: pm2 is gone, every service runs in a container built from its repo's `infrastructure/Dockerfile` and started by a file path, and the build runs only `npm ci` and `npx tsc -b`, no tests or lint. So the `CMD` above is the start command, the rename is Lantern's own, and no owner step is needed (decision 6). Lantern's stack isn't deployed yet ([wiki/status.md](../../wiki/status.md), "Next (owner)", step 5), which makes now the cheapest moment.

### Timeouts: the longest response is not instant

`GET /v1/titles/:id/record` waits in the OMDb queue (one call a second, `OMDB_SPACING_MS = 1000`, `server/src/sources/queue.ts:20`), then `fetchJson` allows 10 s (`SOURCE_TIMEOUT_MS`, `server/src/sources/http.ts:31`), waits up to 5 s on a 429 (`MAX_RETRY_AFTER_MS`, line 33) and tries once more: **about 26 s** plus the queue, with no byte sent in between. `GET /v1/posters/:id` can fetch twice at 10 s each (`POSTER_TIMEOUT_MS`, `posters.ts:13`; the second fetch is the `large` fallback, `sources.ts:40`): about 20 s.

Fastify's `connectionTimeout` is the socket's idle time, so it **cuts a response that is still being computed**. Almanac's default of 10 s would break both routes. **The record route keeps its own `connectionTimeout`** (decision 7).

### Test impact

- 15 server test files with 97 `it` calls (104 tests in all with the web's), on vitest with `pool: "forks"` (`vitest.config.ts`; the include `*/src/**/*.test.{ts,tsx}` still matches nested folders).
- **8 files build the app with `buildApp({ dbPath: ":memory:", … })` directly**, and all 8 use `inject()`. There is no `startTestApp`; `testing.ts` holds `signIn`, `seedPool` and `TEST_ORIGIN`. Nine files import `testing.ts`.
- Moved tests need their relative imports updated. No test changes its assertions: none matches a validation message, and the 400 and 404 status assertions (`states.test.ts:62, 66, 106, 107`, `server/src/routes/titles.test.ts:56, 75`) must pass unchanged.
- The test files that read the decorated handles (`app.db`, `app.states`, `app.records`, `app.pool`, `app.accounts`: about 20 reads) switch to the handles `buildTestApp` returns (decision 8).
- New tests:
  - a reply that fails its response schema is a 500 `internal` with no detail (a route stubbed to return a wrong shape);
  - an extra field on a store row is stripped from a reply (the leak protection the schemas add);
  - a bad id and an unknown query key are still 400 `invalid_request`, with the `path: message` text;
  - an unsigned request to a route with a declared `200` is still a 401 with `{ code: "unauthorized", message }`, not a 500 (the trap above);
  - `repoRoot()` finds `package.json`, and `loadEnvFile()` reads a scratch `.env`.

## Owner decisions

Decided on 2026-11-10 unless marked as a default.

1. **`server/src/features/<name>/`** (Q23, decided 2026-11-10, technical call). As in the move map: eight features, three of them leaves.
2. **Typed plugin options and explicit registration** (Q24, decided 2026-11-10, technical call). The stores are built in `app.ts` and passed to each feature plugin as typed options (`FastifyPluginAsyncZod<Deps>`), as `registerTitleRoutes(app, { pool, states, records })` already does, and the features are registered by name in one list. The `app.decorate` calls for the tests (`db`, `states`, `records`, `pool`, `accounts`, `app.ts:120-133`) are removed (decision 8).
3. **The error body** (Q43, decided 2026-11-10, technical call). One error handler, keeping Lantern's body, `{ code, message }`, which its web parses and `shared/` defines. It passes Fastify's own 4xx through and never echoes a thrown message to the client. The skill prescribes the handler, not the shape.
4. **A response schema on every route, with one exemption** (Q25 and Q53, decided 2026-11-10, technical calls). Every route sends a response schema for the statuses its handler sends, except the poster route, which sends bytes with the upstream's content type and status. It gets a `conventions.json` entry with its reason (Q53: streams and binary routes are exempt that way).
5. **The CLIs sit beside their feature** (Q56, decided 2026-11-10, technical call). `seed.ts` stays at the root and its command is unchanged; `server/src/pool/cli.ts` moves with its feature to `server/src/features/pool/cli.ts`, and `server/src/sources/check.ts` to `server/src/features/sources/check.ts`. That changes one container command (`node server/dist/features/pool/cli.js`) and two npm scripts (`server/package.json:13-14`), in `docs/owner-setup.md:65, 109, 151`, `README.md:50`, the wiki (`status.md:47-48, 75`, `titles.md:47-48`, `source-calls.md:78-79`) and the three docstrings. **Nothing is deployed and the owner hasn't run the import in the container**, so now costs the least.
6. **The entry file** (Q1, decided 2026-11-10, fact). Rename to `server.ts`, and change the Dockerfile's `CMD`, the two scripts and `main` in the same commit. The deploy is left alone (it runs no tests or lint), and no owner step is needed for the start command.
7. **Timeouts and proxy** (technical call). **The record route keeps its `connectionTimeout`: 45_000**, above the route's worst case of about 26 s plus the OMDb queue; Almanac's 10 s would cut it. The skills library's brief should state that `connectionTimeout` must exceed the longest idle response.
   - `requestTimeout: 30_000` (the time to receive a request; every body is a few fields, `BODY_LIMIT` 64 kB);
   - `keepAliveTimeout: 125_000`, above Caddy's default two-minute idle keep-alive to its upstreams; check the deploy's Caddy snippet for its own `keepalive`;
   - `trustProxy`: loopback plus `AUTH_TRUSTED_PROXIES`, one list (`config.ts:100`), so `request.ip` in logs is the client. Ward's login lockout reads the socket itself, so this changes nothing there.
8. **No decorators as a test seam** (Q56, decided 2026-11-10, technical call). Tests pass dependencies as plugin options. `AppOptions` gains optional prebuilt `db`, `states`, `records`, `pool` and `accounts`, each defaulting to what `buildApp` builds from `dbPath` today. `server/src/testing.ts` gains `buildTestApp(options)`, which opens the `:memory:` database, builds the stores, passes them in and returns `{ app, db, states, records, pool, accounts }`. The tests that call `buildApp` directly (8 files) and the ones that read the decorated handles move to it; no assertion changes.
9. **The test runner** (Q27, decided 2026-11-10, technical call). vitest stays.
10. **Where schemas live** (Q55, decided 2026-11-10, technical call). A schema stays in `shared/` because the web imports it; a schema only the server uses lives in its feature folder. Every schema named in this brief is in `shared/` today.
11. **Logging and Fastify 5.12.8** (default). JSON as today, no `pino-pretty`; the 5.12.8 bump isn't in this brief.
12. **No PRs, no branches** (Q4, decided 2026-11-10, owner). One commit per step, straight on `main`.

## Files you OWN

- `server/src/**`: the moves, the new plugins, the schemas wired in, `buildTestApp` and the tests' switch to it.
- `server/package.json` (scripts, `main`, the new dependencies pinned) and `package-lock.json`.
- `shared/src/**`: only if a schema needs `.describe` or a status schema added, with its test. Input schemas don't change.
- `infrastructure/Dockerfile`: the `CMD` line.
- The root `package.json`: `start`, and `check:conventions` (dependency-cruiser added, `check-structure`'s `--warn-only` dropped). (2026-11-11, brief 15: dependency-cruiser landed there already, strict with no rule lowered; this brief keeps its cross-feature check and drops `check-structure`'s `--warn-only`.)
- `.dependency-cruiser.cjs` (from the skill's preset; it exists since brief 15, 2026-11-11) and `knip.config.js` (the entries).
- `eslint.config.js`: `no-process-env` (from `eslint-plugin-n`) from warning to error, and the CLI list for the new paths.
- `scripts/conventions.json`: the poster route (decision 4), and any other exception with its reason.
- `.claude/rules/server.md`: the structure lines.
- `docs/owner-setup.md`, `README.md`: the changed commands (decision 5).
- Corpus: [wiki/architecture.md](../../wiki/architecture.md) (the layout, the request path, the settings), [wiki/titles.md](../../wiki/titles.md), [wiki/source-calls.md](../../wiki/source-calls.md), [wiki/sign-in.md](../../wiki/sign-in.md) (the guard moved to `server/src/plugins/auth`), [wiki/decisions.md](../../wiki/decisions.md), [wiki/status.md](../../wiki/status.md), [log.md](../../log.md).

## Files you must NOT touch

- `web/`. A response schema that drops a field the web reads is a finding: fix the schema, not the web.
- `shared/` input schemas and their behaviour.
- `server/vendor/`: generated.
- The deploy beyond the `CMD` line. Nothing in vps-deploy changes (Q1).
- Behaviour: status codes, error codes and messages, and every route's JSON apart from fields the comparison shows were leaks.
- The suggestion scoring's arithmetic, the OMDb queue and cache rules, the migrations.

## What to do

Follow `migrating-a-server.md`. One commit per step, straight on `main`; after each, `npm run check` and `npm run build` pass, and `npm start` serves `GET /lantern-api/v1/health`.

1. **Before.**
   - Run `check-structure` strict and record its counts by rule.
   - On a scratch `LANTERN_DB`, import the fixtures (`npm run titles:import -w @lantern/server -- --from server/src/pool/fixtures --min-votes 1`), seed a throwaway user, rate and mark a few titles through the API, and **with no `OMDB_API_KEY`**. Save the JSON of every route above, signed in, with fixed query values; for the record route save the 503 body; for a poster save the 404 body.
2. **`config.ts` and the split.** The new helpers in `config.ts`, and their tests (including the `repoRoot()` one). The four CLIs and the entry use them, and no copy of `REPO_ROOT` is left. `index.ts` becomes `server.ts`, with the entry changes (decision 6), `close-with-grace`, the timeouts and `trustProxy` (decision 7: `connectionTimeout` stays 45_000). `no-process-env` (from `eslint-plugin-n`) now finds nothing: make it an error.
3. **The error plugin, and `server/src/plugins/auth`.** `server/src/plugins/errors.ts` with `fail()`; the guard, the 401 rewrite, the origin hook and `currentUserId` in `server/src/plugins/auth/index.ts`; `accounts.ts` and `auth.test.ts` beside it. Add `buildTestApp` and the optional prebuilt stores here, and move the tests to it (decision 8); every assertion passes unchanged. Fix the vendor import depth.
4. **Feature folders.** Use `git mv`, file by file per the map, so history follows. Leaves first: `states`, `pool`, `sources`; then `titles`, `cards`, `suggestions`, `lists`, `health`. Add the `index.ts` files. Update the CLI commands and docs (decision 5). (`.dependency-cruiser.cjs` exists since brief 15.) Check that a deliberate import of `server/src/features/states/store.js` from `server/src/features/lists/` fails it and that a leaf importing a dependent fails it.
5. **The type provider and the schemas, one feature per commit:** health, states, pool, sources, titles, cards, suggestions, lists. Each commit:
   - declares params, querystring, body and the response statuses the handler sends;
   - removes that feature's `parse(...)` calls;
   - types the plugin as `FastifyPluginAsyncZod`;
   - adds the new tests that apply.
   Do the unsigned-request test (the declared-status trap) in the first commit that declares a `200`.
6. **After.** Save the same JSON again and diff it against step 1's. A field that disappeared is a leak (keep it dropped and list it) or a missing schema field (add it). Put the diff's summary in the `log.md` entry.
7. **Strict.** Drop `check-structure`'s `--warn-only` and make dependency-cruiser part of `check:conventions`.
8. **Corpus.**
   - Add a [wiki/decisions.md](../../wiki/decisions.md) entry adopting the structure, with what was rejected (the layer split Lantern started with, autoload, TypeBox) and why, and a line on the timeouts' evidence.
   - Update the pages under Files you OWN and `.claude/rules/server.md`, run `bash corpus/lint.sh --index` and then `bash corpus/lint.sh` until it is clean.

## Acceptance

- [ ] `check-structure` passes **strict**, with any exception in `scripts/conventions.json` and its reason. Its counts before and after are in the outcome note, for the skills library's brief 16 table, with the `parse(` helper finding.
- [ ] `grep -rnE "(^|[^.\w])parse\(\w+Schema, request\." server/src` prints nothing, and every route in the table has a `schema` with the response statuses listed.
- [ ] `grep -rn "process\.env" server/src --include=*.ts | grep -v "\.test\.ts"` prints only `config.ts`, and `no-process-env` (from `eslint-plugin-n`) is an error.
- [ ] `grep -rn "REPO_ROOT\|loadEnvFile" server/src --include=*.ts | grep -v config` prints nothing, and the `repoRoot()` test passes.
- [ ] The five new tests in "Test impact" pass, along with every existing test unchanged.
- [ ] The before and after JSON comparison is in `log.md`, with every dropped field named.
- [ ] `npm run build` writes `server/dist/server.js` and `server/dist/features/pool/cli.js`. `docker build -f infrastructure/Dockerfile .` succeeds, the container answers its health check, and `docker run … node server/dist/features/pool/cli.js --help`-style invocation reaches `main` (a bad `--min-votes` prints its error). No vps-deploy change is needed (decision 6).
- [ ] `grep -rn "app\.decorate\|app\.\(db\|states\|records\|pool\|accounts\)\b" server/src --include=*.ts` prints nothing: no decorator is left as a test seam.
- [ ] A scratch request to `/v1/titles/<id>/record` that takes 20 s (a stubbed slow fetch) completes under `connectionTimeout: 45_000` and would be cut under 10 s, shown by a test or a recorded run.
- [ ] dependency-cruiser fails on a deliberate cross-feature import and passes clean.
- [ ] `npm run check` passes, and `bash corpus/lint.sh` ends clean.

## Interplay

- Brief 15's `eslint.config.js` CLI list and `knip.json` entries change here with the paths.
- Brief 17's screenshot recipe imports the fixtures from `server/src/pool/fixtures`; after this brief they live under `server/src/features/pool/fixtures`.
- The record route's `connectionTimeout` (decision 7) is the one setting not to copy from other servers' briefs.
- The skills library should hear about three findings before the other servers run its brief 16: a declared `401` or `403` response schema turns the guard's reply into a 500; `connectionTimeout` cuts a response still being computed, so the default can't be one number; and the checker's `.parse(request.` pattern misses a repo that parses through a helper.
