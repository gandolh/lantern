---
summary: Lantern's vocabulary, revised 2026-11-04 when TMDB was dropped. Title (an IMDb id), pool and import, rating and the four steps, not interested, want to watch and the watchlist, state, card and skip, taste profile, suggestion and its reason, OMDb record, and the sources, each with the words they replace.
updated: 2026-11-04
---

# Glossary

**Title**:
A film or a series, known by its IMDb id (`tt0111161`). Its kind is film (IMDb's `movie` and
`tvMovie`) or series (`tvSeries` and `tvMiniSeries`). A series is one title, whatever its
seasons.
_Avoid_: movie (for both kinds), show (for both kinds), item, TMDB id

**Pool**:
The titles Lantern knows without asking anyone: films and series from IMDb's files above a vote
threshold. Search, the cards and the suggestions draw from it.
_Avoid_: catalogue, database, library

**Import**:
One run of `npm run titles:import`, which rebuilds the pool from IMDb's files. Run by hand.
_Avoid_: sync, refresh, crawl

**Rating**:
What the owner thought of a title they have seen: one of four steps, awful, meh, good or
amazing.
_Avoid_: score (that is IMDb's or Metacritic's), stars, like

**Not interested**:
A title the owner doesn't want to watch and won't rate. Not a rating.
_Avoid_: dislike, hide, thumbs down

**Want to watch**:
A title the owner means to watch. The titles in this state make up the **watchlist**.
_Avoid_: saved, bookmarked, queue

**State**:
Which one of the six a title is in for one user: a rating (four), not interested, or want to
watch. A title has at most one; none means untouched.
_Avoid_: status, mark

**Card**:
One title dealt by the rating cards, waiting for a state or a skip.
_Avoid_: tile, swipe card

**Skip**:
Passing on a card without giving the title a state. It is remembered so the card isn't dealt
again, and is not a state.
_Avoid_: pass, dismiss, not interested (that is a state)

**Taste profile**:
Weights per genre, director and writer, summed from the owner's ratings (likes up, dislikes
down), used to rank candidates. Plain arithmetic, no model.
_Avoid_: model, embedding, match

**Suggestion**:
A title from the pool that Lantern proposes to watch next, ranked by the taste profile, never
one that already has a state.
_Avoid_: recommendation, match, pick

**Reason**:
The line a suggestion carries naming the liked title that adds the most to its score: "because
you liked X".
_Avoid_: explanation, match %

**OMDb record**:
What OMDb answered for one title: poster, plot, people, runtime and the three scores. Asked
only for a title shown in full, and kept once found.
_Avoid_: details (the page), metadata

**Source**:
Where Lantern's outside data comes from: IMDb's files (the pool) or OMDb (the records).
_Avoid_: provider, API
