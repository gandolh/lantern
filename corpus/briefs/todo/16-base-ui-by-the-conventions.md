# Task 16: Base UI by the conventions

**Depends on:**

- In Lantern: brief 15, for the gate, the formatter and `.claude/rules/web.md`.
- In the owner's skills library:
  - brief 02, *A base-ui skill, styled with Tailwind*: rules 1-13, the references and `check-base-ui.mjs`;
  - brief 15, *Enforce the base-ui and code-structure skills in every repo*: the checker runs `--warn-only` until brief 17 here is done;
  - the estate draft this brief replaces, *lantern's web app to Tailwind, with Base UI*.
- The owner's grilling of 2026-11-10: **Q22** (does Lantern adopt Base UI for its hand-built widgets, or drop the unused dependency), Q15 (Base UI only under `ui/`), Q16 (where native controls stay), Q41 (a picker that saves on every choice), and the new questions in decisions 2, 3 and 4.

**Runs before:** 17. This brief changes structure and behaviour. Brief 17 then changes only the styling, so its before and after screenshots compare like with like.

**Before you start:** run `brief-board guide` ([corpus/CLAUDE.md](../../CLAUDE.md)).

## Context

The owner's call of 2026-11-09 is Base UI everywhere at 1.9.0, with the base-ui skill's conventions enforced in each repo. **Lantern declares `@base-ui/react` and uses none of it.** The first version's research said "React + Vite + Base UI" ([wiki/research.md](../../wiki/research.md)), but briefs 02-14 built every control by hand. This brief is therefore an adoption: it finds the hand-built widgets, replaces the ones Base UI has a part for, and leaves the rest native or hand-built on purpose. It does not move styling to Tailwind; that is brief 17.

### The pin (verified 2026-11-10)

- `web/package.json:13` pins `"@base-ui/react": "1.9.0"` exactly. No other `package.json` declares it (root, `server`, `shared`).
- `package-lock.json` resolves `node_modules/@base-ui/react` at 1.9.0 (line 275) and `@base-ui/utils` at 0.5.0 (line 313).
- No code uses the two names 1.9.0 renamed: `grep -rn "OTPFieldPreview\|otp-field\|sanitizeValue" server shared web` finds nothing outside `node_modules`.
- `grep -rn "@base-ui" web/src server/src shared` finds nothing: **0 imports**. knip reports the dependency unused (brief 15, `web/package.json:13`).

**No bump brief is needed.**

### The audit against rules 1-13 (2026-11-10)

| Rule | Violations | Where |
|---|---|---|
| 1. Exact pin | 0 | |
| 2. Subpath imports | 0 | there are no imports yet |
| 3. Base UI only under a `ui/` folder | 0 now | the folder `web/src/components/ui/` doesn't exist; this brief creates it |
| 4-7. Tailwind on the parts, one stylesheet, tokens, motion | all | **Brief 17's work.** |
| 8. Floating parts portalled | 0 | no popup of any kind exists: no dialog, menu, popover or tooltip |
| 9. A trigger around a component uses `render` | 0 | no triggers |
| 10. `Select.Root` with `items` | 0 | there is no `<select>` anywhere (`grep -n "<select" web/src/*.tsx` is empty) |
| 11. No `window.confirm`, `alert`, `prompt` | 0 | |
| 12. Dialogs | 0 | there is no dialog |
| 13. Base UI over hand-built widgets | **3 kinds, 6 widgets** | below |

**Rule 13's three kinds**, each an `aria-pressed` or `role="tab"` button row with no keyboard model beyond Tab:

1. **The kind filter, four copies.** A `role="group"` of three buttons (All, Films, Series) with `aria-pressed`:
   - `web/src/ListPage.tsx:103-109`, `web/src/RatePage.tsx:182-188`, `web/src/SearchPage.tsx:62-68`, `web/src/SuggestionsPage.tsx:41-47`.
   - Each file declares its own `KINDS` (`ListPage.tsx:9`, `RatePage.tsx:30`, `SearchPage.tsx:8`, `SuggestionsPage.tsx:8`), and the four declarations are byte-identical (the same `md5sum` over each block).
   - Exactly one is always pressed, and tapping the pressed one does nothing. That is a single choice, not a toggle.
2. **The state picker.** `web/src/StatePicker.tsx:52-76`: six `aria-pressed` buttons in two rows (four ratings, then want to watch and not interested) in one `role="group"`. **Tapping the pressed one clears it**, so this one is a real single-select toggle. Used by `web/src/TitlePage.tsx:111` and, in `compact` form, by every row of every list (`web/src/TitleRow.tsx:36`): up to 50 rows a page (`DEFAULT_PAGE`, `server/src/routes/states.ts:15`) with six Tab stops each.
3. **The ratings tabs.** `web/src/ListPages.tsx:51-57`: seven buttons with `role="tab"` and `aria-selected`, in a `role="tablist"`. There is **no `tabpanel`, no `aria-controls` and no arrow keys**, so the roles promise a keyboard model the markup doesn't have. The strip is passed into `TitleList` as the `tabs` prop (`ListPage.tsx`), and the list below it is the panel.

**Considered and left:**

- **Native by decision (Q16):** the text inputs, the search box (`web/src/SearchPage.tsx:50`) and the sign-in fields (`web/src/LoginPage.tsx:69, 88`, one of them `type="password"`). Rule 13 keeps text inputs native.
- **No Base UI part fits:**
  - `web/src/SwipeCard.tsx`, a pointer-drag card (`setPointerCapture`, lines 40-62). It stays hand-built.
  - The rating actions (`web/src/RatePage.tsx:218-236`) are buttons that act, not toggles.
  - `web/src/Shell.tsx`'s section links are navigation with `aria-current`, not widgets.
- **The undo notice** (`web/src/ListPage.tsx:111-120`): a sticky `role="status"` line with an Undo button that stays until the next change. It looks like a toast but doesn't time out. See decision 4.
- **Nothing to adopt for:** dialogs, menus, popovers, switches, selects, checkboxes. Lantern has none, so no wrapper is created for them.

**One conflict to design around.** `web/src/RatePage.tsx:153-169` listens for `keydown` on the **window** and, unless the target is an input, textarea, select or contenteditable, turns ArrowLeft, ArrowRight and ArrowUp into card swipes and calls `preventDefault`. A Base UI `ToggleGroup` moves focus with the arrow keys. The kind filter on that page (`RatePage.tsx:182`) would swipe a card each time someone arrows through it. Today the buttons have no arrow keys, so there is no conflict. See decision 3.

### What Base UI 1.9.0 offers (read from the published types, 2026-11-10)

- **`@base-ui/react/toggle-group`:** `ToggleGroup` (`multiple`, `value` as an array, `onValueChange(groupValue, details)`, `loopFocus`, `orientation`) with `Toggle` children. With `multiple` off the group presses one `Toggle`, and pressing it again gives `[]`, so it allows clearing. One Tab stop, arrows move focus.
- **`@base-ui/react/tabs`:** `Tabs.Root` (`value`, `onValueChange`), `Tabs.List` (`activateOnFocus`, `loopFocus`), `Tabs.Tab`, `Tabs.Panel`, `Tabs.Indicator`. `activateOnFocus` is off by default, so arrows move focus and Enter or Space picks.
- **`@base-ui/react/toast`, `radio-group`:** present; no use found.

## Owner decisions (defaults this brief builds)

1. **Lantern adopts Base UI** (Q22). Default: yes, for the three kinds above. The alternative is to drop the unused dependency, which would make this brief a one-line change and leave brief 17's wrappers empty. The three kinds are small, but each brings real keyboard behaviour the page lacks.
2. **Which part for the kind filter.** Default: `ToggleGroup` (single) with a guard in `onValueChange` that ignores `[]`, so one option always stays pressed. It keeps today's `aria-pressed` semantics and look. The alternative is `RadioGroup` + `Radio`, whose semantics are exact (one choice, always) but whose arrows choose, which suits a filter that re-fetches. *New question for the grilling*: does an always-one-chosen filter use `RadioGroup` or a guarded `ToggleGroup`? The same question applies to the-board's and Newspapper's chip rows.
3. **Arrow keys on `/rate`.** Default: the window handler skips events whose target is inside a Base UI group (`target.closest("[role=group], [role=tablist], [role=radiogroup]")`), next to the existing input check at `RatePage.tsx:156`, and the kind filter on that page keeps its arrows. The alternative is leaving the kind filter on `/rate` as plain buttons, which spares a change to the key handler but keeps one inconsistent control. *New question for the grilling.*
4. **The undo notice.** Default: unchanged. A Base UI `Toast` would time out, which this notice deliberately doesn't (an Undo that vanishes after five seconds on a list people scroll is a behaviour change). Recorded as an exception candidate only if the checker flags it.
5. **One `KindFilter`.** Default: the four identical `KINDS` and groups become one `web/src/KindFilter.tsx` built on the `ToggleGroup` wrapper. The four copies are the reason it is worth one file; the alternative is four call sites of the wrapper, each with its own `KINDS`.
6. **A DOM test environment** (the-board raised it too). Default: none added. Static markup tests assert roles, `aria-pressed`, `data-pressed` and `data-selected` as the wrappers render them; keyboard behaviour is checked by a Playwright script run outside the repo, as the screenshots are, with its results in the outcome note. The alternative is `happy-dom` or `jsdom` for the web tests, which pretends to support focus and keyboard events. *New question for the grilling*: is that the estate's rule?
7. **`web/src/components/ui/`.** Default: the folder Base UI lives in (Q15), as the skill's rule 3 says. There is no `components/` folder today (`web/src` is flat); `ui/` is the first subfolder of one, and brief 17 adds `web/src/lib/cn.ts`.

## The wrapper set: `web/src/components/ui/`

| File | What it is | Used by |
|---|---|---|
| `ToggleGroup.tsx` | Base UI `ToggleGroup` + `Toggle`, `multiple` off, `value` as one string or `null`, a guard option `required` that ignores clearing | `KindFilter.tsx`, `StatePicker.tsx` (clearing allowed) |
| `Tabs.tsx` | Base UI `Tabs.Root` + `List` + `Tab` + `Panel` | `ListPages.tsx` |

`web/src/KindFilter.tsx` is new and not a Base UI file: it holds the one `KINDS` list and the group, and imports the `ToggleGroup` wrapper.

## Files you OWN

- `web/src/components/ui/**` (new).
- `web/src/KindFilter.tsx` (new), and its four call sites: `ListPage.tsx`, `RatePage.tsx`, `SearchPage.tsx`, `SuggestionsPage.tsx`.
- `web/src/StatePicker.tsx`, `web/src/ListPages.tsx` (the tab strip), `web/src/ListPage.tsx` (only the `tabs` prop's type, if the panel moves).
- `web/src/RatePage.tsx:153-169`: only the key guard of decision 3.
- The existing CSS rules for markup this brief changes (`.segmented`, `.tabs`, `.state-picker`, `.state-button`). Rename or move a rule to the new part; don't restyle. Brief 17 turns them into utilities.
- New tests next to the wrappers: `web/src/components/ui/ui.test.tsx`, and `web/src/StatePicker.test.tsx`.
- `knip.json`: remove the expected-unused line brief 15 added for `@base-ui/react`.
- `scripts/conventions.json`, only if the checker flags the undo notice or `SwipeCard`.
- `.claude/rules/web.md`: the Base UI lines.
- Corpus: a new wiki page `corpus/wiki/web-app.md` (what each widget is made of, the `/rate` key rule, where Base UI stops), [wiki/decisions.md](../../wiki/decisions.md), [wiki/status.md](../../wiki/status.md), [log.md](../../log.md), then `bash corpus/lint.sh --index`.

## Files you must NOT touch

- `server/`, `shared/`, and `web/package.json`. Every part needed ships in 1.9.0, so no new dependency.
- Styling beyond renaming a rule's selector. No Tailwind here.
- `web/src/SwipeCard.tsx` and the rating actions.
- The text inputs, which stay native.
- `web/vendor/`.

## What to do

One commit per numbered step. After each, `npm run check` passes, with `check-base-ui` `--warn-only`.

1. **Before.** Run `check-base-ui` and record the counts by rule. Take Playwright screenshots, light and dark at 1280 and 390 px, of: the suggestions page (kind filter), the ratings page (tabs with counts), a title page (state picker), a list row (compact picker), and `/rate`. Brief 17's method has the bring-up. Record the keyboard facts that must survive: on `/rate`, `1`-`4` rate, arrows swipe, `Z` undoes.
2. **`ToggleGroup.tsx` and `KindFilter.tsx`.** The wrapper takes the pressed value as a string or `null`, and `onValueChange(value | null)`. Under `required` it ignores `[]`. Replace the four groups and delete the four `KINDS` copies. Keep `aria-label="Kind"`.
3. **The `/rate` key guard.** Apply decision 3, with a test on the guard function (extract it to `web/src/keys.ts` so it is testable without a DOM): a target inside `[role=group]` doesn't swipe, a target on the page body does.
4. **`StatePicker.tsx` on `ToggleGroup`.** Keep:
   - the optimistic change and the rollback with the "That didn't save" line (`StatePicker.tsx:32-44`);
   - tapping the pressed one clears it;
   - `saveState` and `onChange` untouched;
   - the two rows (`state-ratings`, `state-others`) as wrappers inside the one group, with one roving Tab stop;
   - `aria-label` "Your verdict on <title>".
   Check, in the Playwright script, that a list of 50 rows has 50 Tab stops through the pickers, not 300.
5. **`Tabs.tsx`, and the ratings tabs on it.** Keep the order, the counts (`tab-count`) and `useCounts`. Give the list a `Tabs.Panel` around the `TitleList` content if it can be done without changing `TitleList`'s shape, else leave the panel out and record why. Arrow keys move between tabs and Enter or Space picks (`activateOnFocus` off), as the roles always promised.
6. **After.**
   - Take the screenshots again. Any pixel the new markup moves is listed with its reason.
   - Run `check-base-ui`: rules 1-3 and 8-11 report 0.
   - Remove the expected-unused `@base-ui/react` line from `knip.json`; `npx knip` reports no unused dependency.
   - Write `corpus/wiki/web-app.md`, update [wiki/decisions.md](../../wiki/decisions.md) (an entry, "Base UI for the three toggle widgets, hand-built where it has no part"), [wiki/status.md](../../wiki/status.md), [log.md](../../log.md), and `.claude/rules/web.md`. Run `bash corpus/lint.sh --index` and `bash corpus/lint.sh`.

## Acceptance

- [ ] `grep -rn "@base-ui/react" web/src --include=*.tsx --include=*.ts | grep -v "components/ui/"` prints nothing, and `grep -rln "@base-ui/react" web/src` prints the two wrapper files.
- [ ] `check-base-ui` reports 0 for rules 1, 2, 3, 9, 10 and 11. Rules 4-7 are left for brief 17, and their counts are in the outcome note.
- [ ] `npx knip` reports no unused dependency.
- [ ] `grep -c "const KINDS" web/src/*.tsx` shows one match, in `KindFilter.tsx`.
- [ ] A test shows the kind filter ignores clearing (one option always pressed) and the state picker allows it. Both through the wrappers' `onValueChange`, in `ui.test.tsx`.
- [ ] A test on `web/src/keys.ts` shows an arrow key inside a group doesn't swipe, and one on the page does.
- [ ] The Playwright script, outside the repo, shows: arrows move within the kind filter without swiping on `/rate`; a list of 50 rows has one Tab stop per picker; arrows move between the ratings tabs and Enter picks. Its output is in the outcome note.
- [ ] The before and after screenshots match, with any difference listed and explained.
- [ ] `npm run check` passes, and `bash corpus/lint.sh` ends clean.

## Interplay

- Brief 17 styles `web/src/components/ui/` with Tailwind on the parts, and removes the CSS rules this brief renamed. The family's pills (`.segmented`, `.tabs`) are 999 px radii with `aria-pressed` and `aria-selected` selectors today; Base UI sets `data-pressed` and `data-selected` instead, so the selectors change in brief 17 and must not be restyled here.
- The skills library's `check-base-ui` heuristic may flag a `Toggle` with an icon child. That is a false positive to report to the skill rather than except here.
- The answers to decisions 2 and 3 apply to any always-one-chosen filter and any page with window-level keys in the estate.
