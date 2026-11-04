# Log

## [2026-10-27] start | Folder and brief 01

The owner asked for a local folder for an app like taste.io: pick a film, rate how much you liked
it, and get suggestions from what you liked and watched. The remote repository comes later.
[Brief 01](briefs/done/01-research-taste-io-and-the-first-version.md)
is research and ends in a proposed first version; the grill comes when work starts.

## [2026-10-27] name | Lantern

The folder started as "matinee", a working name. The owner picked Lantern the same day, in line
with the other apps' names (satchel, postern, atrium, almanac): the magic lantern was the
projector before cinema.

## [2026-10-28] research | Brief 01 started, stopped partway

A full-auto run started brief 01 and stopped when the session ran out. taste.io answers every
direct read with a Cloudflare check, so its layout came from the Wayback Machine's index and its
features (four-step scale awful/meh/good/amazing, about 20 ratings before suggestions, a match %,
streaming filter) from news coverage. The owner's stack was read from Shelfmark. Findings and a
starting grill list are in [wiki/research.md](wiki/research.md); the data sources, suggestion
methods, rating scales and the proposal are left. No key was registered or used. The brief stays
in todo/ with a note.

## [2026-11-02] maintenance | Briefs reset

Part of an estate-wide reset in which every repo folded its done briefs into its wiki and restarted
numbering at 01. Lantern had none done, so brief 01 keeps its number. [wiki/status.md](wiki/status.md)
gives a dated line per area instead of one per brief, and [CLAUDE.md](CLAUDE.md) gains the rule that
code comments don't cite brief numbers.

## [2026-11-04] decision | The owner registers TMDB and OMDb keys

In a grill, after reading what each costs: both are free for a personal app. The owner registers a
TMDB account and an OMDb key and puts them in `.env` as `TMDB_API_KEY` and `OMDB_API_KEY`; brief 01
resumes with real calls then. TMDB's licence forbids AI or machine-learning use of its data, so the
suggestions stay plain scoring. The terms, with links and the date read, are in
[wiki/research.md](wiki/research.md).

## [2026-11-04] done | Brief 01: research closed, the first version in briefs 02-11

The owner's grill answered brief 01's questions: one user; on the VPS with Ward and local
accounts at `/lantern/` and `/lantern-api/` (ports 5180 and 8810), no background work; films and
series rated once per show; four steps plus not interested and want to watch; English only; no
where-to-stream; suggestions from TMDB's recommendations ranked by a plain taste profile, with
reasons and no match %; rating cards; OMDb scores on the title page; TMDB's credit and six-month
cache rule. Recorded in [wiki/decisions.md](wiki/decisions.md), with
[wiki/glossary.md](wiki/glossary.md) and [wiki/overview.md](wiki/overview.md). The TMDB and OMDb
docs were read for the endpoints the build needs ([wiki/sources.md](wiki/sources.md)); no real
call yet. Briefs 02 to 11 written, ordered so 02-06 need no key. The corpus gained a lint script.
See [briefs/done/01-research-taste-io-and-the-first-version.md](briefs/done/01-research-taste-io-and-the-first-version.md).
