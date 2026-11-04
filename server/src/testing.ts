import type { FastifyInstance } from "fastify";
import { seedUser } from "./accounts.js";
import { SESSION_COOKIE } from "./app.js";

/**
 * Test helpers, never imported by the server. `signIn` seeds a user (or
 * reuses it) and returns its session cookie, ready for a `cookie` header.
 */
export const TEST_ORIGIN = "http://localhost:5180";
export const TEST_PASSWORD = "p".repeat(12);

export async function signIn(app: FastifyInstance, username = "owner"): Promise<string> {
  await seedUser(app.accounts, { username, password: TEST_PASSWORD });
  const res = await app.inject({ method: "POST", url: "/lantern-api/auth/login", payload: { username, password: TEST_PASSWORD } });
  if (res.statusCode !== 200) throw new Error(`sign-in as ${username} answered ${res.statusCode}`);
  const header = res.headers["set-cookie"];
  const lines = header === undefined ? [] : Array.isArray(header) ? header : [header];
  const line = lines.find((l) => l.startsWith(`${SESSION_COOKIE}=`));
  if (line === undefined) throw new Error("sign-in set no session cookie");
  return line.split(";")[0]!;
}
