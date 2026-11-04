---
summary: The title pool, Lantern's own list of films and series built from IMDb's non-commercial files, as built 2026-11-04. What it keeps per title; the types (tvMovie counted as a film) and the 1,000-vote threshold; the first real import (65,732 titles, 32 s, 14.5 MiB, counts at 500/1,000/2,000/5,000 votes); how the import streams the files without keeping them, and the memory fix (sliced strings); how a re-run replaces the pool in one transaction without touching the states; and the credit line IMDb's terms require.
updated: 2026-11-04
---

# The title pool

Search, the rating cards and the suggestions all draw from the pool, so they cost no outside
call ([decisions.md](decisions.md)). The files and their terms are in [sources.md](sources.md).
Code: [server/src/pool/](../../server/src/pool/import.ts).

## What it keeps

One row per title in `titles` ([data-model.md](data-model.md)): the IMDb id, its kind (film or
series) and IMDb's own type, the primary title and a normalised copy for search (accents, case
and punctuation dropped), the start and end years, the runtime, up to three genres, IMDb's
rating and vote count, and the ids (never the names) of its directors and writers. Names,
posters, plots and actors come from OMDb when a title is shown in full. `GET /v1/pool` says how
many titles there are and when they were imported; the account page shows it.

## Which titles

Films (`movie`, and `tvMovie`, IMDb's type for films made for television, kept because many
notable ones are) and series (`tvSeries`, `tvMiniSeries`), not adult, with at least 1,000 IMDb
votes. Left out: shorts, episodes, specials, videos and games.

The first real import, 2026-11-04 (files last modified that day), from the built JavaScript on
the development machine:

| Votes at least | Films | Series | Total |
|---|---|---|---|
| 500 | 77,165 | 19,002 | 96,167 |
| **1,000 (the default)** | **52,746** | **12,986** | **65,732** |
| 2,000 | 34,929 | 8,782 | 43,711 |
| 5,000 | 19,654 | 4,788 | 24,442 |

1,000 keeps tens of thousands of well-known titles, as the owner asked, while dropping the long
tail nobody deals as a card. `--min-votes` changes it per run. That import took 32 s (34 s wall
clock, about 310 MB downloaded), and the pool takes 14.5 MiB in the database (the file was
15 MB).

## The import

Run by the owner, about monthly; nothing runs it on a timer:

```
npm run titles:import -w @lantern/server [-- --min-votes 1000] [-- --from <folder>]
node server/dist/pool/cli.js [--min-votes 1000]          (built; in the container, from /app)
```

It streams `title.ratings` (kept from 500 votes, for the report), then `title.basics`, then
`title.crew` over HTTPS, gunzips and splits them as they arrive (pulled, so a slow parse slows
the download), and keeps only what passes; nothing is written to disk but the database. A file
whose header isn't the expected one stops the import. The new pool replaces the old one in one
transaction, with a line in `pool_imports`; a failed import leaves the old pool whole, and the
states, the skips and OMDb's records are never touched. `--from` reads `<name>.tsv.gz` or
`<name>.tsv` from a folder instead (tests, offline runs). It prints the counts above, the time,
peak memory and the pool's size.

**Memory.** The first real import peaked at 665 MiB. The cause was V8's sliced strings: a field
split out of a line is a slice of the whole 64 KB chunk it was read in, so keeping one title in
fifty kept nearly all of `title.basics` alive. The kept fields are now copied. On synthetic files
of the same shape (3 million lines) the peak fell from 565 MiB to 246 MiB, and the import now
finishes inside a 128 MiB heap. The real import was not run a second time (one heavy run was
the rule); the next one prints its own peak.

## Credit

IMDb's terms ask for this line, word for word, which Lantern shows in the footer and on the
account page: "Information courtesy of IMDb (https://www.imdb.com). Used with permission."
