# Task 01: Research taste.io, the film data and the suggestions

**Research only, not grilled yet.** Filed 2026-10-27. Nothing is built; this brief ends in a
proposed first version for the owner to grill.

**Stopped 2026-10-28, partly done.** The session ran out during step 1. Done: taste.io's layout
(Wayback index) and features (news coverage), and the owner's stack, in
[wiki/research.md](../../wiki/research.md). Left: the rest of step 1, then steps 2-5; the page's
"Where it stopped" lists them. The run's rules forbade registering keys, so the TMDB and OMDb
calls in step 2 wait for the owner.

## Context

The owner, 2026-10-27: "I want something like https://www.taste.io/. Something where you can pick
a movie, rate how you liked it and recommend similar things on what you liked/watched."

Three things decide what can be built, and each needs facts before the grill:

- **What taste.io does**, and which parts the owner wants.
- **Where film data comes from.** Titles, posters, genres, people and keywords need a source.
  TMDB has a free API with a key and an attribution rule; others exist. Every source has terms
  about caching, storing and showing its data.
- **How suggestions work for one person.** taste.io leans on its many users' ratings
  (collaborative filtering). An app with one or a few users can't, unless it borrows a public
  ratings dataset. The fallback is suggestions from the titles themselves (genres, keywords, cast,
  crew) or a source's own "similar titles" list.

The owner's other apps are React + Vite on the front and a Node API on SQLite, and most sign in
through Ward when deployed. Shelfmark (a catalog of books) has a lookup-then-confirm flow that may
be worth copying. This app stays independent of it (see [CLAUDE.md](../../CLAUDE.md)).

## Files you OWN

- `corpus/wiki/research.md` (new): the findings.
- `corpus/wiki/status.md`, `corpus/log.md`.
- A scratch folder outside the repo for any trial calls. No app code in this brief.

## What to do

1. **taste.io, feature by feature.** Use the site (an account if needed) and list what it does: how
   you rate (its scale), how it picks what you rate first, the match score on each title, the
   watchlist, where to stream, friends and their matches, films versus series. Give each a line on
   what it would take to build. Screenshots stay in the scratch folder.
2. **Film data sources.** Compare TMDB, OMDb, Wikidata and any other free source on: films and
   series covered, Romanian titles and posters, "similar" or "recommended" lists, where to stream in
   Romania, rate limits, what may be cached and for how long, attribution, and whether a key is
   needed. Make a handful of real calls (one film, one series, one search) with a free key if one
   is needed, and keep the calls few: name the key by its `.env` variable, never its value.
3. **Suggestions.** Describe three ways, with how good each is likely to be at 50, 200 and 1,000
   ratings from one person:
   - the source's own "similar titles", weighted by your ratings;
   - content-based: a profile from the genres, keywords and people of what you rated high and low;
   - collaborative filtering seeded with a public ratings dataset (MovieLens, for one); check its
     licence for a personal app.
   Say which can explain itself ("because you liked X"), which taste.io's own match score implies.
4. **Rating.** How taste.io's scale compares with stars, thumbs and a 1-10 score, and what each
   gives the suggestion step to work with.
5. **Propose the first version.** One page: what a user can do, the screens, the data kept, the
   source, the suggestion method, and what is left for later. List the questions the grill must
   settle, for example: one user or friends, films only or series too, Romanian or English first,
   local only or deployed with Ward sign-in, and the stack.

## Acceptance

- `corpus/wiki/research.md` covers steps 1-5, with the sources' terms cited (link and the date
  read) and the real calls' results summed up in words.
- The proposal fits on one page and ends in the grill's question list.
- No key, password or production domain is written anywhere in the repo.
