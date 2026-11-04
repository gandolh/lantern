# Task 03: Sign-in: local accounts, the seed, Sign in with Ward

## Context

Lantern signs in like the owner's other apps: a local account made by a seed command, plus
"Sign in with Ward", and no register page ([decisions.md](../../wiki/decisions.md)). Wicket
built exactly this on 2026-11-04: read its `server/src/{app,config,accounts,seed}.ts`,
`web/src/{auth,AuthGate,LoginPage,AccountPage,messages}.tsx?` and `corpus/wiki/sign-in.md`.
Ward's local seed is getting a Lantern entry in parallel (dev `http://localhost:5180/lantern/`,
API `/lantern-api`); when it runs, it writes five `WARD_OIDC_*` lines into Lantern's `.env`.

Depends on 02.

## Files you OWN

- `server/vendor/ward/` and `web/vendor/ward/` (new): ward-auth, the built copy from the Ward
  repo's `shared-library/` (the six files a vendored copy holds). Change nothing in that repo.
- `server/src/app.ts`, `config.ts`, `index.ts`, `accounts.ts` (new), `seed.ts` (new),
  `server/package.json` (a `seed` script), their tests
- `web/src/auth.ts`, `AuthGate.tsx`, `LoginPage.tsx`, `AccountPage.tsx`, `messages.ts`,
  `api.ts`, `main.tsx`, `Shell.tsx`, `styles.css`
- `.env.example`, `corpus/wiki/sign-in.md` (new), `corpus/wiki/architecture.md`,
  `corpus/wiki/status.md`, `corpus/log.md`

## What to do

1. **The guard.** Register `wardAuth` before any route: cookie `lantern_session` on the API
   prefix, routes under `/auth`, rename off, `loginPath` `/lantern/login`, `settingsPath`
   `/lantern/account`, `afterSignInPath` `/lantern/`, one role `user` for everyone (a first Ward
   sign-in included). Public: `GET /v1/health` and the page's files. Everything else under `/v1`
   needs a session; a 401 there is rewritten to `{ code, message }`.
2. **Writes refuse other sites.** Every `POST`, `PUT` and `DELETE` under `/v1` refuses a
   browser `Origin` or `Sec-Fetch-Site` that isn't `PUBLIC_ORIGIN`, on top of the cookie's
   `SameSite=Lax`.
3. **Accounts and the seed.** One role; `SEED_USERNAME` and `SEED_PASSWORD` or a prompt on a
   terminal (the password not echoed); an existing user left as it is;
   `npm run seed -w @lantern/server` and `node server/dist/seed.js`.
4. **Ward settings.** The five `WARD_OIDC_*` read by the library's own reader; empty
   `WARD_OIDC_ISSUER` means local accounts only; the redirect URI must be
   `<origin>/lantern-api/auth/ward/callback`. `AUTH_TRUSTED_PROXIES` as in Wicket. The start log
   says whether Ward is on, never a value.
5. **The page.** A gate: loading, signed out (the login page at `/lantern/login`, "Sign in with
   Ward" under the form when the server has Ward), signed in (the shell), the server down (Try
   again). An account page: who is signed in and how, Link Ward, Sign out, Sign out of Ward too.
   Any 401 asks about the session again.
6. **`sign-in.md`**: the guard, what is public, the Origin check, accounts and the seed, the
   settings, and how to try Ward locally.

## Acceptance

- `npm run typecheck`, `npm run lint` and `npm test` pass. Tests: signed out, a `/v1` route is
  401 in the contract's shape; health is open; a local sign-in opens it; a cross-site write is
  refused; there is no sign-up or rename route; the settings refuse a wrong redirect URI.
- The seed creates a user against a scratch database, and leaves it alone the second time.
- A browser walk signs in locally and out again. If the five `WARD_OIDC_*` lines are in `.env`,
  "Sign in with Ward" is walked against the local Ward too; otherwise the outcome says so.
- Ward's repo has no change from this brief.
