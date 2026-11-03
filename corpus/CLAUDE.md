# corpus: briefs and work log for Lantern

This folder tracks work as numbered briefs, the way the owner's other repos do (the corpus-flow
skill). It was started on 2026-10-27, before any code, and is deliberately small. A routing
table, a lint script and more wiki pages can be added when the project grows into them.

## Layout

```
corpus/
  CLAUDE.md       this file
  index.md        the front door
  log.md          chronological record, newest last, absolute dates
  briefs/         numbered work specs: todo/ done/ superseded/
  wiki/status.md  where the work stands, a dated line per area
```

## Rules

- A brief is `briefs/todo/<NN>-<slug>.md`: Context, Files you OWN, What to do, Acceptance. NN is
  the highest number across `todo/`, `done/` and `superseded/` plus one, two digits.
- Numbers never change. Finished work moves to `briefs/done/` with the same number and a short
  outcome note added at move time; after that the file is not edited. Work undone later moves to
  `briefs/superseded/` with a one-line note on top.
- Each finished brief gets a `log.md` entry and updates its area's line in `wiki/status.md`;
  briefs run in number order and status.md doesn't list them one by one. Durable findings and
  decisions get a wiki page (`summary:` and `updated:` frontmatter, standard relative links).
- Absolute dates only.
- Code comments don't cite brief numbers ("brief 03", "(brief 05)"). Say what the code does and
  why; the history belongs in `log.md`.
- The app is independent of the owner's other apps (Shelfmark included): patterns may be copied
  from them, but no shared data or cross-app features unless the owner asks.
- Never write the production domain, an API key or a password into the repo. Keys are named by
  their `.env` variable.

## brief-board

Brief progress goes on brief-board. Run `brief-board guide` before you
start or resume a brief, and follow it.
