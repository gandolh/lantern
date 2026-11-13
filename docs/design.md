# Design: Lamplight

The look of the Lantern page, as shipped on 2026-11-13. The owner approved the direction on the estate
redesign board; this document is recorded from what was built, not from the proposal. The decisions behind
it are in [decisions.md](../corpus/wiki/decisions.md), and how the stylesheet is put together is in
[web-app.md](../corpus/wiki/web-app.md).

Lamplight is a warm paper ground, one amber lamp, and a rating you can read without its colour. It is
used mostly on a phone, so every screen was drawn at 390 px first and widened.

## Ground and surfaces

Three levels, in both themes. Light is paper `#f6f2ec` with white-ish cards (`#fffefc`) that carry a one
pixel hairline and a soft shadow. Dark is today's warm dark, `#14110f`, where a card is a lighter surface
with a hairline and no shadow: elevation is a lighter surface, never a glow.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `page` | `#f6f2ec` | `#14110f` | the page, the top bar, the tab bar |
| `surface` | `#fffefc` | `#241f1b` | a suggestion, the verdict panel, the swipe card |
| `surface-sunk` | `#efeae2` | `#0f0d0b` | fields, the poster's ground |
| `control` / `control-hover` / `control-raised` | `#ebe5db` / `#e4ddd2` / `#fffefc` | `#302a25` / `#3a332d` / `#463e37` | a rating bar at rest, quiet actions, the chosen filter tile |
| `line` | `#e2dbd0` | `#36302b` | the one hairline |
| `outline` | `#857b70` | `#8d8379` | edges that must be seen: a field, a dashed empty box, keycaps |
| `focus` | `#1f53aa` | `#85ccff` | every focus ring |

## The lamp and the four steps

`accent` is the one amber (`#9c5300` light, `#fbc044` dark): links, the one primary button (Sign in) and
the *amazing* fill. Selected navigation and filters stay ink, so amber never marks a second meaning.

The four steps keep their meaning and order. Awful is red, meh a stone blue-grey, good green and amazing
amber, each with its own text colour for a chosen step (`on-awful`, `on-meh`, `on-good`, `on-amazing`).
In dark the chosen fills are about ten percent lower in lightness, so the brightest blocks on a page are
the posters, not the buttons.

The rating bar is four steps in one track, each a four-bar level meter over its word. Filled bars are ink
and empty bars a 30 percent tint, so the steps differ at arm's length with no colour at all. A chosen step
fills with its colour and its focus ring turns to its text colour.

## Type

Hanken Grotesk sets the text and Bricolage Grotesque (with its optical size axis) the titles and the
figures; both are self-hosted from `@fontsource-variable` at 5.3.0. Six sizes: 12, 14, 16, 20, 28 and 40.
Body is 16 on a 24 line. 12 is a tab label, keycap or caption; 14 facts and controls; 20 a card's name and
a section head; 28 a page title and a score figure; 40 a title page's name from 760 px. Facts are
tabular-figure; separators are hairlines, not middle dots.

## Shape

Radii: control 10, card 16, poster 6, pill 999. Spacing is Tailwind's 4 px scale. The breakpoint is 760 px
(`wide:`), and the suggestion card turns horizontal at 900 px.

## The frame

A top bar from 760 px (the brand, five sections with an ink underline on the current one, the account at
the right) and a bottom tab bar below it, fixed, with a pill behind the current tab's icon. A title page
belongs to no section, so no tab is marked there.

## The screens

- **Suggestions.** One ranked column at every width, 880 px at most. From 900 px a card is horizontal: the
  poster, the facts and the reason, then the rating bar and the two actions on the right, about 170 px a
  row. On a phone the card has 12 px padding and a 72 px poster, about 250 px a row. "Because you liked X"
  stays, X a link in amber; there is no match percentage. Rating a card removes it and the next one moves
  up.
- **A title.** The verdict sits beside the poster, under the name and above the plot. Below runs one
  full-width band: Scores on a surface card at two thirds (three figures split by hairlines) and Details
  on a card at one third, stacked on a phone. A title with no poster gets a tile with its name set in type
  on one of six tints, picked from its id so it keeps its colour; never an initial, never a picture.
- **Rate.** A 760 px column. On a wide page the poster sits beside the facts and plot with the next card
  peeking behind, the keycaps for 1 to 4 and Z show, and the three actions are icon beside word. Under
  480 px the actions are icon over word, 56 px tall. On a phone the rating bar and actions are pinned just
  above the tab bar, the swipe hint sits under the card and the credit line is below the fold. The swipe,
  its thresholds and the keys are unchanged; the drag stamp is sentence case.

## The screens nobody drew

Given the same tokens and patterns, with no layout of their own: the watchlist and the ratings (the same
card as a suggestion, the tabs as control chips with ink for the chosen one), search (a field on
`surface-sunk` with an `outline` edge), the account (a column of surface cards, the theme as radio dots,
Sign out a plain control), sign-in and the gate's states (a surface card, the lantern mark, a field error
in `danger` with its icon), not found, and the undo notice (a float with a check, a link and the title).

## States

Loading is today's line with a still sketch of the rows to come: never a shimmer. Empty is a dashed
`outline` box. An error is a line with an icon and, where it can be retried, a Try again button; no state
rests on colour alone.

## Motion

Only the swipe card moves: it follows the pointer and leaves by a short transform. With reduced motion it
only fades. Nothing else animates or transitions.

## Copy

Unchanged in meaning. The approved changes: hairline separators in place of middle dots, genres on their
own line, a range reads `2010 to 2013` (a running series keeps `2019–`), the drag stamp in sentence case,
icons in place of the arrows glued to "Not interested", "Skip" and "Want to watch", and typographic
apostrophes. A missing score keeps its dash and the credit line is word for word.
