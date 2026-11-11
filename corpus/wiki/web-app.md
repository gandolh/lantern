---
summary: What the Lantern page's controls are made of as of 2026-11-11 - the Base UI wrappers under web/src/components/ui/ (RadioGroup, ToggleGroup, Tabs), which widget uses which, the rating page's key guard, and where Base UI stops (the swipe card, the rating actions, the undo notice, the text inputs, section links).
updated: 2026-11-11
---

# The web app's controls

The page is React on Vite in `web/src`. Base UI 1.9.0 (`@base-ui/react`, pinned) is used only through
three wrappers in `web/src/components/ui/`, imported by subpath; the rest of the page never imports it.
The code wins where this page and it disagree. Why: [decisions.md](decisions.md), "Base UI for the
filter, the picker and the tabs, hand-built where it has no part".

## Which widget is made of what

| Widget | Where | Wrapper | Keys |
|---|---|---|---|
| Kind filter (All, Films, Series) | suggestions, search, watchlist and ratings lists, `/rate`, through `KindFilter.tsx` | `RadioGroup`, `look="segmented"` | one Tab stop; arrows move and choose |
| State picker (four ratings, want to watch, not interested) | title page, every list row (`compact`) | guarded `ToggleGroup` | one Tab stop; arrows move focus only; Space, Enter or a tap saves; tapping the pressed one clears |
| Ratings tabs (All, four ratings, not interested) | the ratings page | `Tabs`, with `activateOnFocus` | one Tab stop; arrows move and choose |

- **A filter chooses on arrows** because nothing is saved: trying each option is the point. **The picker
  does not**, because a choice is a write to the server, so an arrow press must not save.
- **The picker's two rows** (`state-ratings`, `state-others`) are plain wrappers inside the one group;
  Base UI registers items by context, so the group still has one Tab stop. A list of 50 rows has 50
  picker stops, not 300.
- **`ToggleGroup`** takes `value` as one string or null and tells `onValueChange` the new choice or
  null (cleared). The optimistic change and its rollback ("That didn't save") live in `StatePicker`.
- **`KindFilter`** holds the one list of kinds. It turns "no kind" into the value `all` and back.
- **Tabs have no panel.** The strip is passed into `TitleList` as its `tabs` prop and the list below it
  is the panel; a `Tabs.Panel` would need `TitleList` to take the strip and the content as children.
  `Tabs` wraps the whole `TitleList` instead.

## The rating page's keys

`/rate` listens on the window: `1`-`4` rate, arrows swipe, `Z` undoes. `web/src/keys.ts`
(`pageOwnsKey`) skips an event whose target is in a text field, a `tablist` or a `radiogroup`, so
arrowing through the kind filter chooses and never swipes. A plain `role=group` is deliberately not
skipped: the rating buttons sit in one, and arrows must keep swiping after one is tapped.

## Where Base UI stops

- `SwipeCard.tsx`: a pointer-drag card with no Base UI part.
- The rating actions on `/rate`: buttons that act, not toggles.
- The undo notice on the lists: a sticky `role=status` line that stays until the next change. A Base UI
  toast would time out.
- Text inputs (search, sign in): native.
- `Shell.tsx`'s section links: navigation with `aria-current`.
- There is no dialog, menu, popover, select or checkbox in the page.

## Tests

jsdom (per file, `// @vitest-environment jsdom`) for the guarded wrapper, the picker and the key guard;
static markup for the kind filter's roles and `aria-checked`. Tabs and the radio group's keyboard
behaviour was checked in a browser run, not in a test. The styling is still plain CSS (`styles.css`);
the move to Tailwind is the next brief.
