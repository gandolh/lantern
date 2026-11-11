import type { FastifyInstance } from "fastify";
import { seedUser } from "./accounts.js";
import { SESSION_COOKIE } from "./app.js";
import type { Db } from "./db.js";
import { normaliseTitle } from "./pool/normalise.js";

/**
 * Test helpers, never imported by the server. `signIn` seeds a user (or
 * reuses it) and returns its session cookie, ready for a `cookie` header;
 * `seedPool` puts titles in the pool.
 */
export const TEST_ORIGIN = "http://localhost:5180";
export const TEST_PASSWORD = "p".repeat(12);

export async function signIn(app: FastifyInstance, username = "owner"): Promise<string> {
  await seedUser(app.accounts, { username, password: TEST_PASSWORD });
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
  return line.split(";")[0]!;
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
