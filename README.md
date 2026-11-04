# Lantern

Rate the films and series you have watched, and get suggestions for what to watch next, each
saying which title you liked it is there for. A one-person take on taste.io, self-hosted.

**Status:** Personal tool, first version built 2026-11-04. Not deployed yet; putting it on a
VPS is in [docs/owner-setup.md](docs/owner-setup.md).

The magic lantern was the projector before cinema.

## What it does

- **Rate** a title awful, meh, good or amazing, or mark it **not interested**, or put it on the
  **watchlist**. One state per title, changed or cleared anywhere it shows.
- **Rating cards**: IMDb's best-known titles you haven't marked yet, one at a time. Tap a rating;
  swipe right for want to watch, left for not interested, up to skip. Undo, and keys on a
  desktop.
- **Search** films and series by name.
- **A title's page**: poster, plot, runtime or seasons, director, writers, cast, and the IMDb,
  Rotten Tomatoes and Metacritic scores.
- **Suggestions** on the home page: titles ranked by the genres, directors and writers of what
  you rated, likes and dislikes both, each with "Because you liked X". Plain arithmetic, no
  model, no match percentage.
- **Lists**: the watchlist, and the ratings by step with not interested beside them.

English only. Sign-in is a local account or "Sign in with Ward"; there is no sign-up.

## How it works

Lantern keeps its own list of about 66,000 films and series (those with 1,000 or more IMDb
votes), built from IMDb's free non-commercial data files by an import the owner runs by hand.
Search, the cards and the suggestions read only that list, so they cost no outside call. When a
title is shown in full, the server asks OMDb once for its poster, plot, people and scores, and
keeps the answer. The browser only ever talks to Lantern; posters come through the server too.
Nothing runs in the background.

Three npm workspaces: `shared` (the API contract as zod schemas), `server` (Fastify 5 and
SQLite, with the import and the OMDb client) and `web` (React 19 on Vite). The wiki in
[corpus/](corpus/index.md) explains the choices; [docs/](docs/README.md) has the setup.

## Run it locally

Requires Node 24 or later and a free OMDb key (<https://www.omdbapi.com/apikey.aspx>, 1,000
requests a day).

```bash
npm install
cp .env.example .env                       # then fill OMDB_API_KEY
npm run seed -w @lantern/server            # your local account; asks for a username and password
npm run titles:import -w @lantern/server   # IMDb's titles: about 310 MB streamed, half a minute
npm run dev                                # API on 127.0.0.1:8810, page on http://localhost:5180/lantern/
```

Checks: `npm run typecheck`, `npm run lint`, `npm test`. "Sign in with Ward" against a local
Ward, the container and the deploy: [docs/owner-setup.md](docs/owner-setup.md).

## Project layout

| Path | What lives there |
|---|---|
| `shared/` | The API contract: zod schemas for every answer |
| `server/` | The API: sign-in, states, the title pool and its import, OMDb, posters, suggestions |
| `web/` | The page: the cards, search, title pages, lists, suggestions |
| `infrastructure/` | The container: Dockerfile and compose file |
| `docs/` | The owner's setup and an index of the wiki |
| `corpus/` | The wiki (decisions, sources, data model) and the numbered briefs that built it |

## Credits

Information courtesy of IMDb (<https://www.imdb.com>). Used with permission. IMDb's data is used
for personal, non-commercial use only. Details and scores from [OMDb](https://www.omdbapi.com/)
(CC BY-NC 4.0). Not endorsed by or affiliated with IMDb.
