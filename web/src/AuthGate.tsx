import { useEffect, type ReactNode } from "react";
import { useSession } from "../vendor/ward/ward-auth-react.js";
import { LoginPage } from "./LoginPage";
import { hrefOf, navigate, useRoute } from "./route";

/**
 * The session gate around the page. The vendored hooks hold the session
 * (`useSession`: one shared state, asked of `GET /lantern-api/auth/session`):
 *
 * - loading: a quiet "Loading…";
 * - signed out: the address becomes `/lantern/login` and the login page
 *   shows, with the reason when a session just ended;
 * - signed in: the page. On `/login` (just signed in, or a bookmark) it goes
 *   on to where the owner was headed, or home;
 * - the session question failing (the server is down): a line saying so,
 *   and Try again.
 *
 * Any API call answered 401 asks about the session again (`auth.ts`), so a
 * session that ends while the page is open lands on the login page too.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const session = useSession();
  switch (session.status) {
    case "loading":
      return (
        <main className="gate" aria-busy="true">
          <p className="muted">Loading…</p>
        </main>
      );
    case "error":
      return (
        <main className="gate">
          <div className="gate-card">
            <h1 className="gate-brand">Lantern</h1>
            <p role="alert">Lantern can't be reached. Check your connection and try again.</p>
            <button type="button" className="button" onClick={() => void session.refresh()}>
              Try again
            </button>
          </div>
        </main>
      );
    case "signed_out":
      return <SignedOut />;
    case "signed_in":
      return <SignedIn>{children}</SignedIn>;
  }
}

/** Where a signed-out visit was headed, to go on there after signing in. Kept for this page load only. */
let headedFor: string | null = null;

function SignedOut() {
  const atLogin = useRoute().page === "login";
  useEffect(() => {
    if (atLogin) return;
    const here = `${window.location.pathname}${window.location.search}`;
    const login = hrefOf({ page: "login" });
    // Development runs effects twice; the second run already sits on the login page.
    if (window.location.pathname !== login) headedFor = here;
    navigate(login, { replace: true });
  }, [atLogin]);
  return <LoginPage />;
}

function SignedIn({ children }: { children: ReactNode }) {
  const atLogin = useRoute().page === "login";
  useEffect(() => {
    // Development runs effects twice; the second run has already left the login page.
    if (!atLogin || window.location.pathname !== hrefOf({ page: "login" })) return;
    const next = headedFor ?? hrefOf({ page: "suggestions" });
    headedFor = null;
    navigate(next, { replace: true });
  }, [atLogin]);
  // Nothing for the instant `/login` is replaced, so no page mounts on it.
  return atLogin ? null : children;
}
