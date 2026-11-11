# Owner setup

Everything it takes to put Lantern on the VPS, and what the vps-deploy stack needs to know.
Nothing in this repo deploys, registers a Ward client or writes a secret: those are the owner's
steps, written down here. Commands run on your machine unless a step says otherwise.

Lantern runs as one container from
[`infrastructure/docker-compose.yml`](../infrastructure/docker-compose.yml): `lantern-api` (sign-in,
the ratings, the title pool, OMDb's records, the poster proxy) on `127.0.0.1:8810`. Caddy serves the
built page at `/lantern/` and forwards `/lantern-api/` to the API.

`<production origin>` below means `https://` plus the main domain's host, with no path.

## 1. Register Lantern in production Ward

The adoption guide is `shared-library/README.md` in the Ward repo (`wzd_auth`). Wicket and
brief-board were registered the same way.

1. Open the console on Ward's own host (`/console`) and sign in as the break-glass superuser.
2. Create an app with slug `lantern` and name `Lantern`, with public registration closed.
3. Make the client's key pair, from Ward's checkout:

   ```
   cd path/to/wzd_auth && npm run oidc-client-key --workspace=api -- lantern
   ```

   It prints a private `WARD_OIDC_CLIENT_KEY=...` line and a public JWK. Keep the private line
   for step 2. Never paste it into Ward.
4. On the app's page, under "Sign in with Ward", register a client with the public JWK and these
   addresses:
   - redirect URI: `<production origin>/lantern-api/auth/ward/callback`
   - sign-out return URI: `<production origin>/lantern/`
5. Grant a role on the app to your own Ward account (step 7 links it).

## 2. The secrets

Two secrets, both for `lantern-api`:

| Variable | What | Where it comes from |
|---|---|---|
| `WARD_OIDC_CLIENT_KEY` | Ward client private key | step 1 |
| `OMDB_API_KEY` | OMDb's key (1,000 requests a day) | the email OMDb sent |

With vps-deploy, these go in its secrets file for the stack (`secrets/lantern.env`,
`chmod 600`). The same OMDb key as in your local `.env` is fine: one person, few calls. IMDb's
data files need no key.

## 3. What the vps-deploy stack needs

| Setting | Value |
|---|---|
| Source repo | `lantern`, built from the workspace root |
| Container | `lantern-api`, built from `infrastructure/Dockerfile` (target `prod`), image `lantern-api:1.0`, from `infrastructure/docker-compose.yml` (compose project `lantern`) |
| Server dir | `/srv/lantern-api` (the compose file's `.env` goes in `infrastructure/`, 0600) |
| Port | `127.0.0.1:8810`, loopback only; the deploy's loopback check should cover it |
| Page | `web/dist`, built with `LANTERN_BASE=/lantern/` (`npm run build`), served at `/lantern/` with an SPA fallback to `index.html` |
| API route | `/lantern-api/*` to `127.0.0.1:8810`, prefix stripped |
| Health check | `GET http://127.0.0.1:8810/v1/health`, expecting `"ok":true` (through Caddy: `/lantern-api/v1/health`) |
| Data | `/srv/lantern-api/data` bind-mounted at `/data` (`LANTERN_DATA_DIR`): the ratings, the accounts' password hashes, the title pool and OMDb's records. Back up this one directory |
| Secrets | `WARD_OIDC_CLIENT_KEY`, `OMDB_API_KEY` (step 2) |
| Plain env | `PUBLIC_ORIGIN=<production origin>`; `WARD_OIDC_ISSUER` (Ward's origin), `WARD_OIDC_CLIENT_ID=lantern`, `WARD_OIDC_REDIRECT_URI=<production origin>/lantern-api/auth/ward/callback`, `WARD_OIDC_POST_LOGOUT_REDIRECT_URI=<production origin>/lantern/`; `AUTH_TRUSTED_PROXIES` = the range Caddy reaches containers from, as for the other apps |
| Set by compose | `HOST`, `PORT`, `LANTERN_DB` |
| Optional env | `LANTERN_PORT` (the published port, default 8810) |
| Outbound | HTTPS to `www.omdbapi.com` and `m.media-amazon.com` (posters) from the server, and to `datasets.imdbws.com` during an import. The browser never calls them |
| Title import | By hand, about monthly: `node server/dist/features/pool/cli.js` inside `lantern-api` (step 6). About 310 MB downloaded, half a minute, a few hundred MB of memory; the server keeps running |
| Idle | No timers, no WebSockets: the container does work only while answering a request, so it may sleep when idle |
| Ward client | slug `lantern`, like brief-board's and Wicket's |

## 4. Check the container locally

Docker Desktop's WSL integration must be on. From the repo root, with a scratch data directory:

```
touch infrastructure/.env
LANTERN_DATA_DIR="$(mktemp -d)" docker compose -f infrastructure/docker-compose.yml up --build -d
curl -s http://127.0.0.1:8810/v1/health
```

Expect `{"ok":true}`. Stop it with `docker compose -f infrastructure/docker-compose.yml down`.
Stop a local `npm run dev` or `npm start` first: they use the same port.

## 5. Deploy

Once the vps-deploy stack exists, from vps-deploy (check the stack's CLI name in its `cli.ts`):

```
node cli.ts lantern all --dry-run
node cli.ts lantern all
```

Then:

```
curl -s <production origin>/lantern-api/v1/health
curl -sI <production origin>/lantern/
```

Expect `{"ok":true}` and a `200`.

## 6. Import the titles

Search, the cards and the suggestions draw from a pool of IMDb's films and series, which starts
empty. Load it once after the first deploy, then about monthly. On the box as the services
account:

```
export DOCKER_HOST=unix:///run/user/$(id -u)/docker.sock
cd /srv/lantern-api
docker compose -f infrastructure/docker-compose.yml exec lantern-api node server/dist/features/pool/cli.js
```

If the stack lets the container sleep when idle, wake it first (open the page, or
`curl -s <production origin>/lantern-api/v1/health`): `exec` needs it running.

It streams IMDb's three files (about 310 MB), keeps films and series with at least 1,000 votes
(65,732 on 2026-11-04), and replaces the pool in one go; ratings and the watchlist are never
touched. Add `--min-votes 2000` for a smaller pool. A failed run leaves the old pool. IMDb's
data is for personal, non-commercial use only.

## 7. Your account, and Ward

There is no register page. On the box as the services account, run the seed inside the
container. It asks for a username and password and shows neither:

```
export DOCKER_HOST=unix:///run/user/$(id -u)/docker.sock
cd /srv/lantern-api
docker compose -f infrastructure/docker-compose.yml exec -it lantern-api node server/dist/seed.js
```

(Wake a sleeping container first, as in step 6.) An existing user is left as it is. Then link Ward in this order, or you end up with two users
(and two separate sets of ratings):

1. Sign in at `<production origin>/lantern/` with that local account.
2. Open the account page (top right) and press "Link Ward".

After your first sign-in, check that the login lockout sees each visitor's own address:

```
docker compose -f infrastructure/docker-compose.yml logs lantern-api | grep -i "X-Forwarded-For"
```

No output is right. A line saying every caller shares one failure counter means
`AUTH_TRUSTED_PROXIES` doesn't name the range Caddy comes from.

## Local development

1. `cp .env.example .env`, then fill `OMDB_API_KEY`. Leave the rest empty; the defaults suit
   local development.
2. `npm install`, then make your local account: `npm run seed -w @lantern/server`, and load the
   titles: `npm run titles:import -w @lantern/server` (half a minute, about 310 MB downloaded).
3. `npm run dev`: the API on `127.0.0.1:8810` and the page at <http://localhost:5180/lantern/>.
   For `npm start` (the built page on the server's own port, after `npm run build`), set
   `PUBLIC_ORIGIN=http://127.0.0.1:8810`.
4. Check OMDb once: `npm run sources:check -w @lantern/server` makes one real call and prints
   what came back, never the key.
5. For "Sign in with Ward" against the local Ward: Ward's local seed (`wzd_auth`,
   `infrastructure/local/seed.mjs`) lists Lantern as

   ```
   { slug: "lantern", name: "Lantern", repo: "lantern", envFiles: [".env"], dev: "http://localhost:5180/lantern/", api: "/lantern-api" },
   ```

   Run `node seed.mjs` there. It writes the five `WARD_OIDC_*` values into this repo's `.env`
   and keeps the rest of the file. Restart `npm run dev`.
