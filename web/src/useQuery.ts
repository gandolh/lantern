import { useCallback, useEffect, useEffectEvent, useState } from "react";

/**
 * One read from the API, run when `key` changes, with the latest answer, its
 * error and a way to ask again. A newer key cancels an older request, so a
 * slow answer never overwrites a newer one. While a new answer is on its way
 * the previous one stays in `data`, so a page doesn't blank between keys.
 */
export type Query<T> =
  | { status: "loading"; data: T | undefined; refresh: () => void }
  | { status: "ok"; data: T; refresh: () => void }
  | { status: "error"; data: T | undefined; error: Error; refresh: () => void };

interface Answer<T> {
  /** Which request this answers: the key and the round. */
  tag: string;
  data?: T;
  error?: Error;
}

export function useQuery<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>): Query<T> {
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState<Answer<T>>({ tag: "" });
  const tag = `${key}#${round}`;
  // The latest `load`, without making the request depend on its identity.
  const run = useEffectEvent((signal: AbortSignal) => load(signal));

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    const current = `${key}#${round}`;
    run(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setAnswer({ tag: current, data });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setAnswer((previous) => ({
          tag: current,
          data: previous.data,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      },
    );
    return () => controller.abort();
  }, [key, round]);

  const refresh = useCallback(() => setRound((n) => n + 1), []);
  if (answer.tag !== tag) return { status: "loading", data: answer.data, refresh };
  if (answer.error) return { status: "error", data: answer.data, error: answer.error, refresh };
  return { status: "ok", data: answer.data as T, refresh };
}
