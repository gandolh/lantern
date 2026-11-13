import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLogin, useSession, useWardSignIn } from "../vendor/ward/ward-auth-react.js";
import { appBase } from "./base";
import { Button } from "./components/ui/Button";
import { cn } from "./lib/cn";
import { NOTICE } from "./looks";
import { ErrorLine } from "./States";
import { LanternMark } from "./Icons";
import { loginMessage, sessionReasonMessage, wardSignInMessage } from "./messages";

/**
 * The login page: username, password and "Sign in", and "Sign in with Ward"
 * under them when the server has Ward. No sign-up link: the owner's account
 * comes from the seed (`npm run seed`), and anyone else through Ward once
 * the owner grants them Lantern there. A Ward round trip that failed comes
 * back as `?ward_error=`, which the hooks turn into the message under the
 * Ward button.
 */
export function LoginPage() {
  const session = useSession();
  const { login, pending, error } = useLogin();
  const ward = useWardSignIn();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [missing, setMissing] = useState<"username" | "password" | null>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Sign in · Lantern";
  }, []);

  const signedOut = session.status === "signed_out" ? session : null;
  const notice = sessionReasonMessage(signedOut?.reason);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    const name = username.trim();
    const empty = name === "" ? "username" : password === "" ? "password" : null;
    setMissing(empty);
    if (empty !== null) {
      (empty === "username" ? usernameRef : passwordRef).current?.focus();
      return;
    }
    void login(name, password).then((signedIn) => {
      if (signedIn) {
        // A Ward failure the page was showing is moot now.
        ward.reset();
        return;
      }
      setPassword("");
      passwordRef.current?.focus();
    });
  };

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-6" aria-busy={pending || ward.pending || undefined}>
      <div className="grid w-full max-w-gate gap-4 rounded-card border border-line bg-surface px-6 py-7 shadow-card">
        <h1 className="m-0 inline-flex items-center gap-3 font-display text-page-title text-ink">
          <LanternMark size={32} />
          Lantern
        </h1>
        <p className="m-0 text-ink-muted">Sign in to rate, keep your watchlist and get suggestions.</p>
        {notice !== null && (
          <p className={cn(NOTICE, "m-0 bg-control shadow-none")} role="status">
            {notice}
          </p>
        )}

        <form className="grid gap-4" onSubmit={submit} noValidate aria-label="Sign in">
          <label className="grid gap-1.5 text-small font-semibold">
            <span>Username</span>
            <input
              className="h-11 rounded-control border border-outline bg-surface-sunk px-3 text-input font-normal text-ink focus-visible:outline-offset-1 aria-invalid:border-danger aria-invalid:shadow-[inset_0_0_0_1px_var(--color-danger)]"
              ref={usernameRef}
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              value={username}
              aria-invalid={missing === "username" || undefined}
              onChange={(event) => {
                setUsername(event.target.value);
                if (missing === "username") setMissing(null);
              }}
            />
            {missing === "username" && (
              <span className="text-small font-semibold text-danger">Enter your username.</span>
            )}
          </label>
          <label className="grid gap-1.5 text-small font-semibold">
            <span>Password</span>
            <input
              className="h-11 rounded-control border border-outline bg-surface-sunk px-3 text-input font-normal text-ink focus-visible:outline-offset-1 aria-invalid:border-danger aria-invalid:shadow-[inset_0_0_0_1px_var(--color-danger)]"
              ref={passwordRef}
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              aria-invalid={missing === "password" || undefined}
              onChange={(event) => {
                setPassword(event.target.value);
                if (missing === "password") setMissing(null);
              }}
            />
            {missing === "password" && (
              <span className="text-small font-semibold text-danger">Enter your password.</span>
            )}
          </label>
          {error !== null && <ErrorLine>{loginMessage(error)}</ErrorLine>}
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {signedOut?.ward.enabled && (
          <div className="grid gap-2.5">
            <p className="m-0 text-center text-small text-ink-muted" aria-hidden="true">
              or
            </p>
            <Button disabled={ward.pending} onClick={() => void ward.signIn({ returnTo: appBase() })}>
              {ward.pending ? "Opening Ward…" : "Sign in with Ward"}
            </Button>
          </div>
        )}
        {ward.error !== null && (
          <div className="grid justify-items-start gap-2">
            <ErrorLine>{wardSignInMessage(ward.error)}</ErrorLine>
            <Button onClick={ward.reset}>Dismiss</Button>
          </div>
        )}
      </div>
    </main>
  );
}
