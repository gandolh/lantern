import type { FastifyInstance } from "fastify";
import { buildApp, createStores, type AppOptions, type Stores } from "./app.js";
import { openDatabase, type Db } from "./db.js";
import { seedUser } from "./plugins/auth/accounts.js";
import { SESSION_COOKIE } from "./plugins/auth/index.js";
import { normaliseTitle } from "./features/pool/normalise.js";

/**
 * Test helpers, never imported by the server. `signIn` seeds a user (or
 * reuses it) and returns its session cookie, ready for a `cookie` header;
 * `seedPool` puts titles in the pool.
 */
export const TEST_ORIGIN = "http://localhost:5180";
export const TEST_PASSWORD = "p".repeat(12);

/** A test's app and the handles its routes use: the database and the stores. */
export interface TestApp extends Stores {
  app: FastifyInstance;
  db: Db;
}

/**
 * The whole app on a fresh `:memory:` database, with its stores built here and passed in, so a test
 * reads and writes through the same handles the routes use. The page's origin is `TEST_ORIGIN`
 * unless `options` says otherwise. Close `app` after the test.
 */
export async function buildTestApp(options: Omit<AppOptions, "db" | "dbPath"> = {}): Promise<TestApp> {
  const db = openDatabase(":memory:");
  const full: AppOptions = { publicOrigin: TEST_ORIGIN, ...options, db };
  const stores = createStores(db, full);
  const app = await buildApp({ ...full, ...stores });
  return { app, db, ...stores };
}

export async function signIn(
  { app, accounts }: Pick<TestApp, "app" | "accounts">,
  username = "owner",
): Promise<string> {
  await seedUser(accounts, { username, password: TEST_PASSWORD });
  const res = await app.inject({
    method: "POST",
    url: "/lantern-api/auth/login",
    payload: { username, password: TEST_PASSWORD },
  });
  if (res.statusCode !== 200) throw new Error(`sign-in as ${username} answered ${res.statusCode}`);
  const header = res.headers["set-cookie"];
  const lines = header === undefined ? [] : Array.isArray(header) ? header : [header];
  const line = lines.find((l) => l.startsWith(`${SESSION_COOKIE}=`));
  if (line === undefined) throw new Error("sign-in set no session cookie");
  return line.split(";")[0] ?? line;
}

export interface SeedTitle {
  imdbId: string;
  title: string;
  kind?: "movie" | "series";
  year?: number | null;
  genres?: string;
  rating?: number;
  votes?: number;
  directors?: string;
  writers?: string;
}

/** Put titles straight into the pool, as an import would. */
export function seedPool(db: Db, titles: readonly SeedTitle[]): void {
  const insert = db.prepare(`
    INSERT INTO titles (imdb_id, kind, imdb_type, title, search_title, start_year, end_year, runtime, genres, rating, votes, directors, writers)
    VALUES (@imdbId, @kind, @imdbType, @title, @searchTitle, @year, NULL, NULL, @genres, @rating, @votes, @directors, @writers)`);
  db.transaction(() => {
    for (const t of titles) {
      const kind = t.kind ?? "movie";
      insert.run({
        imdbId: t.imdbId,
        kind,
        imdbType: kind === "movie" ? "movie" : "tvSeries",
        title: t.title,
        searchTitle: normaliseTitle(t.title),
        year: t.year ?? 2000,
        genres: t.genres ?? "Drama",
        rating: t.rating ?? 7,
        votes: t.votes ?? 10_000,
        directors: t.directors ?? "",
        writers: t.writers ?? "",
      });
    }
  })();
}
