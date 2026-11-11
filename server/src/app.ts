import { existsSync } from "node:fs";
import fastifyStatic from "@fastify/static";
import { serializerCompiler, validatorCompiler } from "@fastify/type-provider-zod";
import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";
import type { Accounts, WardClientOptions } from "../vendor/ward/ward-auth.js";
import { DEV_ORIGIN } from "./config.js";
import { openDatabase, type Db } from "./db.js";
import { authPlugin, pathOf } from "./plugins/auth/index.js";
import { openAccounts } from "./plugins/auth/accounts.js";
import { BODY_LIMIT, errorsPlugin, fail } from "./plugins/errors.js";
import { registerCardRoutes } from "./features/cards/index.js";
import { healthRoutes } from "./features/health/index.js";
import { registerListRoutes } from "./features/lists/index.js";
import { createPool, registerPoolRoutes, type Pool } from "./features/pool/index.js";
import {
  createOmdbClient,
  createRecordCache,
  createRecords,
  registerSourceRoutes,
  type FetchLike,
  type OmdbClient,
  type Records,
} from "./features/sources/index.js";

import { registerTitleRoutes } from "./features/titles/index.js";
import { createStatesStore, registerStateRoutes, type StatesStore } from "./features/states/index.js";
import { createSuggester, registerSuggestionRoutes } from "./features/suggestions/index.js";

/**
 * The Lantern API. Every route is under `/v1` and needs a signed-in session,
 * except `GET /v1/health`, open for the deploy's check. Sign-in lives under
 * `/auth`, from the vendored ward-auth plugin: local accounts and "Sign in
 * with Ward", no sign-up. Writes under `/v1` also refuse a browser that says
 * it came from another site. The built page is served at `/lantern/` (in
 * production Caddy serves it instead), and `/` redirects there.
 *
 * The browser reaches the API under `/lantern-api`; Caddy strips that prefix
 * in production, and this server strips it too (`stripApiPrefix`), so the
 * same build works behind Caddy and on its own.
 *
 * Nothing here logs a body: Fastify's request log has the method and URL,
 * never the headers or the payload.
 */

/** The API prefix as the browser sees it, unless `LANTERN_API_PREFIX` moves it. */
export const API_PREFIX = "/lantern-api";
/** Where the built page is served, unless `LANTERN_BASE` moves it. */
export const PAGE_PATH = "/lantern/";

/** A URL without a leading API prefix, when `/`, `?` or the end follows it; any other URL as it is. */
export function stripApiPrefix(url: string, prefix: string = API_PREFIX): string {
  if (!url.startsWith(prefix)) return url;
  const rest = url.slice(prefix.length);
  if (rest === "") return "/";
  if (rest.startsWith("/")) return rest;
  if (rest.startsWith("?")) return `/${rest}`;
  return url;
}

export interface AppOptions {
  /** A file path, or `:memory:` for tests. Ignored when `db` is given. */
  dbPath?: string;
  /**
   * Prebuilt dependencies, each defaulting to what `buildApp` builds from `dbPath` and the options below.
   * `buildTestApp` passes them so a test holds the same handles the routes use.
   */
  db?: Db;
  accounts?: Accounts;
  states?: StatesStore;
  records?: Records;
  pool?: Pool;
  /** The built page, served at `webBase`; skipped when the directory does not exist. */
  webDist?: string;
  /** The page's origin as the browser sees it. Default `http://localhost:5180`, the Vite dev server. */
  publicOrigin?: string;
  /** The API prefix as the browser sees it. Default `/lantern-api`. */
  apiPrefix?: string;
  /** The page's base path, with a trailing slash. Default `/lantern/`. */
  webBase?: string;
  /** "Sign in with Ward". Unset, local accounts only. */
  ward?: WardClientOptions;
  /** Peers besides loopback whose `X-Forwarded-For` the login lockout believes. Default none. */
  trustedProxies?: readonly string[];
  /** `OMDB_API_KEY`. Unset, what needs OMDb answers 503 `no_key`. */
  omdbApiKey?: string;
  /** Tests: a client with a fake `fetch` and no spacing, in place of the real one. */
  omdb?: OmdbClient;
  /** Tests: the `fetch` the poster proxy uses. */
  posterFetch?: FetchLike;
  /** The clock, in epoch milliseconds, for tests. */
  now?: () => number;
  logger?: FastifyServerOptions["logger"];
  /** The process's own Fastify settings: timeouts and `trustProxy`. Only the entry sets them. */
  server?: Pick<FastifyServerOptions, "connectionTimeout" | "requestTimeout" | "keepAliveTimeout" | "trustProxy">;
}

/** The stores one app works on, built from its database and options. */
export interface Stores {
  accounts: Accounts;
  states: StatesStore;
  records: Records;
  pool: Pool;
}

export function createStores(db: Db, options: AppOptions): Stores {
  return {
    accounts: options.accounts ?? openAccounts(db),
    states: options.states ?? createStatesStore(db, options.now),
    records:
      options.records ??
      createRecords({
        omdb: options.omdb ?? createOmdbClient({ apiKey: options.omdbApiKey }),
        cache: createRecordCache(db, options.now),
      }),
    pool: options.pool ?? createPool(db),
  };
}

export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const db = options.db ?? openDatabase(options.dbPath ?? ":memory:");
  const { accounts, states, records, pool } = createStores(db, options);
  const apiPrefix = options.apiPrefix ?? API_PREFIX;
  const webBase = options.webBase ?? PAGE_PATH;
  const publicOrigin = options.publicOrigin ?? DEV_ORIGIN;
  const app = Fastify({
    ...options.server,
    logger: options.logger ?? false,
    bodyLimit: BODY_LIMIT,
    rewriteUrl: (request) => stripApiPrefix(request.url ?? "/", apiPrefix),
  });
  app.addHook("onClose", async () => {
    db.close();
  });

  // The zod compilers go on the root before any plugin, so every route declares its schemas with zod.
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Registered in this order: the error handler; the session guard, so every route after it is behind it;
  // then the features.
  await app.register(errorsPlugin);
  await app.register(authPlugin, {
    accounts,
    ward: options.ward,
    publicOrigin,
    apiPrefix,
    webBase,
    trustedProxies: options.trustedProxies ?? [],
  });

  await app.register(healthRoutes);
  registerStateRoutes(app, states);
  registerSourceRoutes(app, records, options.posterFetch ?? globalThis.fetch);
  registerPoolRoutes(app, pool);
  registerTitleRoutes(app, { pool, states, records });
  registerCardRoutes(app, { db, records });
  registerSuggestionRoutes(app, { suggester: createSuggester(db, states), pool, records });
  registerListRoutes(app, { states, pool, records });

  // The built page at `webBase`; any other path under it is the page too (index.html).
  const webDist = options.webDist;
  const serving = webDist !== undefined && existsSync(webDist);
  if (serving) await app.register(fastifyStatic, { root: webDist, prefix: webBase });
  if (webBase !== "/") app.get("/", async (_request, reply) => reply.redirect(webBase));
  app.setNotFoundHandler((request, reply) => {
    const path = pathOf(request.url);
    if (serving && request.method === "GET" && webBase !== "/" && path === webBase.slice(0, -1))
      return reply.redirect(webBase);
    if (serving && (request.method === "GET" || request.method === "HEAD") && path.startsWith(webBase)) {
      return reply.sendFile("index.html");
    }
    return fail(reply, 404, { code: "not_found", message: `no route ${request.method} ${path}` });
  });

  return app;
}
