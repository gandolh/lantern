/**
 * One in-process queue per source: one request at a time, each starting at
 * least the spacing after the previous one started, so a burst of pages
 * never bursts at the source. Cache hits never enter a queue.
 */

/** What a queue waits on. Tests pass a fake one that moves time by itself. */
export interface Clock {
  /** Milliseconds, monotonic. */
  now(): number;
  sleep(ms: number): Promise<void>;
}

export const realClock: Clock = {
  now: () => performance.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

/** OMDb's free key allows 1,000 a day; one a second is plenty for one person. */
export const OMDB_SPACING_MS = 1000;

export interface Queue {
  /**
   * Runs `task` once every earlier task has settled and at least the spacing
   * after the previous task started. A task that fails fails its own caller
   * only; the queue goes on.
   */
  run<T>(task: () => Promise<T>): Promise<T>;
}

export function createQueue(spacingMs: number, clock: Clock = realClock): Queue {
  let tail: Promise<unknown> = Promise.resolve();
  let lastStart = Number.NEGATIVE_INFINITY;
  return {
    run<T>(task: () => Promise<T>): Promise<T> {
      const turn = tail.then(async () => {
        // A loop, because a timer may fire a millisecond early.
        for (let wait = lastStart + spacingMs - clock.now(); wait > 0; wait = lastStart + spacingMs - clock.now()) {
          await clock.sleep(wait);
        }
        lastStart = clock.now();
        return task();
      });
      tail = turn.catch(() => undefined);
      return turn;
    },
  };
}

/**
 * Two callers asking for the same key at once share one promise: the second
 * waits on the first's request instead of making its own.
 */
export function singleFlight<T>(): (key: string, task: () => Promise<T>) => Promise<T> {
  const inFlight = new Map<string, Promise<T>>();
  return (key, task) => {
    const running = inFlight.get(key);
    if (running) return running;
    const started = task().finally(() => inFlight.delete(key));
    inFlight.set(key, started);
    return started;
  };
}
