# The redesign: "Lamplight"

This folder is the design record of Lantern's redesign. The estate redesign board, where it was drawn and approved, is a private canvas; this is a copy of the app's page on it plus the build behind that page. The owner approved it on 2026-11-13, and [brief 19](../../corpus/briefs/done/19-a-redesign-with-hallmark-on-the-estate-board.md) built it. The code is now the source of truth: where the app and these files differ, the app wins, and later work may have moved a screen on. Read this folder to see what was decided and why before reshaping a screen.

## The owner's decisions

The owner approved the whole board on 2026-11-13, with every question standing at what the board proposed unless they reopened it. The questions this app's page asked:

- **Ask:** 1. Reopened: today's meh is ochre and sits beside amazing's amber, so rated side by side they blur. Lamplight moves meh to a stone blue-grey, the one cool step on the warm ground, and keeps awful, good and amazing. Move meh, or keep ochre? 2. Suggestions become one ranked column of horizontal cards (poster, facts, then the rating control and two actions on the right) instead of two columns that reshuffle when a card is rated. Keep that? 3. Approve Lamplight as Lantern's direction?
- **Open question:** At 1280 the Rate column is 760 px wide and centred, so the sides are empty, as today. Keep that focus, or add something beside the card? Nothing the app has fits there, so none is drawn.
- **Open question:** The app shows a plain "Loading…" line today; the sheet draws the loading states as still skeletons with that line, never a shimmer [S30]. Keep them still?
- **Reopened:** Recorded (brief 19, Owner decisions): the proposal "keeps the four rating steps and their colours" by default. Meh is the one colour that changes hue: ochre #8a6a3a light and #d6b98a dark become a stone blue-grey. Awful, good and amazing keep theirs, tuned a little for contrast. The on-rating text is no longer white in both themes: each step has its own on-colour, checked per theme. The warm ground, ink and hairlines are today's own values, so nothing else about the app's mood is reopened.

Where the files below disagree, the later layer wins: the owner's decisions, then the controller's rulings, then the judges' rulings, then the directions file.

## What is here

| Path | What it holds |
|---|---|
| `critiques/lantern.md` | The design critic's review against today, and the controller's rulings over it. |
| `manifests/lantern.tokens.css`, `manifests/lantern.tokens-map.md` | The token hand-off in the app's own names, and the renamed, new and unused tokens. |
| `manifests/lantern.board-notes.md` | What the board said beside the screens: the asks, decisions, reopened rules, open questions, the contrast table and the runner-up. |
| `canvas/lantern-*.dc.html` | The board's own artboards for the direction sheet and the proposed screens: HTML and CSS in the board's component format (a `<x-dc>` page with `{{…}}` values filled by the script at its foot). They need the board's runtime to render, so read them as source; no rendered picture of them exists outside the board. |
| `shots/lantern/` | Today's screens as the board showed them before the redesign. |

People's names and data in the pictures come from seeded demo accounts or are invented.

## Not here

The sketches and the judges' images, the runner-up's build (its notes are in the board's notes), the build's scripts, and the screenshots taken while it was built. They stay in the estate build folder.
