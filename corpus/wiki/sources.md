---
summary: The two outside sources Lantern uses since the owner dropped TMDB on 2026-11-04. IMDb's non-commercial data files (title.basics, title.ratings, title.crew; columns, sizes, the \N null marker, daily refresh) for the title pool, and OMDb by IMDb id for each title's details, poster and three scores (1,000 calls a day; its fields and error answers). The terms, read 2026-11-04: IMDb's data for personal, non-commercial use only, with a fixed credit line; OMDb CC BY-NC 4.0. TMDB's place in the history.
updated: 2026-11-04
---

# Sources: IMDb's files and OMDb

Lantern's only outside sources ([decisions.md](decisions.md)). Every call is the server's; the
browser only talks to Lantern. The pool built from IMDb's files is described in
[titles.md](titles.md); how the server calls OMDb is in [source-calls.md](source-calls.md).

## IMDb's non-commercial data files

Gzipped, tab-separated, UTF-8 files at `https://datasets.imdbws.com/<name>.tsv.gz`, "refreshed
daily", with `\N` for a missing value
([non-commercial datasets](https://developer.imdb.com/non-commercial-datasets/), which now
redirects to `data.imdb.com`; read 2026-11-04). No key. Lantern reads three:

| File | Columns Lantern reads | Size, 2026-11-04 |
|---|---|---|
| `title.basics` | `tconst`, `titleType`, `primaryTitle`, `isAdult`, `startYear`, `endYear`, `runtimeMinutes`, `genres` (comma-separated, up to three) | 219 MiB |
| `title.ratings` | `tconst`, `averageRating`, `numVotes` | 8.3 MiB |
| `title.crew` | `tconst`, `directors`, `writers` (comma-separated `nm…` ids) | 80 MiB |

Not read: `title.principals` (753 MiB) and `name.basics` (298 MiB), so the pool knows a
director's or writer's id but not their name; `title.akas` (the titles per region) and
`title.episode`. `primaryTitle` is the title IMDb's own site shows (for a foreign film, usually
its English release title); `originalTitle` is never read. Sizes are the files' `Content-Length`
on 2026-11-04 (all last modified that day).

### Terms

From IMDb's help page "Can I use IMDb data in my software?"
([help.imdb.com](https://help.imdb.com/article/imdb/general-information/can-i-use-imdb-data-in-my-software/G5JTRESSHJBBHTGX),
read 2026-11-04):

- "Limited non-commercial use of IMDb data is allowed": "The data can only be used for personal
  and non-commercial use", and only from the published files. It "must not be
  altered/republished/resold/repurposed to create any kind of online/offline database of movie
  information (except for individual personal use)". Lantern is one person's app behind sign-in.
- The credit to show, word for word: **"Information courtesy of IMDb (https://www.imdb.com). Used
  with permission."** Lantern shows it in the page's footer and on the account page.
- "IMDb reserves the right to withdraw permission to use the data at any time."
- No scraping of IMDb's site. Lantern never reads it.

## OMDb

`https://www.omdbapi.com/?apikey=<OMDB_API_KEY>&i=<imdb id>&plot=full`, JSON
([omdbapi.com](https://www.omdbapi.com/), read 2026-11-04). `i` is an IMDb id such as
`tt1285016`; `plot` is `short` (the default) or `full`. A free key allows 1,000 requests a day,
sent by email ([API keys](https://www.omdbapi.com/apikey.aspx)). HTTPS works since 2015-08-15.

Lantern asks once per title it shows in full, and keeps a found answer. The fields it reads
(from common use; checked against the first real call):

- `Title`, `Year` (`2010`, or `2011–2019` and `2019–` for series), `Rated`, `Released`,
  `Runtime` (`148 min`), `Genre`, `Director`, `Writer`, `Actors` (comma-separated names),
  `Plot`, `Language`, `Country`, `Awards`, `Type` (`movie`, `series`), `totalSeasons`;
- `Poster`: an image URL (on `m.media-amazon.com`), or `N/A`;
- `Ratings: [{ Source, Value }]`, with `Internet Movie Database` (`8.8/10`), `Rotten Tomatoes`
  (`87%`) and `Metacritic` (`74/100`), each only when known; `imdbRating`, `imdbVotes` and
  `Metascore`, any of which can be `N/A`;
- `Response: "True"`, or `Response: "False"` with an `Error` (`Incorrect IMDb ID.`, an invalid
  key, or the daily limit reached). A refused or failed answer is never cached.

**Terms**: "All content licensed under CC BY-NC 4.0" ([omdbapi.com](https://www.omdbapi.com/),
read 2026-11-04); its site terms ([legal](https://www.omdbapi.com/legal.htm)) allow personal,
non-commercial use only, and the site says "This site is not endorsed by or affiliated with
IMDb.com." Lantern credits OMDb beside the scores.

## TMDB, dropped

TMDB was read on 2026-11-04 as the main source (endpoints, key forms, the six-month cache rule,
the clause against AI or machine-learning use) and dropped by the owner later that day
([decisions.md](decisions.md), "Revisited"). Its client was built on fixtures and removed
before any real call; [log.md](../log.md) has the history. No TMDB key is used anywhere.
