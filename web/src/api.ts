import { errorBodySchema } from "@lantern/shared";
import { API_BASE } from "./base";

/**
 * The page's requests to the API. Answers are parsed with the shared
 * contract, so a server that drifted shows as an error, not as a half-drawn
 * page.
 *
 * A 401 means the session is over (or never was): the listeners hear of it
 * (`auth.ts` asks the server again, and the gate shows the login page), and
 * the request rejects with `Unauthorized`.
 */

/** The request was refused for want of a session. */
export class Unauthorized extends Error {
  override readonly name = "Unauthorized";
}

/** The API answered with an error: its status, and the contract's `{ code, message }` when it sent one. */
export class ApiError extends Error {
  override readonly name = "ApiError";
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const unauthorizedListeners = new Set<() => void>();

/** Hear of every 401. Returns a function that stops listening. */
export function onUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

export interface RequestOptions {
  body?: unknown;
  signal?: AbortSignal;
}

/** One request under the API prefix; the answer parsed by `parse`. */
export async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  parse: (value: unknown) => T,
  { body, signal }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  if (res.status === 401) {
    for (const listener of unauthorizedListeners) listener();
    throw new Unauthorized(`${path} needs a session`);
  }
  if (!res.ok) {
    const error = errorBodySchema.safeParse(await res.json().catch(() => null));
    throw new ApiError(
      res.status,
      error.success ? error.data.code : "http_error",
      error.success ? error.data.message : `${path} answered ${res.status}`,
    );
  }
  return parse(await res.json());
}
