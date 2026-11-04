# Task 09: Search over the pool, the state picker, a title page from the pool

_Rewritten 2026-11-04 when the owner dropped TMDB; this number was "The rating cards" before._

## Context

Search reads the pool only, so it costs no outside call ([decisions.md](../../wiki/decisions.md),
"OMDb only for what is shown"). Titles the pool lacks (under the vote threshold) aren't found;
an OMDb search fallback is left for later ([overview.md](../../wiki/overview.md)). The state
picker built here is reused by the title page, the cards and the lists.

Depends on 04, 07 and 08.

## Files you OWN

- `server/src/pool/` (the search query), `server/src/routes/` (search, a title from the pool),
  tests
- `shared/src/` (the answers)
- `web/src/` (the search page, the state picker, a title page from the pool's facts, the route
  for `/lantern/title/:id`)
- `corpus/wiki/status.md`, `corpus/log.md`

## What to do

1. **`GET /v1/search?q=&kind=`**: titles whose normalised title holds the query's words
   (case and accents ignored), an exact title first, then titles starting with it, then the
   rest; ties to the most-voted. At most 30. Each with its state for this user and whether a
   cached poster exists.
2. **`GET /v1/titles/:id`**: the pool's facts for one title and its state; 404 when the pool
   lacks it.
3. **The search page**: one box (films and series), the query in the address so Back returns
   to it; results as rows with title, year, kind, genres, IMDb rating and votes, the state
   badge, and a poster only when one is cached. Each row links to its title page and offers the
   state picker.
4. **The state picker**: awful, meh, good, amazing; not interested; want to watch; clear. One
   tap sets a state; the current one is shown; the change shows at once and rolls back if the
   server refuses.
5. **The title page** (`/lantern/title/tt…`): the pool's facts and the picker, laid out so
   brief 10 can add OMDb's poster, plot, people and scores.

## Acceptance

- `npm run typecheck`, `npm run lint` and `npm test` pass; the search ranking and the title
  route are tested on a small pool.
- A browser walk on the real pool in a phone-sized window: search a film, rate it from the
  results, open it, change its state; search a series. No outside call is made.

## Outcome (2026-11-04)

Built as specified.

- **Search** matches every word of the query in the normalised title (accents, case and
  punctuation ignored; `&` reads as "and"), then orders the exact title first, titles starting
  with the query next, and the rest after, each group most-voted first; at most 30. A plain
  `LIKE` scan over the 65,732-title pool, no full-text index: it answered instantly in the walk.
- **The kind filter** (All, Films, Series) is kept on the page, not in the address; the query is
  in the address and replaced as you type, so Back leaves the page.
- **The state picker**: the four ratings in a row, then want to watch and not interested; tapping
  the state already set clears it (no separate Clear button). Optimistic, with a rollback and a
  line when the server refuses.
- **No OMDb search fallback**: a title under 1,000 votes isn't found; the empty result says so.
- **The title page** shows the pool's facts, an "Open on IMDb" link (a plain link the owner
  follows, not a call) and the picker; the poster frame shows initials until brief 10.

Checks: `npm run typecheck`, `npm run lint`, `npm test` (14 files, 75 tests; 6 new for search
and the title route on a seeded pool, 2 for the formatters). A browser walk at 412 x 915 on the
real pool: "the dark knight" found it first, rated Amazing from the results, opened it, changed
to Good, reloaded (kept), Back to the results (kept, query in the box); "breaking bad" with
Series found the show and put it on the watchlist. Only Lantern's origin was asked.
