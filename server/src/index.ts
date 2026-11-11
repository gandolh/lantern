import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { ConfigError, loadConfig, type Config } from "./config.js";

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

/** `src/` (tsx in dev) and `dist/` (built) sit at the same depth, so this resolves the same from both. */
const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));

try {
  process.loadEnvFile(`${REPO_ROOT}.env`);
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
}

let config: Config;
try {
  config = loadConfig(process.env);
} catch (err) {
  if (!(err instanceof ConfigError)) throw err;
  console.error(`Lantern cannot start:\n${err.message}`);
  process.exit(1);
}

const dbPath = config.dbPath ? resolve(config.dbPath) : resolve(REPO_ROOT, "data/lantern.sqlite");

const app = await buildApp({
  dbPath,
  webDist: resolve(REPO_ROOT, "web/dist"),
  publicOrigin: config.publicOrigin,
  apiPrefix: config.apiPrefix,
  webBase: config.webBase,
  ward: config.ward,
  trustedProxies: config.trustedProxies,
  omdbApiKey: config.omdbApiKey,
  logger: true,
});
app.log.info(`database: ${dbPath}`);
// Whether the key is set; never its value.
app.log.info(
  config.omdbApiKey === undefined ? "OMDB_API_KEY is not set: no posters, plots or scores" : "OMDb key: set",
);
app.log.info(
  config.ward ? "Sign in with Ward is on" : "WARD_OIDC_ISSUER is not set: local accounts only, no Sign in with Ward",
);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    app.close().then(
      () => process.exit(0),
      (err: unknown) => {
        app.log.error({ err }, `shutdown on ${signal} failed`);
        process.exit(1);
      },
    );
  });
}

try {
  await app.listen({ host: config.host, port: config.port });
} catch (err) {
  app.log.error({ err }, `Lantern cannot listen on ${config.host}:${config.port}`);
  process.exit(1);
}
