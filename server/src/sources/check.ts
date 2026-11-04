import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigError, loadConfig } from "../config.js";
import { createOmdbClient, forPage, readOmdb } from "./omdb.js";
import { record } from "./read.js";

/**
 * The live check: one real OMDb call through Lantern's own client and
 * reader, with no cache, to see that OMDb still answers the way the reader
 * expects. It prints the answer's fields and what the reader made of them,
 * never the key.
 *
 *     npm run sources:check -w @lantern/server [-- <imdb id>] [-- --save <dir outside the repo>]
 *     node server/dist/sources/check.js [<imdb id>]          (built, from the repo root)
 *
 * `--save` writes the raw answer there as JSON, for refreshing a test fixture
 * by hand. The key comes from `.env` like the server's.
 */

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
try {
  process.loadEnvFile(`${REPO_ROOT}.env`);
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const saveAt = args.indexOf("--save");
  const saveDir = saveAt > -1 ? resolve(args[saveAt + 1] ?? "") : undefined;
  if (saveDir !== undefined && saveDir.startsWith(resolve(REPO_ROOT))) throw new Error("--save must point outside the repository");
  const imdbId = args.find((arg, i) => /^tt\d{7,10}$/.test(arg) && args[i - 1] !== "--save") ?? "tt1375666";

  const config = loadConfig(process.env);
  if (config.omdbApiKey === undefined) throw new Error("Set OMDB_API_KEY in .env first.");
  const answer = await createOmdbClient({ apiKey: config.omdbApiKey }).byImdbId(imdbId);
  if (saveDir !== undefined) {
    mkdirSync(saveDir, { recursive: true });
    writeFileSync(join(saveDir, `omdb-${imdbId}.json`), `${JSON.stringify(answer, null, 2)}\n`);
  }
  console.log(`OMDb ${imdbId}: ${Object.keys(record(answer) ?? {}).sort().join(", ")}`);
  const reading = readOmdb(answer, imdbId);
  console.log(JSON.stringify(reading.outcome === "found" ? { ...forPage(reading.record), posterHost: reading.record.posterUrl && new URL(reading.record.posterUrl).hostname } : reading, null, 2));
  console.log("1 real call.");
}

main().catch((err: unknown) => {
  // Source errors name the source, never the key.
  console.error(err instanceof ConfigError ? `Settings: ${err.message}` : err instanceof Error ? err.message : String(err));
  process.exit(1);
});
