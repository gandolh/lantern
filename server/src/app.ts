import { existsSync } from "node:fs";
import type { ErrorBody, HealthResponse } from "@lantern/shared";
import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyServerOptions } from "fastify";
import { createWardClient, wardAuth, type Accounts, type WardClientOptions } from "../vendor/ward/ward-auth.js";
import { openAccounts, USER_ROLE } from "./accounts.js";
import { AUTH_ROUTE_PREFIX, DEV_ORIGIN } from "./config.js";
import { openDatabase, type Db } from "./db.js";
import { fail } from "./reply.js";
import { registerSourceRoutes } from "./routes/sources.js";
import { registerStateRoutes } from "./routes/states.js";
import { createSourceCache } from "./sources/cache.js";
import type { FetchLike } from "./sources/http.js";
import { createOmdbClient, type OmdbClient } from "./sources/omdb.js";
import { createTmdbClient, type TmdbClient } from "./sources/tmdb.js";
import { createSources, type Sources } from "./sources/titles.js";
import { createStatesStore, type StatesStore } from "./states.js";

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

/** The session cookie's name. Unique in the estate: every app shares one origin. */
export const SESSION_COOKIE = "lantern_session";

/** The largest request body accepted: every write is a few fields. */
export const BODY_LIMIT = 64 * 1024;

/** A URL without a leading API prefix, when `/`, `?` or the end follows it; any other URL as it is. */
export function stripApiPrefix(url: string, prefix: string = API_PREFIX): string {
  if (!url.startsWith(prefix)) return url;
  const rest = url.slice(prefix.length);
  if (rest === "") return "/";
  if (rest.startsWith("/")) return rest;
  if (rest.startsWith("?")) return `/${rest}`;
  return url;
}

/** A path is `prefix` or under it. */
export function isUnder(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function pathOf(url: string): string {
  return url.split("?")[0]!;
}

/**
 * Whether a browser said the request came from this origin. Absent headers
 * pass (a script or curl sends neither); a browser that sent them and named
 * another site does not. On top of the cookie's `SameSite=Lax`, for writes.
 */
export function sameOrigin(request: FastifyRequest, publicOrigin: string): boolean {
  const fetchSite = request.headers["sec-fetch-site"];
  if (typeof fetchSite === "string" && fetchSite !== "" && fetchSite !== "same-origin") return false;
  const origin = request.headers.origin;
  if (typeof origin === "string" && origin !== "") {
    try {
      return new URL(origin).origin === publicOrigin;
    } catch {
      return false;
    }
  }
  return true;
}

const WRITES = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const UNAUTHORIZED = "sign in to Lantern first";

export interface AppOptions {
  /** A file path, or `:memory:` for tests. */
  dbPath: string;
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
  /** `TMDB_API_KEY`. Unset, the routes that need TMDB answer 503 `no_key`. */
  tmdbApiKey?: string;
  /** `OMDB_API_KEY`. Unset, a title's scores answer 503 `no_key`. */
  omdbApiKey?: string;
  /** Tests: clients with a fake `fetch` and no spacing, in place of the real ones. */
  tmdb?: TmdbClient;
  omdb?: OmdbClient;
  /** Tests: the `fetch` the poster proxy uses. */
  imageFetch?: FetchLike;
  /** The clock, in epoch milliseconds, for tests. */
  now?: () => number;
  logger?: FastifyServerOptions["logger"];
}

declare module "fastify" {
  interface FastifyInstance {
    /** The database, for the tests. */
    db: Db;
    /** The local accounts, for the seed's tests. */
    accounts: Accounts;
    /** The states store, for the tests. */
    states: StatesStore;
    /** The outside sources, for the tests. */
    sources: Sources;
  }
}

export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const db = openDatabase(options.dbPath);
  const apiPrefix = options.apiPrefix ?? API_PREFIX;
  const webBase = options.webBase ?? PAGE_PATH;
  const publicOrigin = options.publicOrigin ?? DEV_ORIGIN;
  const app = Fastify({
    logger: options.logger ?? false,
    bodyLimit: BODY_LIMIT,
    rewriteUrl: (request) => stripApiPrefix(request.url ?? "/", apiPrefix),
  });
  app.decorate("db", db);
  app.addHook("onClose", async () => {
    db.close();
  });

  // Fastify's own 4xx (bad JSON, a body too large) in the contract's shape.
  // A JSON parse error's message can quote the body, so it is never passed on.
  app.setErrorHandler((error: Error & { statusCode?: number; code?: string }, request, reply) => {
    const status = error.statusCode ?? 500;
    if (status >= 500) {
      request.log.error({ err: { name: error.name, code: error.code } }, "unhandled error");
      return fail(reply, 500, { code: "internal", message: "Lantern hit an error; see its log" });
    }
    const message =
      error.code === "FST_ERR_CTP_INVALID_JSON_BODY" || error.name === "SyntaxError"
        ? "the body is not valid JSON"
        : error.code === "FST_ERR_CTP_BODY_TOO_LARGE"
          ? `the body is larger than ${BODY_LIMIT} bytes`
          : error.code === "FST_ERR_CTP_INVALID_MEDIA_TYPE"
            ? "send the body as application/json"
            : "the request is not valid";
    return fail(reply, status, { code: "invalid_request", message });
  });

  // The session guard, first, so every route after it is behind it.
  const accounts = openAccounts(db);
  app.decorate("accounts", accounts);
  // Checks the settings and imports the key now; talks to Ward only on first use, so Lantern starts while Ward is down.
  const ward = options.ward && (await createWardClient(options.ward));
  await app.register(wardAuth, {
    accounts,
    cookieName: SESSION_COOKIE,
    // The API prefix as the browser sees it: every request that needs the session is under it.
    cookiePath: apiPrefix,
    publicOrigin,
    routePrefix: AUTH_ROUTE_PREFIX,
    publicRoutes: ["GET /v1/health"],
    // The page offers no rename, and the seed matches accounts by name.
    allowRename: false,
    isPublic: (request) => {
      const path = pathOf(request.url);
      // Every API route needs a session; the plugin's own list decides under /auth.
      if (isUnder(path, "/v1") || isUnder(path, AUTH_ROUTE_PREFIX)) return false;
      // The page's files, the redirect to them and a 404: the login page has to load.
      return true;
    },
    trustedProxies: options.trustedProxies ?? [],
    ...(ward && {
      ward: {
        client: ward,
        loginPath: `${webBase}login`,
        settingsPath: `${webBase}account`,
        afterSignInPath: webBase,
        roleFor: () => USER_ROLE,
      },
    }),
  });

  // The guard answers `{ error: "unauthorized" }`; under `/v1` the contract's
  // error shape is `{ code, message }`. The sign-in routes keep the plugin's
  // shape for its hooks.
  app.addHook("onSend", async (request, reply, payload) => {
    if (reply.statusCode !== 401 || typeof payload !== "string" || !isUnder(pathOf(request.url), "/v1")) return payload;
    let body: unknown;
    try {
      body = JSON.parse(payload);
    } catch {
      return payload;
    }
    if (typeof body !== "object" || body === null || !("error" in body) || "code" in body) return payload;
    const refused: ErrorBody = { code: "unauthorized", message: UNAUTHORIZED };
    return JSON.stringify(refused);
  });

  // Writes refuse a browser that says it came from another site. Runs after
  // the guard, so a signed-out write is a 401 first.
  app.addHook("onRequest", async (request, reply) => {
    if (!WRITES.has(request.method) || !isUnder(pathOf(request.url), "/v1")) return;
    if (sameOrigin(request, publicOrigin)) return;
    return fail(reply, 403, { code: "cross_site", message: "open Lantern from its own address" });
  });

  app.get("/v1/health", async (): Promise<HealthResponse> => ({ ok: true }));

  const states = createStatesStore(db, options.now);
  app.decorate("states", states);
  registerStateRoutes(app, states);

  const sources = createSources({
    tmdb: options.tmdb ?? createTmdbClient({ apiKey: options.tmdbApiKey }),
    omdb: options.omdb ?? createOmdbClient({ apiKey: options.omdbApiKey }),
    cache: createSourceCache(db, options.now),
  });
  app.decorate("sources", sources);
  registerSourceRoutes(app, sources, options.imageFetch ?? globalThis.fetch);

  // The built page at `webBase`; any other path under it is the page too (index.html).
  const webDist = options.webDist;
  const serving = webDist !== undefined && existsSync(webDist);
  if (serving) await app.register(fastifyStatic, { root: webDist, prefix: webBase });
  if (webBase !== "/") app.get("/", async (_request, reply) => reply.redirect(webBase));
  app.setNotFoundHandler((request, reply) => {
    const path = pathOf(request.url);
    if (serving && request.method === "GET" && webBase !== "/" && path === webBase.slice(0, -1)) return reply.redirect(webBase);
    if (serving && (request.method === "GET" || request.method === "HEAD") && path.startsWith(webBase)) {
      return reply.sendFile("index.html");
    }
    return fail(reply, 404, { code: "not_found", message: `no route ${request.method} ${path}` });
  });

  return app;
}

