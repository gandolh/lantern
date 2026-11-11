import { z } from "zod";
import { wardClientOptionsFromEnv, type WardClientOptions } from "../vendor/ward/ward-auth.js";

/** Where the auth plugin's routes sit as Fastify sees them; the browser reaches them under the API prefix. */
export const AUTH_ROUTE_PREFIX = "/auth";

/** The Ward callback, under the API prefix: `WARD_OIDC_REDIRECT_URI` is the origin, the prefix, then this. */
export const WARD_CALLBACK_PATH = `${AUTH_ROUTE_PREFIX}/ward/callback`;

/** The Vite dev server, where the page runs in development. */
export const DEV_ORIGIN = "http://localhost:5180";

/** The server's settings, read once at startup from the environment (and the repo's `.env`). */
export interface Config {
  host: string;
  port: number;
  /** `LANTERN_DB` as given, or undefined for the repo's `data/lantern.sqlite`. */
  dbPath: string | undefined;
  /** The page's own origin as the browser sees it, bare. Default is the Vite dev server. */
  publicOrigin: string;
  /** The API prefix as the browser sees it. Default `/lantern-api`. */
  apiPrefix: string;
  /** The page's base path, with a trailing slash. Default `/lantern/`. */
  webBase: string;
  /** "Sign in with Ward", or undefined for local accounts only. `clientKey` is a secret. */
  ward: WardClientOptions | undefined;
  /** `AUTH_TRUSTED_PROXIES`: peers besides loopback whose `X-Forwarded-For` the login lockout believes. */
  trustedProxies: string[];
  /** `OMDB_API_KEY`. A secret: never log it. */
  omdbApiKey: string | undefined;
}

/** The environment cannot run the server. The message names every variable at fault. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/** An empty value (`KEY=` copied from `.env.example`) counts as not set. */
export const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), schema.optional());

const envSchema = z.object({
  HOST: optional(z.string().trim()).transform((value) => value ?? "127.0.0.1"),
  PORT: optional(
    z.coerce.number<string>().int().min(1).max(65535, { message: "PORT must be a port number (1-65535)." }),
  ).transform((value) => value ?? 8810),
  LANTERN_DB: optional(z.string().trim()),
  // The messages never repeat a key's value.
  OMDB_API_KEY: optional(
    z.string().trim().regex(/^\S+$/, { message: "OMDB_API_KEY must be one value with no spaces." }),
  ),
  PUBLIC_ORIGIN: optional(
    z.string().refine((value) => URL.canParse(value) && new URL(value).origin === value, {
      message: "PUBLIC_ORIGIN must be a bare origin such as https://example.com: no path and no trailing slash.",
    }),
  ).transform((value) => value ?? DEV_ORIGIN),
  LANTERN_API_PREFIX: optional(
    z.string().regex(/^\/[^\s?#]*[^/\s?#]$/, {
      message: "LANTERN_API_PREFIX must be a path such as /lantern-api: a leading slash and no trailing slash.",
    }),
  ).transform((value) => value ?? "/lantern-api"),
  LANTERN_BASE: optional(
    z.string().regex(/^\/([^\s?#]*\/)?$/, {
      message: "LANTERN_BASE must be a path such as /lantern/: a leading and a trailing slash.",
    }),
  ).transform((value) => value ?? "/lantern/"),
});

/** One line per problem, starting with the variable's name. Never the value. */
export function describeIssue(issue: z.core.$ZodIssue): string {
  const key = String(issue.path[0] ?? "");
  return issue.message.startsWith(key) ? issue.message : `${key}: ${issue.message}`;
}

/**
 * The Ward settings, read by the library's own reader so the rules are its
 * (an empty `WARD_OIDC_ISSUER` means off; with it set, the client id, key and
 * redirect URI must be too). On top: the redirect URI must be the callback
 * under the API prefix, where the session cookie and the dev proxy are.
 * Messages never repeat the key.
 */
function wardSettings(
  env: NodeJS.ProcessEnv,
  apiPrefix: string | undefined,
  problems: string[],
): WardClientOptions | undefined {
  let ward: WardClientOptions | undefined;
  try {
    ward = wardClientOptionsFromEnv(env);
  } catch (error) {
    problems.push(
      `${error instanceof Error ? error.message : String(error)}. Set all of them, or leave WARD_OIDC_ISSUER empty for local accounts only.`,
    );
    return undefined;
  }
  if (ward === undefined || apiPrefix === undefined) return ward;
  const expected = `${apiPrefix}${WARD_CALLBACK_PATH}`;
  if (!URL.canParse(ward.redirectUri) || new URL(ward.redirectUri).pathname !== expected) {
    problems.push(
      `WARD_OIDC_REDIRECT_URI must be the callback as the browser reaches it: the page's origin, then ${expected}.`,
    );
  }
  return ward;
}

/** `AUTH_TRUSTED_PROXIES`, comma-separated, blanks dropped. The plugin checks each entry when it registers. */
function trustedProxies(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");
}

/** The settings from `env`, or a `ConfigError` naming every variable that is wrong. */
export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const problems: string[] = [];
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) problems.push(...parsed.error.issues.map(describeIssue));
  const ward = wardSettings(env, parsed.success ? parsed.data.LANTERN_API_PREFIX : undefined, problems);
  if (!parsed.success || problems.length > 0) throw new ConfigError(problems.join("\n"));
  const values = parsed.data;
  return {
    host: values.HOST,
    port: values.PORT,
    dbPath: values.LANTERN_DB,
    publicOrigin: values.PUBLIC_ORIGIN,
    apiPrefix: values.LANTERN_API_PREFIX,
    webBase: values.LANTERN_BASE,
    ward,
    trustedProxies: trustedProxies(env.AUTH_TRUSTED_PROXIES),
    omdbApiKey: values.OMDB_API_KEY,
  };
}
