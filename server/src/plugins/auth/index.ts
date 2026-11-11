import type { ErrorBody } from "@lantern/shared";
import type { FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { createWardClient, wardAuth, type Accounts, type WardClientOptions } from "../../../vendor/ward/ward-auth.js";
import { AUTH_ROUTE_PREFIX } from "../../config.js";
import { fail } from "../errors.js";
import { USER_ROLE } from "./accounts.js";

/** The session cookie's name. Unique in the estate: every app shares one origin. */
export const SESSION_COOKIE = "lantern_session";

const WRITES = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const UNAUTHORIZED = "sign in to Lantern first";

/** A path is `prefix` or under it. */
export function isUnder(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/** A URL without its query string. */
export function pathOf(url: string): string {
  return url.split("?")[0] ?? url;
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

/** The signed-in user's id. Every route under `/v1` is behind the guard, which sets `auth`. */
export function currentUserId(request: FastifyRequest): string {
  const auth = request.auth;
  if (auth === null) throw new Error("a route ran without a session");
  return auth.user.id;
}

export interface AuthOptions {
  accounts: Accounts;
  /** "Sign in with Ward". Unset, local accounts only. */
  ward: WardClientOptions | undefined;
  /** The page's origin as the browser sees it. */
  publicOrigin: string;
  /** The API prefix as the browser sees it: every request that needs the session is under it. */
  apiPrefix: string;
  /** The page's base path, with a trailing slash. */
  webBase: string;
  /** Peers besides loopback whose `X-Forwarded-For` the login lockout believes. */
  trustedProxies: readonly string[];
}

/**
 * The session guard, the sign-in routes under `/auth` (the vendored ward-auth
 * plugin), the 401 rewrite and the Origin check on writes. Wrapped in
 * `fastify-plugin`, so its hooks guard every route registered after it: the
 * guard comes first, so a signed-out request never reaches a handler.
 */
export const authPlugin = fp<AuthOptions>(
  async (app, options) => {
    const { accounts, publicOrigin, apiPrefix, webBase } = options;
    // Checks the settings and imports the key now; talks to Ward only on first use, so Lantern starts while Ward is down.
    const ward = options.ward && (await createWardClient(options.ward));
    await app.register(wardAuth, {
      accounts,
      cookieName: SESSION_COOKIE,
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
      trustedProxies: options.trustedProxies,
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
    // shape for its hooks. A route declares no 401 response schema: the guard
    // answers from a hook, and a schema would run its body through the serializer.
    app.addHook("onSend", async (request, reply, payload) => {
      if (reply.statusCode !== 401 || typeof payload !== "string" || !isUnder(pathOf(request.url), "/v1")) {
        return payload;
      }
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
  },
  { name: "lantern-auth" },
);
