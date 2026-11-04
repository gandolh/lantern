import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigError, loadConfig } from "../config.js";
import { createOmdbClient, readOmdb } from "./omdb.js";
import { createTmdbClient, isReadAccessToken } from "./tmdb.js";
import { readDetails, readListPage } from "./tmdbReaders.js";
import { record } from "./read.js";

/**
 * The live check: four real calls through Lantern's own clients and readers,
 * with no cache, to see that the sources still answer the way the readers
 * expect. One search, one film, one series (TMDB), and the film's scores
 * (OMDb). It prints what each reader made of its answer and the answers'
 * top-level fields, never a key.
 *
 *     npm run sources:check -w @lantern/server
 *     npm run sources:check -w @lantern/server -- --save <dir outside the repo>
 *
 * `--save` writes the four raw answers there as JSON, for refreshing the test
 * fixtures by hand (trimmed). The keys come from `.env` like the server's.
 */

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
try {
  process.loadEnvFile(`${REPO_ROOT}.env`);
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
}

const FILM = 27205; // Inception
const SERIES = 1399; // Game of Thrones

function keysOf(value: unknown): string {
  return Object.keys(record(value) ?? {}).sort().join(", ");
}

async function main(): Promise<void> {
  const saveAt = process.argv.indexOf("--save");
  const saveDir = saveAt > -1 ? resolve(process.argv[saveAt + 1] ?? "") : undefined;
  if (saveDir !== undefined) {
    if (saveDir.startsWith(resolve(REPO_ROOT))) throw new Error("--save must point outside the repository");
    mkdirSync(saveDir, { recursive: true });
  }
  const save = (name: string, value: unknown) => {
    if (saveDir !== undefined) writeFileSync(join(saveDir, `${name}.json`), `${JSON.stringify(value, null, 2)}\n`);
  };

  const config = loadConfig(process.env);
  if (config.tmdbApiKey === undefined || config.omdbApiKey === undefined) {
    throw new Error("Set TMDB_API_KEY and OMDB_API_KEY in .env first.");
  }
  console.log(`TMDB key kind: ${isReadAccessToken(config.tmdbApiKey) ? "read access token (bearer)" : "API key (query)"}`);
  const tmdb = createTmdbClient({ apiKey: config.tmdbApiKey });
  const omdb = createOmdbClient({ apiKey: config.omdbApiKey });
  let calls = 0;

  calls++;
  const search = await tmdb.search("inception", 1);
  save("tmdb-search-inception", search);
  const page = readListPage(search);
  console.log(`\n1. search "inception": ${keysOf(search)}`);
  console.log(`   first raw result: ${keysOf((record(search)?.results as unknown[] | undefined)?.[0])}`);
  console.log(`   read ${page.results.length} titles of page ${page.page}/${page.totalPages}:`);
  for (const title of page.results.slice(0, 5)) console.log(`   - ${title.mediaType} ${title.tmdbId} ${title.title} (${title.year ?? "?"})`);

  calls++;
  const film = await tmdb.details("movie", FILM);
  save("tmdb-movie-27205", film);
  const filmRead = readDetails("movie", film);
  console.log(`\n2. film ${FILM}: ${keysOf(film)}`);
  console.log(`   recommendations: ${keysOf(record(film)?.recommendations)}; first: ${keysOf((record(record(film)?.recommendations)?.results as unknown[] | undefined)?.[0])}`);
  console.log(`   read: ${filmRead ? `${filmRead.title} (${filmRead.year}), ${filmRead.runtime} min, imdb ${filmRead.imdbId}` : "nothing"}`);
  if (filmRead) {
    console.log(`   genres ${filmRead.genres.map((g) => g.name).join(", ")}; ${filmRead.keywords.length} keywords; directors ${filmRead.directors.map((d) => d.name).join(", ")}`);
    console.log(`   cast ${filmRead.cast.slice(0, 4).map((c) => `${c.name} as ${c.character}`).join("; ")}`);
    console.log(`   ${filmRead.recommendations.length} recommendations: ${filmRead.recommendations.slice(0, 4).map((r) => `${r.mediaType} ${r.title}`).join("; ")}`);
  }

  calls++;
  const series = await tmdb.details("tv", SERIES);
  save("tmdb-tv-1399", series);
  const seriesRead = readDetails("tv", series);
  console.log(`\n3. series ${SERIES}: ${keysOf(series)}`);
  console.log(`   keywords: ${keysOf(record(series)?.keywords)}; external_ids: ${keysOf(record(series)?.external_ids)}`);
  console.log(`   read: ${seriesRead ? `${seriesRead.title} (${seriesRead.year}-${seriesRead.endYear ?? ""}), ${seriesRead.seasons} seasons, ${seriesRead.runtime ?? "?"} min, imdb ${seriesRead.imdbId}` : "nothing"}`);
  if (seriesRead) {
    console.log(`   ${seriesRead.keywords.length} keywords; creators ${seriesRead.directors.map((d) => d.name).join(", ")}`);
    console.log(`   cast ${seriesRead.cast.slice(0, 4).map((c) => `${c.name} as ${c.character}`).join("; ")}`);
    console.log(`   ${seriesRead.recommendations.length} recommendations: ${seriesRead.recommendations.slice(0, 4).map((r) => `${r.mediaType} ${r.title}`).join("; ")}`);
  }

  if (filmRead?.imdbId) {
    calls++;
    const scores = await omdb.byImdbId(filmRead.imdbId);
    save("omdb-tt1375666", scores);
    console.log(`\n4. OMDb ${filmRead.imdbId}: ${keysOf(scores)}`);
    console.log(`   read: ${JSON.stringify(readOmdb(scores))}`);
  }
  console.log(`\n${calls} real calls.`);
}

main().catch((err: unknown) => {
  // Source errors name the source and the path, never a key.
  console.error(err instanceof ConfigError ? `Settings: ${err.message}` : err instanceof Error ? err.message : String(err));
  process.exit(1);
});
