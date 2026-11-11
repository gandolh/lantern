import type { Rating } from "@lantern/shared";

/**
 * The suggestions' arithmetic, as pure functions. No model: a taste profile
 * is a weight per feature (a genre, a director, a writer), summed from the
 * ratings, and a candidate's score is the sum of its features' weights plus
 * a small nudge for how IMDb rates it. Each rated title's share of a score is
 * kept, so a suggestion can say which liked title it owes most to.
 *
 * A title's features of one kind share its weight: each counts 1/√k when the
 * title has k of that kind, on the rated side and the candidate side alike
 * (as a cosine similarity does). IMDb lists every episode's director and
 * writer for a series, dozens of people; without this, a long series would
 * outweigh any film by sheer headcount.
 */

/** What each step of the scale says about a title's features. */
export const RATING_WEIGHTS: Record<Rating, number> = { awful: -2, meh: -1, good: 1, amazing: 2 };

/**
 * How much a shared feature of each kind counts. A director or a writer
 * says far more about a film than one of IMDb's two dozen genres.
 */
export const FEATURE_WEIGHTS = { genre: 0.5, director: 2, writer: 1.5 } as const;

/**
 * A suggestion needs at least this much from one liked title: a shared
 * director or writer, or every genre of a title rated good. One shared genre
 * out of several isn't enough.
 */
export const MIN_LIKED_SHARE = 0.5;

/** The nudge for IMDb's view: per rating point above 7, and per tenfold of votes above 10,000. */
export const RATING_NUDGE = 0.4;
export const VOTES_NUDGE = 0.2;

export type FeatureKind = keyof typeof FEATURE_WEIGHTS;

/** `g:Drama`, `d:nm0634240`, `w:nm0634240`. */
export type Feature = string;

const KIND_OF: Record<string, FeatureKind> = { g: "genre", d: "director", w: "writer" };

export function featureWeight(feature: Feature): number {
  return FEATURE_WEIGHTS[KIND_OF[feature.slice(0, 1)] ?? "genre"];
}

/** A pool title's features from its stored fields. */
export function featuresOf(title: { genres: string; directors: string; writers: string }): Feature[] {
  const list = (prefix: string, value: string) =>
    value === "" ? [] : value.split(",").map((part) => `${prefix}:${part}`);
  return [...new Set([...list("g", title.genres), ...list("d", title.directors), ...list("w", title.writers)])];
}

export interface RatedTitle {
  imdbId: string;
  title: string;
  rating: Rating;
  features: Feature[];
}

export interface Profile {
  /** Each feature's weight: its ratings' sum, damped by the square root of how many rated titles have it. */
  weights: Map<Feature, number>;
  /** How many rated titles have each feature, for each title's share. */
  counts: Map<Feature, number>;
}

/** 1/√k for each feature, k being how many features of its kind the title has. */
export function spread(features: readonly Feature[]): Map<Feature, number> {
  const perKind = new Map<string, number>();
  const kindOf = (feature: Feature) => feature[0] ?? "";
  for (const feature of features) perKind.set(kindOf(feature), (perKind.get(kindOf(feature)) ?? 0) + 1);
  return new Map(features.map((feature) => [feature, 1 / Math.sqrt(perKind.get(kindOf(feature)) ?? 1)]));
}

export function buildProfile(rated: readonly RatedTitle[]): Profile {
  const sums = new Map<Feature, number>();
  const counts = new Map<Feature, number>();
  for (const title of rated) {
    const weight = RATING_WEIGHTS[title.rating];
    for (const [feature, part] of spread(title.features)) {
      sums.set(feature, (sums.get(feature) ?? 0) + weight * part);
      counts.set(feature, (counts.get(feature) ?? 0) + 1);
    }
  }
  const weights = new Map<Feature, number>();
  for (const [feature, sum] of sums) weights.set(feature, sum / Math.sqrt(counts.get(feature) ?? 1));
  return { weights, counts };
}

export interface Candidate {
  imdbId: string;
  features: Feature[];
  rating: number;
  votes: number;
}

export interface Ranked {
  imdbId: string;
  score: number;
  /** The liked title that adds the most to the score. */
  reason: { imdbId: string; title: string };
}

/** One rated title's share of a candidate's score: its weight on each feature they share, spread and damped as in the profile. */
export function share(rated: RatedTitle, candidate: { features: readonly Feature[] }, profile: Profile): number {
  const theirs = spread(rated.features);
  let total = 0;
  for (const [feature, part] of spread(candidate.features)) {
    const their = theirs.get(feature);
    if (their !== undefined)
      total +=
        ((RATING_WEIGHTS[rated.rating] * their) / Math.sqrt(profile.counts.get(feature) ?? 1)) *
        featureWeight(feature) *
        part;
  }
  return total;
}

export function nudge(candidate: { rating: number; votes: number }): number {
  return RATING_NUDGE * (candidate.rating - 7) + VOTES_NUDGE * (Math.log10(Math.max(candidate.votes, 1)) - 4);
}

/**
 * The candidates ranked by the profile, best first, at most `limit`. Only a
 * candidate with a liked title behind it (a share of at least
 * `MIN_LIKED_SHARE`) is ranked; ties go to the most-voted.
 */
export function rank(candidates: readonly Candidate[], rated: readonly RatedTitle[], limit: number): Ranked[] {
  const profile = buildProfile(rated);
  const liked = rated.filter((title) => RATING_WEIGHTS[title.rating] > 0);
  if (liked.length === 0) return [];
  // Who liked what: a candidate must share a feature with a liked title to be worth a look.
  const likedFeatures = new Set(liked.flatMap((title) => title.features));
  const scored: { candidate: Candidate; score: number }[] = [];
  for (const candidate of candidates) {
    let score = 0;
    let touches = false;
    for (const [feature, part] of spread(candidate.features)) {
      const weight = profile.weights.get(feature);
      if (weight === undefined) continue;
      score += weight * featureWeight(feature) * part;
      if (likedFeatures.has(feature)) touches = true;
    }
    if (touches) scored.push({ candidate, score: score + nudge(candidate) });
  }
  scored.sort((a, b) => b.score - a.score || b.candidate.votes - a.candidate.votes);

  // The reason: the liked title with the biggest share. Computed down the list until enough have one.
  const ranked: Ranked[] = [];
  for (const { candidate, score } of scored) {
    let best: RatedTitle | undefined;
    let bestShare = 0;
    for (const title of liked) {
      const part = share(title, candidate, profile);
      if (part > bestShare) {
        best = title;
        bestShare = part;
      }
    }
    // A hair under, for the rounding in the square roots.
    if (best && bestShare >= MIN_LIKED_SHARE - 1e-9)
      ranked.push({ imdbId: candidate.imdbId, score, reason: { imdbId: best.imdbId, title: best.title } });
    if (ranked.length === limit) break;
  }
  return ranked;
}
