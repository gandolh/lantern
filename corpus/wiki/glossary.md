---
summary: Lantern's vocabulary. Title, rating and the four steps, not interested, want to watch and the watchlist, state, card and skip, seed, taste profile, suggestion and its reason, and the sources, each with the words they replace.
updated: 2026-11-04
---

# Glossary

**Title**:
A film or a series, as TMDB knows it: a media type (`movie` or `tv`) and TMDB's id. A series is
one title, whatever its seasons.
_Avoid_: movie (for both kinds), show (for both kinds), item

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

**Seed**:
A title rated good or amazing, whose TMDB recommendations become candidates for suggestions.
_Avoid_: source title, basis

**Taste profile**:
Weights per genre, keyword and person, summed from the owner's ratings (likes up, dislikes
down), used to rank candidates. Plain arithmetic, no model.
_Avoid_: model, embedding, match

**Suggestion**:
A title Lantern proposes to watch next: recommended by TMDB for a seed, ranked by the taste
profile, never one that already has a state.
_Avoid_: recommendation (that is TMDB's list), match, pick

**Reason**:
The line a suggestion carries saying which seeds it came from: "because you liked X".
_Avoid_: explanation, match %

**Source**:
An outside service the server calls: TMDB or OMDb.
_Avoid_: provider (watch providers are TMDB's word for streaming services), API
