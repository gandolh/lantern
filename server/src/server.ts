import { resolve } from "node:path";
import closeWithGrace from "close-with-grace";
import { buildApp } from "./app.js";
import { ConfigError, loadConfig, loadEnvFile, repoRoot, resolveDbPath, type Config } from "./config.js";

/**
 * Start Lantern: the API under `/v1`, on 127.0.0.1:8810 by default. Locally
 * the owner runs it with `npm run dev` or `npm start`; on the VPS it is the
 * `lantern-api` container.
 *
 * Settings come from the environment, and from the repo root's `.env` for
 * what the environment leaves unset. `config.ts` lists them and stops the
 * start with a message naming any that is wrong. The database is `LANTERN_DB`,
 * or `data/lantern.sqlite` under the repo root.
 *
 * The server does work only while answering a request: no timers, no
 * scheduled jobs, so the container can sleep when nobody is using it.
 */

loadEnvFile();

let config: Config;
try {
  config = loadConfig();
} catch (err) {
  if (!(err instanceof ConfigError)) throw err;
  console.error(`Lantern cannot start:\n${err.message}`);
  process.exit(1);
}

const dbPath = resolveDbPath(config);

/**
 * The timeouts. `connectionTimeout` is the socket's idle time, so it cuts a
 * response still being computed: `GET /v1/titles/:id/record` waits in the OMDb
 * queue (one call a second), then up to 10 s on the call, 5 s on a 429 and a
 * second try, about 26 s with no byte sent. It has to outlast that. The
 * poster route can fetch twice at 10 s each.
 */
const CONNECTION_TIMEOUT_MS = 45_000;
/** Time to receive a whole request; every body is a few fields. */
const REQUEST_TIMEOUT_MS = 30_000;
/** Longer than Caddy keeps an idle upstream connection (two minutes by default), so it never sends down a socket just closed. */
const KEEP_ALIVE_TIMEOUT_MS = 125_000;

const app = await buildApp({
  dbPath,
  webDist: resolve(repoRoot(), "web/dist"),
  publicOrigin: config.publicOrigin,
  apiPrefix: config.apiPrefix,
  webBase: config.webBase,
  ward: config.ward,
  trustedProxies: config.trustedProxies,
  omdbApiKey: config.omdbApiKey,
  logger: true,
  server: {
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    requestTimeout: REQUEST_TIMEOUT_MS,
    keepAliveTimeout: KEEP_ALIVE_TIMEOUT_MS,
    // Loopback plus AUTH_TRUSTED_PROXIES, so `request.ip` in the log is the client behind the proxy.
    trustProxy: ["loopback", ...config.trustedProxies],
  },
});
app.log.info(`database: ${dbPath}`);
// Whether the key is set; never its value.
app.log.info(
  config.omdbApiKey === undefined ? "OMDB_API_KEY is not set: no posters, plots or scores" : "OMDb key: set",
);
app.log.info(
  config.ward ? "Sign in with Ward is on" : "WARD_OIDC_ISSUER is not set: local accounts only, no Sign in with Ward",
);

// SIGINT, SIGTERM or an uncaught error: stop taking requests, finish those in flight, run the onClose
// hooks (the database closes there) and exit.
closeWithGrace({ delay: 10_000, logger: app.log }, async ({ signal, err }) => {
  if (err) app.log.error({ err }, "closing after an uncaught error");
  else app.log.info(`closing on ${signal ?? "request"}`);
  await app.close();
});

try {
  await app.listen({ host: config.host, port: config.port });
} catch (err) {
  app.log.error({ err }, `Lantern cannot listen on ${config.host}:${config.port}`);
  process.exit(1);
}
