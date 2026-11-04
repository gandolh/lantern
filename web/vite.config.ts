import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type ProxyOptions } from "vite";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The page lives at `/lantern/` and reaches the API at `/lantern-api`, locally
 * and on the VPS alike, so one build runs in both places. `LANTERN_BASE` moves
 * the page (the deploy passes it); the API path is fixed in src/base.ts.
 *
 * In dev the page runs on Vite's server at http://localhost:5180/lantern/ and
 * reaches the API through this proxy, which strips the prefix the way Caddy
 * does, so the browser sees one origin.
 *
 * The server refuses a write whose `Origin` isn't its PUBLIC_ORIGIN
 * (`http://localhost:5180` by default). So a request whose `Origin` is exactly
 * the address the browser opened this server at (its `Host`, say a LAN address
 * on the phone) reaches the API with PUBLIC_ORIGIN instead. Any other `Origin`
 * passes through untouched and is refused, as in production.
 */
function devProxy(env: Record<string, string>): Record<string, ProxyOptions> {
  const publicOrigin = env.PUBLIC_ORIGIN || "http://localhost:5180";
  return {
    "/lantern-api": {
      target: `http://127.0.0.1:${env.PORT || 8810}`,
      rewrite: (url) => url.replace(/^\/lantern-api(?=\/|\?|$)/, "") || "/",
      configure: (proxy) => {
        proxy.on("proxyReq", (proxyReq, req) => {
          const { origin, host } = req.headers;
          if (typeof origin === "string" && typeof host === "string" && origin === `http://${host}`) {
            proxyReq.setHeader("origin", publicOrigin);
          }
        });
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, REPO_ROOT, "");
  const rawBase = process.env.LANTERN_BASE || env.LANTERN_BASE || "/lantern/";
  // Assets and the server's fallback both assume exactly one trailing slash.
  const base = `${rawBase.replace(/\/+$/, "")}/`;

  return {
    base,
    plugins: [react()],
    server: { port: 5180, strictPort: true, proxy: devProxy(env) },
    preview: { port: 4180, strictPort: true, proxy: devProxy(env) },
  };
});
