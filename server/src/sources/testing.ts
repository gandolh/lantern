import { readFileSync } from "node:fs";
import type { FetchLike } from "./http.js";
import type { Queue } from "./queue.js";

/**
 * Test helpers for the sources, never imported by the server: the
 * hand-written fixtures, a fake `fetch` that records every call, and a queue
 * with no spacing.
 */

const FIXTURES = new URL("./fixtures/", import.meta.url);

/** `fixtures/<name>.json`, parsed. */
export function fixture(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`${name}.json`, FIXTURES), "utf8"));
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

export interface FetchCall {
  url: URL;
  headers: Headers;
  redirect: RequestInit["redirect"];
}

export type FakeFetch = FetchLike & { calls: FetchCall[] };

/** A `fetch` answered by `handler`; an unhandled URL is a test failure. */
export function fakeFetch(handler: (url: URL, call: FetchCall) => Response | Promise<Response> | undefined): FakeFetch {
  const calls: FetchCall[] = [];
  const fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input);
    const call: FetchCall = { url, headers: new Headers(init?.headers), redirect: init?.redirect };
    calls.push(call);
    const answer = await handler(url, call);
    if (!answer) throw new Error(`no fake answer for ${url.pathname}`);
    return answer;
  }) as FakeFetch;
  fetch.calls = calls;
  return fetch;
}

/** A queue that runs each task at once, in order. */
export const immediateQueue = (): Queue => ({ run: (task) => task() });

/** Never waits: for the retry after a 429. */
export const noSleep = (): Promise<void> => Promise.resolve();
