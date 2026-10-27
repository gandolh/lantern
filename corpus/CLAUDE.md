# corpus: briefs and work log for Matinee

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
  wiki/status.md  one line per brief
```

## Rules

- A brief is `briefs/todo/<NN>-<slug>.md`: Context, Files you OWN, What to do, Acceptance. NN is
  the highest number across `todo/`, `done/` and `superseded/` plus one, two digits.
- Numbers never change. Finished work moves to `briefs/done/` with the same number and a short
  outcome note added at move time; after that the file is not edited. Work undone later moves to
  `briefs/superseded/` with a one-line note on top.
- Each finished brief gets a `log.md` entry and a line in `wiki/status.md`. Durable findings and
  decisions get a wiki page (`summary:` and `updated:` frontmatter, standard relative links).
- Absolute dates only.
- The app is independent of the owner's other apps (Shelfmark included): patterns may be copied
  from them, but no shared data or cross-app features unless the owner asks.
- Never write the production domain, an API key or a password into the repo. Keys are named by
  their `.env` variable.
