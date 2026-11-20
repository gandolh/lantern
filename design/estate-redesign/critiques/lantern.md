fix

# Lantern, "Pilot light": design critique (2026-11-12)

Compared: today's shots (light and dark, 1280 and 390) against the proposed renders at 1280, 1024, 768, 390 and 360 in both themes, plus the Direction sheet. The red numbered dots on the comps are board callouts, not UI. The phone tab bar showing mid-page in the 390 suggestions and title renders is a capture artefact. It is `position: sticky; bottom: 0` caught by a full-page shot, and the last content clears it. Recapture phone comps at viewport height (390 x 844) so the owner doesn't read it as an overlap.

## The reopened palette: two answers

**Cool ground: a loss. Keep the warm ground.** `#0d1117` is GitHub's dark canvas to the digit, and `#f4f6f8` is one step off GitHub's light `#f6f8fa`. At rest the amber now shows only in link text and a few pixels of flame in the logo. Today it also lit the logo dot and the current nav pill. The result reads like a code host, not a film app called Lantern. The proposal's argument is that posters carry the colour. But today's `#f7f4ef` is already a near-neutral off-white, not cream, and the real gains don't depend on hue: the surface ladder, dark hairlines, the meter control, the verdict panel and the typed poster tiles. Fix: keep the new structure on today's warm ladder. Page `#f7f4ef`/`#14110f`, surface `#ffffff`/`#1f1b18`, sunk `#efeae2`/`#0f0d0b`, line `#e2dbd0`/`#36302b`, ink `#1c1917`/`#f3eee8`, ink-muted `#6b6460`/`#a8a29e`. Derive control, control-hover and control-raised from the same warm greys (around `#ebe5db`/`#2a2420`, `#e0d8cc`/`#36302b`, `#ffffff`/`#423a33`). Re-run the 59-pair contrast script. Keep the new amber values only if they pass on the warm ground.

**Meh moving off ochre: worth it, keep the blue-grey.** Today's meh `#8a6a3a` sits beside amazing `#b45309` in the same brown-orange family, and in dark `#d6b98a` against `#f59e0b` is tan against amber. Rated side by side, they blur. On the cool ground, though, slate `#576478` matches the controls and the ink "Chosen" button, so a chosen Meh reads as "selected", not as a rating (see title 1280: the Meh tile looks like a pressed toggle). On the warm ground it becomes the one cool step, apart from both amber and the chrome. The two answers back each other up.

## Regressions against today

1. **Title, scores and details (1280, 1024).** Today the three scores sit on three surface cards. Now they are a flat ruled row with no surface, and Details floats at x 757. The page has three left edges: Scores at 60, Plot at 360, Details at 757. Fix: below the poster row, one full-width band from x 60. Put Scores on a surface card (radius 16, 1 px line, 20 px padding, the three figures split by internal hairlines) at two thirds of the width. Put Details on its own surface card at one third, top-aligned, with 16 px between them. On a phone, stack them as two cards.
2. **Suggestions, phone density.** The card pitch grew from 212 px today to 296 px, so a 390 x 844 screen shows 2.5 suggestions where today showed 3.4. Fix: card padding 16 to 12, poster tile 84x124 to 72x106, the rating bar 52 to 48 px tall, gaps 16 to 12. Put Want to watch and Not interested on one 48 px row with no extra top margin. Target a pitch of 250 px or less.
3. **Suggestions and title, secondary actions.** Today Want to watch and Not interested are bordered buttons. Now they are a bare icon and word on the card, and they read as labels. Fix: give `.btn-quiet` the control fill at rest (control token, radius 10, 40 px tall, 48 px hit area on a phone), not only on hover.
4. **Phone meta lines.** With the separators dropped below 480 px, "2023 Film Crime, Mystery" and "2017 to 2020 Series" run together. Today's dots kept them apart. Fix: genres always get their own line. Year, kind, runtime, seasons and rating keep the hairline separators at every width. That line is short enough never to wrap at 360.

Nothing a person could do before is missing. Every action, filter, key and credit line is still there.

## Priority issues

1. **Rate, phone action row overflows its buttons (390, 360, both themes).** At 360 the left arrow sits outside the Not interested fill, and "Want to watch" plus its arrow spill past the right button's edges. At 390 the labels touch the edges. The floor sticky's "nothing overflows" checks page width, not each button. Fix: below 480 px, set each of the three as icon over word (20 px icon, 13/16 label, 56 px tall), like the tab bar. Add a per-button `scrollWidth > clientWidth` check to the overflow script.
2. **A chosen quiet button loses its label on hover (all screens, both themes).** `.btn-quiet:hover` (line 59 of the twin CSS) comes after `.btn[aria-pressed="true"]` (line 57) at equal specificity. A watchlisted "Want to watch" on hover becomes `#f4f6f8` on `#e3e6ec`, 1.2:1. Fix: `.btn-quiet:not([aria-pressed="true"]):hover`, plus `.btn[aria-pressed="true"]:hover { background: var(--color-ink); opacity: .9 }` or a pressed-hover token.
3. **The cool ground (see above).** It is the change with the widest reach, and the cheapest fix. It is token values only, and no layout changes.
4. **Suggestions grid reflow (from 900 px).** Suggestions are a ranked list, and a rated card leaves it. In two columns, every later card then changes column, so the next title jumps from under the pointer and the rank order reads row by row. Fix: one column at every width, max 880 px. From 900 px, use a horizontal card: poster 84 px, facts and reason in the middle, the rating control and the two quiet actions on the right in a 360 px column. That gives a row about 170 px tall and four suggestions at 1280 x 800.
5. **The meter is too faint to carry the scale.** The bars are about 12 px, and filled against empty is ink-muted against a pale grey. At arm's length all four icons look alike, so the sheet's claim that the meter "says it before any colour does" doesn't hold. Fix: a 16 px meter, filled bars in ink (`#1c1917`/`#f3eee8` on the warm ladder), empty bars in outline at 40%. On a chosen step, filled bars take the on-colour and empty bars the on-colour at 35%.
6. **Dark, chosen states.** The chosen rating fills (`#f47b74`, `#63d18f`, `#fbc044`, about 150 x 52) are the brightest blocks on a dark page. They are louder than in light, the opposite of calmer dark accents. Meanwhile the selected kind segment is `#3f4550` on `#252a33`, 1.49:1, and hard to find. Fix: take each chosen fill about 8-10% lower in lightness while keeping the hue, and recheck the on-colours at 4.5:1. On the segmented filter, set the chosen label at 600 weight in ink with the rest in ink-muted, and add a 1 px outline-token edge to the raised tile.
7. **Rate, phone thumb reach.** The rating row sits at y 447-500 and the actions at 510-557. There is an empty band above the footer, and the actions are out of the bottom third. Today has the same layout, so this is not a regression, but the redesign is the time to fix it. Fix: on Rate below 760 px, pin the rating bar and the action row just above the tab bar (16 px gap), let the card take the space above, and move the footer credit below the fold.

## Strengths to keep

- The verdict panel on the title page: a surface card beside the poster, above the plot. Rating is the page's one action, and it now reads first.
- One four-step rating control on all three screens: word, meter, chosen fill, and keycaps 1-4 plus Z on a wide page. The keys already exist (`RatePage.tsx`), so nothing is invented.
- Typed poster tiles with the title set in Bricolage. The poster-less list gets a voice instead of blank boxes, each tint checked at 4.5:1.
- Dark built as a lighter-surface ladder with hairlines instead of shadows, and a states sheet that covers empty, loading and error for all three screens.

## Scores and detector

Design specificity: mixed. The tiles, the meter and "amazing lights the lamp" belong to this app. The chrome (GitHub greys, stock segmented controls) could belong to any app. The warm ground is what would tip it back.
Cognitive load: 1 failure (grouping on the title page's lower half). Low.

1. Visibility of system status: 3. Chosen fills, undo notice and still skeletons. The hover bug hides a chosen state.
2. Match with the real world: 3. Plain words throughout. "2010 to 2013" is wordier than the IMDb-style range people know.
3. User control and freedom: 3. Undo with Z on Rate, and Undo after each list change.
4. Consistency and standards: 3. One rating control everywhere. Three left edges on the title page, and Meh reads like the selected state.
5. Error prevention: 3. Undo instead of confirms. The grid reflow invites rating the wrong card.
6. Recognition rather than recall: 3. Words on every step. The meter is too faint to help.
7. Flexibility and efficiency: 4. Number keys, Z, arrows and swipe, with the keys shown as keycaps.
8. Aesthetic and minimalist design: 3. Calm and ordered. It loses structure on the title page's lower half.
9. Help users with errors: 3. Each error names the problem and offers Try again or Search instead.
10. Help and documentation: 3. The swipe hint line on Rate is enough for this app.

Detector (`detect.mjs --json`): the first run was DEGRADED (parser modules missing, returned `[]`). I re-ran it in full mode from a scratch copy linked to presentation-sites' node_modules.
- suggestions-light, suggestions-dark: 0 findings.
- rate-light/dark, title-light/dark: 1 x `nested-cards` each. False positive. On Rate it is the peek card behind the current one. On the title page it is the verdict panel's rating bar inside its card.
- direction-light: 38 x `nested-cards`, a false positive (specimen panels on the sheet). 2 x `low-contrast` on `:hover`: `#f4f6f8` on `#e3e6ec` 1.2:1 and `#0d1117` on `#252a33` 1.3:1. True positive: this is priority issue 2, in both themes.

Must not be diluted while fixing: the verdict-first title page and the one worded four-step control. Change the ground's hue, not the structure that sits on it.
