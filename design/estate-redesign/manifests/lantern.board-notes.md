# The board's notes: Lantern

The estate redesign board is a private canvas. This file copies what its page for this app said beside the screens: the owner's asks, the decisions, the rules the design reopened, the open questions and the Floor. The owner's answers are in [README.md](../README.md#the-owners-decisions).

## Asks to the owner

- 1. Reopened: today's meh is ochre and sits beside amazing's amber, so rated side by side they blur. Lamplight moves meh to a stone blue-grey, the one cool step on the warm ground, and keeps awful, good and amazing. Move meh, or keep ochre? 2. Suggestions become one ranked column of horizontal cards (poster, facts, then the rating control and two actions on the right) instead of two columns that reshuffle when a card is rated. Keep that? 3. Approve Lamplight as Lantern's direction? (beside `lantern-direction`)

## Decisions

- Dark is its own palette on today's warm dark values: surfaces lighter as they rise, hairlines where the shadows were, and chosen rating fills about 10 percent lower in lightness than round 1, so the brightest blocks on the page are the posters, not the buttons [S14, S7]. Posters are calmed a step and edged. (beside `lantern-direction`)
- The four steps keep their meaning and order (awful red, meh stone, good green, amazing amber). Amazing and the accent are the same amber on purpose: the best rating lights the lantern. Selected navigation and filters stay ink, so amber never marks a second meaning. The meter's filled bars are ink and the empty ones a 30 percent tint, so the four glyphs differ at arm's length [S7, S14]. (beside `lantern-direction`)
- Titles are set in Bricolage Grotesque and everything else in Hanken Grotesk, both on Google Fonts; today is the system font. Six sizes: 40, 28, 20, 16, 14 and 12. The display face gives the poster-less list a voice [conv, research 4]. (beside `lantern-direction`)
- Suggestions are a ranked list, so they stay one column at every width, 880 px at most. From 900 px a card is horizontal: poster, facts and reason in the middle, the rating control and two actions on the right, about 170 px a row. Rating a card removes it, and the next one moves up without changing column [conv, research 3, feed]. (beside `lantern-proposed-suggestions-1280`)
- The facts line keeps hairline separators at every width for year and kind; genres get their own line. Today's middle dots and the en dash ("2010–2013") are out (Hallmark gates 63 and 19), so a range reads "2010 to 2013". (beside `lantern-proposed-suggestions-1280`)
- "Because you liked X" stays, with X a link in the amber lamp. It is the suggestion's reason (wiki/decisions.md: "each says why"). There is still no match percentage. (beside `lantern-proposed-suggestions-1280`)
- The rating control: four steps in one bar, each a 22 px level meter over its word [research 3: label each step]. Want to watch and Not interested are filled control buttons with an icon and a word, as bordered buttons are today, never hover-only. On a phone the card is 12 px padded and a row is about 250 px, so three fit on the screen. (beside `lantern-proposed-suggestions-1280`)
- Kept as recorded (wiki/architecture.md): below 760 px the five sections are a bottom tab bar, and from 760 px a top bar. Research checklist item 2 prefers a rail on desktop; the top bar stays because the owner's recorded navigation is conventional and the app has five destinations. The current tab gets a pill, the current top-bar item an ink underline. The 390 renders are captured at viewport height so the tab bar sits at the foot, not mid-page. (beside `lantern-proposed-suggestions-390`)
- Your verdict moves up beside the poster, under the title and above the plot, because rating is the page's one action [conv, research 3]. Today it sits below the poster block. The chosen step shows in its own colour (Meh here), as today. (beside `lantern-proposed-title-1280`)
- The plot sits under the verdict in the same column, so the title, the verdict and the plot read without scrolling at 1280 by 800. On a phone the order is title, verdict, plot [conv, research 3]. (beside `lantern-proposed-title-1280`)
- Below the poster row, one full-width band with one left edge: Scores on a surface card at two thirds (three figures split by hairlines), Details on its own card at one third, 16 px between them, stacked on a phone. Figures are 7.9/10, 97% and 82/100 as OMDb gives them, with the vote count and the OMDb credit line kept word for word [S43: a decimal with its count]. (beside `lantern-proposed-title-1280`)
- A title with no poster gets a tile with its name set in type, never an initial or a fake picture. Tints are tokens, each checked at 4.5:1 for its title in both themes [conv, research 4]. (beside `lantern-proposed-title-1280`)
- On a wide page the card is a poster beside the facts and plot, with the next card peeking behind it, as today. The swipe gesture, its thresholds and the window keys are untouched; only the look changes [conv, research 2.12]. (beside `lantern-proposed-rate-1280`)
- The four ratings carry the number keys they already answer to (1 to 4) as small keycaps, and Undo shows Z. They show on a wide page only. The arrow keys keep swiping [conv, research 2.8]. (beside `lantern-proposed-rate-1280`)
- Not interested, Skip and Want to watch keep their order and meaning, with arrow icons instead of arrow characters glued to the words (gate 63). Under 480 px each is an icon over its word, 56 px tall, so nothing spills at 360. A drag shows a sentence-case stamp in the good colour, drawn on the sheet; today's is upper case (gate 67). (beside `lantern-proposed-rate-1280`)
- On a phone the rating bar and the action row are pinned to the foot of the page, just above the tab bar, so they sit under the thumb; the card takes the space above, and the credit line moves below the fold. The swipe hint sits under the card [conv, research 2.8, 2.12]. (beside `lantern-proposed-rate-390`)

## Reopened rules

- Recorded (brief 19, Owner decisions): the proposal "keeps the four rating steps and their colours" by default. Meh is the one colour that changes hue: ochre #8a6a3a light and #d6b98a dark become a stone blue-grey. Awful, good and amazing keep theirs, tuned a little for contrast. The on-rating text is no longer white in both themes: each step has its own on-colour, checked per theme. The warm ground, ink and hairlines are today's own values, so nothing else about the app's mood is reopened. (beside `lantern-direction`)

## Open questions

- At 1280 the Rate column is 760 px wide and centred, so the sides are empty, as today. Keep that focus, or add something beside the card? Nothing the app has fits there, so none is drawn. (beside `lantern-proposed-rate-1280`)
- The app shows a plain "Loading…" line today; the sheet draws the loading states as still skeletons with that line, never a shimmer [S30]. Keep them still? (beside `lantern-direction`)

## The Floor

- Contrast is scripted over 64 pairs in both themes: text min 4.59 light and 4.72 dark, UI parts and edges min 3.31 and 3.81, every chosen rating fill and its text and focus ring clears AA. Surface-on-ground: a card on the page is 1.11 in light and 1.15 in dark, over the 1.09 floor, and each card also has a 1 px line and, in light, a shadow. Nothing overflows sideways at 1280, 1024, 768, 390 or 360 in either theme, and no label, icon or child spills out of its own button, chip or field at 390 or 360. Phone targets are 48 px or more apart from inline text links in a sentence; title links get a 48 px hit area. Sloplint --scope app gives 0 FAIL, 0 REFLEX and 0 WARN on the three comps in both themes (F4 answered). The fixed 1440 sheet is not linted (gate 34). Empty, loading and error states for all three screens are on the sheet. (beside `lantern-direction`)

## Other notes

- Family token names are unchanged (page, surface, surface-sunk, ink, ink-muted, line, accent, danger, ok, the radii). Lantern's own names change: accent-text (text on the accent) becomes on-accent, on-rating becomes one on-colour per step, poster-bg becomes poster-N with its ink, accent-soft goes; accent-ink is only an alias. Added: accent-hover, control, control-hover, control-raised, outline, focus. Values are today's warm ones except page (a half-step deeper, so a white card clears 1.09:1), the card white tinted a hair, and ink-muted a shade darker for 4.5:1 on a hovered control. Wicket and the-board keep the family names.
- Lantern has no menu or dialog, so the sheet shows its real equivalents: the kind filter, the undo notice, the sign-in field error and the phone tab bar. The title error's message is the server's own in the app; the sheet draws the stand-in "The title didn’t come back."
- Only Details' first row, Created by, is drawn: today's shot ends there, and the other facts (released, language, country, awards) keep today's two-column list. All titles, years, IMDb figures, plots and the one credit are today's seeded stand-ins, not real films.
- Copy changes across the comps, before and after: the middle-dot meta lines and the en dash in ranges ("2010–2013" becomes "2010 to 2013"), the upper-case swipe stamp (now sentence case), the arrows glued to "Not interested", "Skip" and "Want to watch" (now icons), and straight apostrophes (now typographic, in every line). Nothing else is reworded.
- The research tracker expects per-season progress for series; Lantern has none because a series is rated once for the whole show (wiki/decisions.md, "Films and series, a series rated once"). The title page shows the season count as a fact only.
- Round 2: what changed, and why. (1) The cool blue-grey ground is gone: its dark canvas was GitHub's to the digit; the warm values are today's. (2) Suggestions: one column with a horizontal card from 900 px, so cards do not change column when one is rated. (3) Phone cards are tighter, 12 px padding and a 72 px poster, about 250 px a row. (4) Want to watch and Not interested are filled control buttons again, not bare labels. (5) Genres have their own line and year and kind keep their hairlines at every width. (6) Title: Scores and Details are two surface cards in one full-width band with one left edge. (7) Rate on a phone: icon-over-word actions at 56 px, the controls pinned above the tab bar. (8) The hover rule no longer hides a chosen button's label (a specificity bug). (9) The meter is 22 px with ink bars so the four steps differ at a glance. (10) Dark chosen fills are about 10 percent calmer and the chosen kind filter is bold with an edge. (11) Phone comps are captured at viewport height, the Floor now checks each control for overflow, and the contrast table gains surface-on-ground pairs. Round 1 is kept beside this on the page.

## Contrast, as measured

| Pair | Light | Dark | Needs |
|---|---|---|---|
| ink on page | 15.68 | 16.3 | 4.5 |
| ink on surface | 17.35 | 14.15 | 4.5 |
| ink on surface-sunk | 14.6 | 16.82 | 4.5 |
| ink on control | 13.96 | 12.27 | 4.5 |
| ink on control-hover | 12.97 | 10.76 | 4.5 |
| ink on control-raised | 17.35 | 9.08 | 4.5 |
| ink-muted on page | 5.79 | 8.47 | 4.5 |
| ink-muted on surface | 6.41 | 7.35 | 4.5 |
| ink-muted on surface-sunk | 5.39 | 8.74 | 4.5 |
| ink-muted on control | 5.15 | 6.38 | 4.5 |
| ink-muted on control-hover | 4.79 | 5.59 | 4.5 |
| ink-muted on control-raised | 6.41 | 4.72 | 4.5 |
| accent (link text) on page | 5.16 | 11.39 | 4.5 |
| accent (link text) on surface | 5.71 | 9.89 | 4.5 |
| accent (link text) on control | 4.59 | 8.58 | 4.5 |
| accent (link text) on surface-sunk | 4.8 | 11.75 | 4.5 |
| on-accent on accent (primary button) | 5.58 | 11.05 | 4.5 |
| on-accent on accent-hover | 7.5 | 12.85 | 4.5 |
| on-awful on awful (chosen rating) | 6.32 | 5.25 | 4.5 |
| on-meh on meh (chosen rating) | 5.69 | 6.65 | 4.5 |
| on-good on good (chosen rating) | 5.92 | 6.87 | 4.5 |
| on-amazing on amazing (chosen rating) | 5.58 | 8.61 | 4.5 |
| danger text on page | 5.93 | 7.63 | 4.5 |
| danger text on surface | 6.56 | 6.62 | 4.5 |
| danger text on surface-sunk | 5.52 | 7.87 | 4.5 |
| ok (swipe stamp text) on surface | 6.12 | 8.58 | 4.5 |
| outline (field edge) on surface-sunk | 3.46 | 5.22 | 3 |
| outline (field edge) on page | 3.72 | 5.06 | 3 |
| outline (empty box edge) on page | 3.72 | 5.06 | 3 |
| focus ring on page | 6.55 | 10.82 | 3 |
| focus ring on surface | 7.24 | 9.39 | 3 |
| focus ring on control | 5.83 | 8.14 | 3 |
| focus ring on surface-sunk | 6.1 | 11.16 | 3 |
| focus ring on a chosen awful step (the on-colour ring) | 6.32 | 5.25 | 3 |
| focus ring on a chosen meh step (the on-colour ring) | 5.69 | 6.65 | 3 |
| focus ring on a chosen good step (the on-colour ring) | 5.92 | 6.87 | 3 |
| focus ring on a chosen amazing step (the on-colour ring) | 5.58 | 8.61 | 3 |
| focus ring on control-hover | 5.41 | 7.14 | 3 |
| focus ring on control-raised | 7.24 | 6.03 | 3 |
| ink-muted (meter bars at rest) on control | 5.15 | 6.38 | 3 |
| ink-muted (meter bars at rest) on control-hover | 4.79 | 5.59 | 3 |
| awful chosen fill on surface (3:1 UI part) | 6.56 | 4.69 | 3 |
| awful chosen fill on page (3:1 UI part) | 5.93 | 5.4 | 3 |
| meh chosen fill on surface (3:1 UI part) | 5.9 | 5.68 | 3 |
| meh chosen fill on page (3:1 UI part) | 5.33 | 6.54 | 3 |
| good chosen fill on surface (3:1 UI part) | 6.12 | 6.24 | 3 |
| good chosen fill on page (3:1 UI part) | 5.53 | 7.19 | 3 |
| amazing chosen fill on surface (3:1 UI part) | 5.71 | 7.71 | 3 |
| amazing chosen fill on page (3:1 UI part) | 5.16 | 8.88 | 3 |
| control-raised on control (the current segment) | 1.24 | 1.35 | 1.05 |
| line on page (hairline, seen as Lc 15) | 1.23 | 1.45 | 1.2 |
| poster-shadow on page (dark: the poster's 1px edge) | 16.23 | 3.12 | 1.4 |
| on-callout on callout (board marker) | 5.28 | 6.93 | 4.5 |
| surface on page (a card) | 1.11 | 1.15 | 1.09 |
| line (card edge) on page | 1.23 | 1.45 | 1.09 |
| control on surface (a rating bar in a card) | 1.24 | 1.15 | 1.09 |
| outline (the raised tile edge) on control | 3.31 | 3.81 | 3 |
| ink (filled meter bars) on control | 13.96 | 12.27 | 4.5 |
| poster-1 title on its tint (ember) | 8.67 | 10.24 | 4.5 |
| poster-2 title on its tint (harbour) | 8.2 | 10.46 | 4.5 |
| poster-3 title on its tint (moss) | 8.01 | 10.22 | 4.5 |
| poster-4 title on its tint (plum) | 7.86 | 10.07 | 4.5 |
| poster-5 title on its tint (brass) | 7.76 | 10.11 | 4.5 |
| poster-6 title on its tint (slate) | 9.47 | 11.2 | 4.5 |

## The artboards on the board

- Direction · Lamplight
- Suggestions · 1280 · light · today
- Suggestions · 390 · light · today
- A title · 1280 · light · today
- A title · 390 · light · today
- Rate · 1280 · light · today
- Rate · 390 · light · today
- Suggestions · 1280 · light · proposed
- Suggestions · 390 · dark · proposed
- A title · 1280 · light · proposed
- A title · 390 · dark · proposed
- Rate · 1280 · light · proposed
- Rate · 390 · dark · proposed
- Suggestions · 1280 · light · proposed · round 1
- Suggestions · 390 · dark · proposed · round 1
- A title · 1280 · light · proposed · round 1
- A title · 390 · dark · proposed · round 1
- Rate · 1280 · light · proposed · round 1
- Rate · 390 · dark · proposed · round 1
