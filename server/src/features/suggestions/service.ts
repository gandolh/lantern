import { isRating, type TitleKind } from "@lantern/shared";
import type { Db } from "../../db.js";
import type { StatesStore } from "../states/index.js";
import { featuresOf, rank, type Candidate, type Ranked, type RatedTitle } from "./score.js";

/**
 * Feeds the scoring from the database: the user's rated titles (with their
 * pool features) and every pool title without a state. The pool's features
 * are read once per import and kept in memory, since the pool only changes
 * when the owner imports again.
 */

interface PoolFeatures extends Candidate {
  kind: TitleKind;
  title: string;
}

export interface Suggester {
  suggest(
    userId: string,
    options: { kind?: TitleKind; limit: number },
  ): { ranked: Ranked[]; rated: number; liked: number };
}

export function createSuggester(db: Db, states: StatesStore): Suggester {
  const lastImport = db.prepare<[], { id: number | null }>("SELECT max(id) AS id FROM pool_imports");
  const all = db.prepare<
    [],
    {
      imdbId: string;
      kind: TitleKind;
      title: string;
      genres: string;
      directors: string;
      writers: string;
      rating: number;
      votes: number;
    }
  >("SELECT imdb_id AS imdbId, kind, title, genres, directors, writers, rating, votes FROM titles");
  let cached: { importId: number | null; titles: PoolFeatures[]; byId: Map<string, PoolFeatures> } | undefined;

  const poolFeatures = () => {
    const importId = lastImport.get()?.id ?? null;
    if (!cached || cached.importId !== importId) {
      const titles = all.all().map((row) => ({
        imdbId: row.imdbId,
        kind: row.kind,
        title: row.title,
        rating: row.rating,
        votes: row.votes,
        features: featuresOf(row),
      }));
      cached = { importId, titles, byId: new Map(titles.map((title) => [title.imdbId, title])) };
    }
    return cached;
  };

  return {
    suggest(userId, { kind, limit }) {
      const pool = poolFeatures();
      const stated = states.allStated(userId);
      const rated: RatedTitle[] = [];
      for (const [imdbId, state] of stated) {
        const title = pool.byId.get(imdbId);
        // A rated title the pool no longer holds has no features to give.
        if (title && isRating(state))
          rated.push({ imdbId, title: title.title, rating: state, features: title.features });
      }
      const candidates = pool.titles.filter(
        (title) => !stated.has(title.imdbId) && (kind === undefined || title.kind === kind),
      );
      return {
        ranked: rank(candidates, rated, limit),
        rated: rated.length,
        liked: rated.filter((title) => title.rating === "good" || title.rating === "amazing").length,
      };
    },
  };
}
