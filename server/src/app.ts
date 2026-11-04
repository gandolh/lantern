import { existsSync } from "node:fs";
import type { ErrorBody, HealthResponse } from "@lantern/shared";
import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyServerOptions } from "fastify";
import type { z } from "zod";
import { openDatabase, type Db } from "./db.js";

/**
 * The Lantern API. Every route is under `/v1`; `GET /v1/health` is open for
 * the deploy's check. The built page is served at `/lantern/` (in production
 * Caddy serves it instead), and `/` redirects there.
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

export function fail(reply: FastifyReply, status: number, body: ErrorBody): FastifyReply {
  return reply.status(status).send(body);
}

/** Parse with a contract schema, or answer 400 and return undefined. Messages name the field, never its value. */
export function parse<S extends z.ZodType>(schema: S, value: unknown, reply: FastifyReply): z.output<S> | undefined {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  void fail(reply, 400, {
    code: "invalid_request",
    message: issue ? `${issue.path.join(".") || "request"}: ${issue.message}` : "invalid request",
  });
  return undefined;
}

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
  /** The clock, in epoch milliseconds, for tests. */
  now?: () => number;
  logger?: FastifyServerOptions["logger"];
}

declare module "fastify" {
  interface FastifyInstance {
    /** The database, for the tests. */
    db: Db;
  }
}

export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const db = openDatabase(options.dbPath);
  const apiPrefix = options.apiPrefix ?? API_PREFIX;
  const webBase = options.webBase ?? PAGE_PATH;
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

  app.get("/v1/health", async (): Promise<HealthResponse> => ({ ok: true }));

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

