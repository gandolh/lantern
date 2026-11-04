# Task 10: The taste profile and the suggestions page

## Context

**Needs the TMDB key.** Suggestions are TMDB's recommended titles for everything rated good or
amazing, ranked by a taste profile built from the genres, keywords and people of what was rated,
likes and dislikes both, each with a reason ("because you liked X"); no match %, and plain
scoring only, since TMDB's terms forbid AI or machine learning on its data. Titles with any
state never come back ([decisions.md](../../wiki/decisions.md); the outline is in
[overview.md](../../wiki/overview.md)).

Depends on 04, 05, 07 and 09 (enough ratings to try it).

## Files you OWN

- `server/src/suggest/` (new): the profile and the ranking as pure functions, and the service
  that gathers their inputs; tests
- `server/src/app.ts` (the route), `shared/src/` (the answer)
- `web/src/` (the suggestions page, which becomes the home page)
- `corpus/wiki/suggestions.md` (new), `corpus/wiki/status.md`, `corpus/log.md`

## What to do

1. **Inputs.** Every rated title's details (genres, keywords, people, recommendations) from the
   cache, fetching missing ones a bounded number per request; the page says when more are being
   fetched and asks again.
2. **The profile.** Rating weights awful -2, meh -1, good +1, amazing +2; each genre, keyword
   and person of a rated title gets the weight, summed and damped by how often it appears so a
   common genre doesn't drown the rest. Not interested isn't a rating and stays out (say so in
   the page).
3. **Candidates and score.** The seeds' recommendations, minus every title with a state; the
   score from how many seeds recommended it and their weights, plus the profile's weights of its
   genres, and of its keywords and people where its details are cached (the top candidates get
   their details fetched, a bounded number per request). Ties by vote count. Pick the constants
   in tests on hand-made fixtures where the expected order is obvious.
4. **Reasons.** The one or two strongest seeds behind each suggestion: "Because you liked X" or
   "Because you liked X and Y", linking to them.
5. **The page.** Home (`/lantern/`): the ranked list with posters, the reason, and the state
   picker inline (a title given a state leaves the list); filter films or series. Too few
   ratings: a line and a link to the cards.
6. **`suggestions.md`**: the method, the weights and why, what it can't do.

## Acceptance

- `npm run typecheck`, `npm run lint` and `npm test` pass. Tests: profile sums and damping;
  dislikes push down; stated titles excluded; reasons pick the strongest seeds; bounded fetching.
- A browser walk: with the walk's ratings so far, suggestions show with reasons; rating one
  removes it.
