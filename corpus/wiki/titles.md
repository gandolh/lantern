---
summary: The title pool, Lantern's own list of films and series built from IMDb's non-commercial files, as planned on 2026-11-04 (brief 08 builds it). What it keeps per title, which title types and the vote threshold, how the import streams the three files without keeping them, how a re-run replaces the pool in one transaction without touching the states, and the credit line IMDb's terms require.
updated: 2026-11-04
---

# The title pool

Search, the rating cards and the suggestions all draw from the pool, so they cost no outside
call ([decisions.md](decisions.md)). The files and their terms are in [sources.md](sources.md).

## What it keeps

One row per title: the IMDb id, its kind (film or series) and IMDb's own type, the primary
title, the start and end years, the runtime, up to three genres, IMDb's rating and vote count,
and the ids (never the names) of its directors and writers. Names, posters, plots and actors
come from OMDb when a title is shown in full.

## Which titles

Films (`movie`, and `tvMovie`, IMDb's type for films made for television and streaming) and
series (`tvSeries`, `tvMiniSeries`), not adult, with at least the vote threshold of IMDb votes.
The threshold and the resulting size are set when the import is built and recorded here.

## The import

`npm run titles:import -w @lantern/server`, run by the owner, about monthly; nothing runs it on
a timer. It streams `title.ratings`, then `title.basics`, then `title.crew` over HTTP,
decompresses and parses them line by line, and keeps only what passes; the downloads are never
written to disk. The new pool replaces the old one in one transaction, so a failed import leaves
the old pool whole, and the states, the skips and OMDb's records are never touched.

## Credit

IMDb's terms ask for this line, word for word, which Lantern shows in the footer and on the
account page: "Information courtesy of IMDb (https://www.imdb.com). Used with permission."
