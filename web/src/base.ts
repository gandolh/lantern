/**
 * Where the API is, as the browser sees it: Caddy (and the Vite dev proxy)
 * forward `/lantern-api/*` to the server with the prefix stripped, and the
 * server strips it itself when reached directly, so one build runs in both
 * places.
 */
export const API_BASE = "/lantern-api";

/**
 * The page's root path, with one trailing slash: `/lantern/` unless the build
 * set `LANTERN_BASE` (vite.config.ts). Read on every call, not once at load,
 * so tests can stub `import.meta.env.BASE_URL`.
 */
export function appBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : `${base}/`;
}
