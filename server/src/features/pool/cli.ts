import { resolve } from "node:path";
import { loadConfig, loadEnvFile, resolveDbPath } from "../../config.js";
import { openDatabase } from "../../db.js";
import { httpDatasets, localDatasets } from "./files.js";
import { DEFAULT_MIN_VOTES, importPool } from "./import.js";

/**
 * The title import, run by hand (about monthly); nothing runs it on a timer.
 *
 *     npm run titles:import -w @lantern/server [-- --min-votes 1000] [-- --from <folder>]
 *     node server/dist/features/pool/cli.js [--min-votes 1000]        (built, from the repo root, as in the container)
 *
 * It streams IMDb's `title.ratings`, `title.basics` and `title.crew` from
 * datasets.imdbws.com (about 310 MB gzipped on 2026-11-04), or reads them from
 * a local folder with `--from`, and replaces the title pool in the same
 * database the server uses (`LANTERN_DB`, else `data/lantern.sqlite` under the
 * repo root). The server may keep running meanwhile. IMDb's data is for
 * personal, non-commercial use only.
 */

loadEnvFile();

function option(name: string): string | undefined {
  const at = process.argv.indexOf(name);
  return at > -1 ? process.argv[at + 1] : undefined;
}

async function main(): Promise<void> {
  const minVotesArg = option("--min-votes");
  const minVotes = minVotesArg === undefined ? DEFAULT_MIN_VOTES : Number(minVotesArg);
  if (!Number.isInteger(minVotes) || minVotes < 1) throw new Error("--min-votes must be a whole number, 1 or more");
  const from = option("--from");
  const dbPath = resolveDbPath(loadConfig());

  const db = openDatabase(dbPath);
  try {
    console.log(
      `Importing IMDb's titles with ${minVotes} votes or more into ${dbPath}, from ${from ?? "datasets.imdbws.com"}.`,
    );
    const report = await importPool({
      db,
      datasets: from === undefined ? httpDatasets() : localDatasets(resolve(from)),
      minVotes,
      log: (line) => console.log(`  ${line}`),
    });
    let size = "";
    try {
      const row = db
        .prepare(
          "SELECT sum(pgsize) AS bytes FROM dbstat WHERE name IN ('titles', 'titles_by_votes', 'titles_by_kind')",
        )
        .get() as { bytes: number | null };
      if (row.bytes) size = `; the pool takes ${(row.bytes / 1024 / 1024).toFixed(1)} MiB in the database`;
    } catch {
      // dbstat isn't compiled into every SQLite; the size is a nicety.
    }
    const peakMiB = (process.resourceUsage().maxRSS / 1024).toFixed(0);
    console.log(
      `Done in ${(report.tookMs / 1000).toFixed(1)} s: ${report.movies} films and ${report.series} series${size}; peak memory ${peakMiB} MiB.`,
    );
    console.log("Titles of the kept types at each threshold:");
    for (const count of report.atThreshold)
      console.log(
        `  ${String(count.minVotes).padStart(5)} votes or more: ${count.movies} films, ${count.series} series`,
      );
  } finally {
    db.close();
  }
}

main().catch((err: unknown) => {
  console.error(`The import stopped; the old pool is unchanged. ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
