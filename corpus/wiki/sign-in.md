---
summary: Who gets into what, as built 2026-11-04. The vendored ward-auth 0.7.0 as the session guard (cookie lantern_session on /lantern-api, rename off, no sign-up, one role); what is public (health and the page's files); the Origin check on every write under /v1; the 401 rewritten into the API's error shape; the login page, the gate and the return to the page you were headed for; accounts and the seed; the Ward settings, and how to try Sign in with Ward against the local Ward.
updated: 2026-11-04
---

# Sign-in

Like the owner's other apps ([decisions.md](decisions.md)): a local account made by the seed,
plus "Sign in with Ward", and no register page. Built on the model of Wicket's sign-in. The code:
[plugins/auth/](../../server/src/plugins/auth/index.ts) (the guard, the 401 rewrite, the Origin check),
[accounts.ts](../../server/src/plugins/auth/accounts.ts), [app.ts](../../server/src/app.ts) (registers it first),
[seed.ts](../../server/src/seed.ts), [AuthGate.tsx](../../web/src/AuthGate.tsx).

## The library

ward-auth 0.7.0, Ward's shared library, as a built copy in `server/vendor/ward/` and
`web/vendor/ward/` (six files each: two bundles, their types, a README and the MIT licence).
Never edited here; upgrading means copying a newer build over it and following the library's
changelog. ESLint skips `vendor/`.

## The guard

The server registers `wardAuth` before any route:

| Setting | Value |
|---|---|
| Cookie | `lantern_session`, HttpOnly, `SameSite=Lax`, path `/lantern-api` (the API prefix) |
| Routes | under `/auth` (`/lantern-api/auth/*` in the browser): login, logout, session, Ward |
| Public | `GET /v1/health`, and every path outside `/v1` and `/auth` (the page has to load) |
| Rename | off: the page offers none, and the seed matches accounts by name |
| Sign-up | none |
| Role | `user` for everyone, a first Ward sign-in included; nothing checks it |

A signed-out request under `/v1` gets `401 { code: "unauthorized", message }`, the API's error
shape (the plugin's own `{ error }` shape is rewritten there; `/auth` keeps it for the hooks).

## Writes refuse other sites

Every `POST`, `PUT`, `PATCH` and `DELETE` under `/v1` is refused with
`403 { code: "cross_site" }` when the browser says it came from elsewhere: a `Sec-Fetch-Site`
other than `same-origin`, or an `Origin` that isn't `PUBLIC_ORIGIN`. A request with neither
header (a script, curl) passes. This sits on top of the cookie's `SameSite=Lax`, and runs after
the guard, so a signed-out write is a 401 first. In dev, the Vite proxy swaps a same-host
`Origin` (the LAN address on the phone) for `PUBLIC_ORIGIN`.

## The page

`AuthGate` wraps everything: "Loading…" while the session is asked, the login page when signed
out (the address becomes `/lantern/login`), the app when signed in, and "can't be reached" with
Try again when the server is down. A signed-out visit to `/lantern/tv/1399` goes on to that page
after signing in (remembered for the page load only). Any API call answered 401 asks about the
session again. The account page shows who is signed in and how, Link Ward, Sign out, and Sign
out of Ward too after a Ward sign-in.

## Accounts and the seed

ward-auth keeps its own tables (`auth_users`, `auth_sessions`, `auth_ward_links`) in Lantern's
SQLite file and never touches `PRAGMA user_version`. The seed makes one local user:

```
npm run seed -w @lantern/server        (development)
node server/dist/seed.js              (built, from the repo root, as in the container)
```

It takes `SEED_USERNAME` and `SEED_PASSWORD` from the environment or asks on a terminal (the
password not echoed), uses `LANTERN_DB` like the server, and leaves an existing user exactly as
it is. Passwords are at least 8 characters (the library's rule).

## Settings

| Variable | What |
|---|---|
| `WARD_OIDC_ISSUER` | Ward's origin. Empty: local accounts only |
| `WARD_OIDC_CLIENT_ID` | `lantern` |
| `WARD_OIDC_CLIENT_KEY` | the client's private key. A secret |
| `WARD_OIDC_REDIRECT_URI` | `<origin>/lantern-api/auth/ward/callback`, checked at start |
| `WARD_OIDC_POST_LOGOUT_REDIRECT_URI` | `<origin>/lantern/` |
| `AUTH_TRUSTED_PROXIES` | peers besides loopback whose `X-Forwarded-For` the login lockout believes |

The start log says "Sign in with Ward is on" or "local accounts only", never a value. With
the issuer set, the others must be too, or the server refuses to start and names them.

## Trying Ward locally

Ward's local seed (in the Ward repo, `infrastructure/local/`) lists Lantern with dev
`http://localhost:5180/lantern/` and API `/lantern-api`. Running it writes the five
`WARD_OIDC_*` lines into Lantern's `.env` and keeps the rest of the file. Then restart
`npm run dev`, and "Sign in with Ward" shows under the login form.
