import { poolInfoSchema, type PoolInfo } from "@lantern/shared";
import { useEffect } from "react";
import { useLogout, useSession, useWardLink, useWardResult, useWardSignOut } from "../vendor/ward/ward-auth-react.js";
import { request } from "./api";
import { ImdbCredit } from "./Credits";
import { accountMessage } from "./messages";
import { useQuery } from "./useQuery";

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

      <PoolSection />

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

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });
const NUMBER = new Intl.NumberFormat("en-GB");

/** How many titles the pool holds and when they were imported, with IMDb's credit. */
function PoolSection() {
  const pool = useQuery<PoolInfo>("pool", (signal) => request("GET", "/v1/pool", (v) => poolInfoSchema.parse(v), { signal }));
  return (
    <section className="account-section" aria-labelledby="pool-heading">
      <h2 id="pool-heading">Titles</h2>
      {pool.status === "error" && <p className="auth-error">Couldn't read the title list. {pool.error.message}</p>}
      {pool.data && pool.data.titles === 0 && (
        <p>
          No titles yet. Run <code>npm run titles:import -w @lantern/server</code> on the server to load IMDb's films and series.
        </p>
      )}
      {pool.data && pool.data.titles > 0 && (
        <p>
          {NUMBER.format(pool.data.movies)} films and {NUMBER.format(pool.data.series)} series from IMDb
          {pool.data.minVotes !== null && <>, each with at least {NUMBER.format(pool.data.minVotes)} votes</>}
          {pool.data.importedAt !== null && <>, imported {DATE.format(pool.data.importedAt)}</>}.
        </p>
      )}
      <p className="muted">
        <ImdbCredit />
      </p>
    </section>
  );
}
