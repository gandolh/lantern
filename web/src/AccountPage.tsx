import { useEffect } from "react";
import { useLogout, useSession, useWardLink, useWardResult, useWardSignOut } from "../vendor/ward/ward-auth-react.js";
import { accountMessage } from "./messages";

/**
 * The account page: who is signed in and how, "Link Ward" when the server
 * has Ward and this account has none, and sign-out. A Ward link comes back
 * here as `?ward=linked` or `?ward_error=…`, which `useWardResult` reads.
 */
export function AccountPage() {
  const session = useSession();
  const link = useWardLink();
  const result = useWardResult();
  const logout = useLogout();
  const wardSignOut = useWardSignOut();

  useEffect(() => {
    document.title = "Account · Lantern";
  }, []);

  if (session.status !== "signed_in") return null;
  const { user, ward } = session;
  const viaWard = session.session.origin === "ward";
  const failure = link.error ?? result.error ?? logout.error ?? wardSignOut.error;

  return (
    <section className="page account">
      <h1 className="page-title">Account</h1>
      <dl className="facts">
        <dt>Signed in as</dt>
        <dd>{user.username}</dd>
        <dt>Signed in with</dt>
        <dd>{viaWard ? "Ward" : "your Lantern password"}</dd>
        {ward.enabled && (
          <>
            <dt>Ward</dt>
            <dd>{ward.linked || link.linked || result.result === "linked" ? "Linked" : "Not linked"}</dd>
          </>
        )}
      </dl>

      {result.result === "linked" && (
        <p className="notice" role="status">
          Ward is linked. You can sign in with it from now on.
        </p>
      )}
      {failure && (
        <p className="auth-error" role="alert">
          {accountMessage(failure)}
        </p>
      )}

      <div className="actions">
        {ward.enabled && !ward.linked && !link.linked && (
          <button type="button" className="button" disabled={link.pending} onClick={() => void link.link()}>
            {link.pending ? "Opening Ward…" : "Link Ward"}
          </button>
        )}
        <button type="button" className="button" disabled={logout.pending} onClick={() => void logout.logout()}>
          Sign out
        </button>
        {viaWard && (
          <button type="button" className="button" disabled={wardSignOut.pending} onClick={() => void wardSignOut.signOut()}>
            Sign out of Ward too
          </button>
        )}
      </div>
    </section>
  );
}
