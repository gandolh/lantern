import { z } from "zod";

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
  PORT: optional(z.coerce.number<string>().int().min(1).max(65535, { message: "PORT must be a port number (1-65535)." })).transform(
    (value) => value ?? 8810,
  ),
  LANTERN_DB: optional(z.string().trim()),
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

/** The settings from `env`, or a `ConfigError` naming every variable that is wrong. */
export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) throw new ConfigError(parsed.error.issues.map(describeIssue).join("\n"));
  const values = parsed.data;
  return {
    host: values.HOST,
    port: values.PORT,
    dbPath: values.LANTERN_DB,
    publicOrigin: values.PUBLIC_ORIGIN,
    apiPrefix: values.LANTERN_API_PREFIX,
    webBase: values.LANTERN_BASE,
  };
}
