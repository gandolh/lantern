import { poolInfoSchema, type PoolInfo } from "@lantern/shared";
import { useEffect } from "react";
import { useLogout, useSession, useWardLink, useWardResult, useWardSignOut } from "../vendor/ward/ward-auth-react.js";
import { request } from "./api";
import { Button } from "./components/ui/Button";
import { ImdbCredit } from "./Credits";
import { cn } from "./lib/cn";
import { DETAIL, NOTICE, PAGE_TITLE, SECTION_CARD, SECTION_TITLE, TERM } from "./looks";
import { ErrorLine } from "./States";
import { accountMessage } from "./messages";
import { ThemeSwitch } from "./ThemeSwitch";
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
    <section className="mx-auto grid max-w-160 gap-4">
      <h1 className={cn(PAGE_TITLE, "mb-2")}>Account</h1>
      <dl className={cn(SECTION_CARD, "m-0 grid-cols-[max-content_minmax(0,1fr)] gap-x-6 gap-y-2")}>
        <dt className={TERM}>Signed in as</dt>
        <dd className={DETAIL}>{user.username}</dd>
        <dt className={TERM}>Signed in with</dt>
        <dd className={DETAIL}>{viaWard ? "Ward" : "your Lantern password"}</dd>
        {ward.enabled && (
          <>
            <dt className={TERM}>Ward</dt>
            <dd className={DETAIL}>
              {ward.linked || link.linked || result.result === "linked" ? "Linked" : "Not linked"}
            </dd>
          </>
        )}
      </dl>

      {result.result === "linked" && (
        <p className={cn(NOTICE, "m-0")} role="status">
          Ward is linked. You can sign in with it from now on.
        </p>
      )}
      {failure && <ErrorLine>{accountMessage(failure)}</ErrorLine>}

      <PoolSection />

      <section className={SECTION_CARD} aria-labelledby="look-heading">
        <h2 id="look-heading" className={SECTION_TITLE}>
          Look
        </h2>
        <ThemeSwitch />
      </section>

      <div className="flex flex-wrap gap-2">
        {ward.enabled && !ward.linked && !link.linked && (
          <Button disabled={link.pending} onClick={() => void link.link()}>
            {link.pending ? "Opening Ward…" : "Link Ward"}
          </Button>
        )}
        <Button disabled={logout.pending} onClick={() => void logout.logout()}>
          Sign out
        </Button>
        {viaWard && (
          <Button disabled={wardSignOut.pending} onClick={() => void wardSignOut.signOut()}>
            Sign out of Ward too
          </Button>
        )}
      </div>
    </section>
  );
}

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });
const NUMBER = new Intl.NumberFormat("en-GB");

/** How many titles the pool holds and when they were imported, with IMDb's credit. */
function PoolSection() {
  const pool = useQuery<PoolInfo>("pool", (signal) =>
    request("GET", "/v1/pool", (v) => poolInfoSchema.parse(v), { signal }),
  );
  return (
    <section className={SECTION_CARD} aria-labelledby="pool-heading">
      <h2 id="pool-heading" className={SECTION_TITLE}>
        Titles
      </h2>
      {pool.status === "error" && <ErrorLine>Couldn’t read the title list. {pool.error.message}</ErrorLine>}
      {pool.data && pool.data.titles === 0 && (
        <p className="m-0">
          No titles yet. Run{" "}
          <code className="rounded-xs bg-surface-sunk px-[5px] py-px font-mono text-code">
            npm run titles:import -w @lantern/server
          </code>{" "}
          on the server to load IMDb’s films and series.
        </p>
      )}
      {pool.data && pool.data.titles > 0 && (
        <p className="m-0">
          {NUMBER.format(pool.data.movies)} films and {NUMBER.format(pool.data.series)} series from IMDb
          {pool.data.minVotes !== null && <>, each with at least {NUMBER.format(pool.data.minVotes)} votes</>}
          {pool.data.importedAt !== null && <>, imported {DATE.format(pool.data.importedAt)}</>}.
        </p>
      )}
      <p className="m-0 text-small text-ink-muted">
        <ImdbCredit />
      </p>
    </section>
  );
}
