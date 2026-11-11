/**
 * Getting JSON from a source, with a timeout, one retry after a 429, and
 * errors that name the source and the path but never the query string,
 * where the key sits (`apikey=`).
 */

export type FetchLike = typeof globalThis.fetch;

/** The source can't be asked: its key isn't set. Routes answer 503 `no_key`. */
export class NoKeyError extends Error {
  override readonly name = "NoKeyError";
  readonly source: "OMDb";
  constructor(source: "OMDb") {
    super(`${source} has no key: set OMDB_API_KEY in .env`);
    this.source = source;
  }
}

export type SourceFailure = "timeout" | "network" | "rate_limited" | "refused" | "not_found" | "http" | "bad_answer";

/** A call to a source failed. The message names the source and the path, never a key. */
export class SourceError extends Error {
  override readonly name = "SourceError";
  readonly failure: SourceFailure;
  readonly status?: number;
  constructor(failure: SourceFailure, message: string, status?: number) {
    super(message);
    this.failure = failure;
    this.status = status;
  }
}

export const SOURCE_TIMEOUT_MS = 10_000;
/** The longest a 429's `Retry-After` is waited for before the one retry. */
const MAX_RETRY_AFTER_MS = 5_000;

export interface GetJsonOptions {
  fetch: FetchLike;
  timeoutMs?: number;
  headers?: Record<string, string>;
  /** Waits before the retry after a 429; tests pass one that doesn't. */
  sleep?: (ms: number) => Promise<void>;
}

/** "OMDb /": what a message may say about a request; never its query string. */
export function describe(source: string, url: URL): string {
  return `${source} ${url.pathname}`;
}

function retryAfterMs(response: Response): number {
  const seconds = Number(response.headers.get("retry-after"));
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, MAX_RETRY_AFTER_MS) : 1000;
}

async function once(source: string, url: URL, options: GetJsonOptions): Promise<Response> {
  try {
    return await options.fetch(url, {
      headers: { accept: "application/json", ...options.headers },
      signal: AbortSignal.timeout(options.timeoutMs ?? SOURCE_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    throw new SourceError(
      timedOut ? "timeout" : "network",
      `${describe(source, url)}: ${timedOut ? "no answer in time" : "unreachable"}`,
    );
  }
}

/**
 * GET `url` and parse its JSON. A 429 is retried once after `Retry-After`
 * (at most 5 s); a second 429 fails `rate_limited`. `okStatuses` lets a
 * source whose errors carry a JSON body (OMDb answers 401 with one) hand
 * that body back instead of failing.
 */
export async function getJson(
  source: string,
  url: URL,
  options: GetJsonOptions,
  okStatuses: readonly number[] = [],
): Promise<{ status: number; body: unknown }> {
  let response = await once(source, url, options);
  if (response.status === 429) {
    await (options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))))(retryAfterMs(response));
    response = await once(source, url, options);
    if (response.status === 429)
      throw new SourceError("rate_limited", `${describe(source, url)}: too many requests`, 429);
  }
  if (!response.ok && !okStatuses.includes(response.status)) {
    const failure: SourceFailure =
      response.status === 401 || response.status === 403 ? "refused" : response.status === 404 ? "not_found" : "http";
    throw new SourceError(failure, `${describe(source, url)}: answered ${response.status}`, response.status);
  }
  try {
    return { status: response.status, body: await response.json() };
  } catch {
    throw new SourceError("bad_answer", `${describe(source, url)}: the answer is not JSON`, response.status);
  }
}
