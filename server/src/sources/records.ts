import type { RecordCache } from "./cache.js";
import { readOmdb, type OmdbClient, type StoredRecord } from "./omdb.js";
import { singleFlight } from "./queue.js";

/**
 * The one door to OMDb for the routes: a title's record from the cache, or
 * asked once through the queue and kept. `cached` never asks, for the poster
 * route and the lists, which must cost no call.
 */
export interface Records {
  readonly status: { omdb: boolean };
  /** The record, null when OMDb doesn't know the title. Throws `NoKeyError` or `SourceError`. */
  get(imdbId: string): Promise<StoredRecord | null>;
  /** The kept record, without asking: undefined when none is kept, null for a kept not-found. */
  cached(imdbId: string): StoredRecord | null | undefined;
  /** Of these titles, the ones with a kept poster. */
  withPosters(imdbIds: readonly string[]): Set<string>;
}

export function createRecords({ omdb, cache }: { omdb: OmdbClient; cache: RecordCache }): Records {
  const flight = singleFlight<StoredRecord | null>();
  const cached = (imdbId: string): StoredRecord | null | undefined => {
    const hit = cache.get(imdbId);
    return hit === undefined ? undefined : hit.outcome === "found" ? hit.record : null;
  };
  return {
    get status() {
      return { omdb: omdb.enabled };
    },
    cached,
    withPosters: (imdbIds) => cache.withPosters(imdbIds),
    async get(imdbId) {
      const hit = cached(imdbId);
      if (hit !== undefined) return hit;
      return flight(imdbId, async () => {
        const reading = readOmdb(await omdb.byImdbId(imdbId), imdbId);
        cache.put(imdbId, reading);
        return reading.outcome === "found" ? reading.record : null;
      });
    },
  };
}
