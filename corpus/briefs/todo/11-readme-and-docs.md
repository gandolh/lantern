# Task 11: The README and the docs index

## Context

The README still says nothing is built. Once the first version works end to end, it needs the
estate's README shape (Wicket's is the newest): what Lantern is in two lines, what it does, how
to run it locally, where the docs are. No screenshots in this brief: captures of the app would
show the owner's ratings, and a later README pass can add clean ones.

Depends on 02-10.

## Files you OWN

- `README.md`, `docs/README.md`, `docs/owner-setup.md` (anything the later briefs changed)
- `corpus/wiki/status.md`, `corpus/log.md`

## What to do

1. **`README.md`**: what Lantern is (rate films and series, get suggestions with reasons), the
   features as built, the stack in a line, local development in a few commands, TMDB's credit
   (logo reference and the notice) and OMDb's, and links to `docs/` and the corpus.
2. **`docs/README.md`**: the question-to-page table, as Wicket's.
3. Check `docs/owner-setup.md` against the code: every variable named, the ports and paths.

## Acceptance

- Every link in the README and `docs/` resolves; no domain, path, username or secret.
- `npm run typecheck`, `npm run lint` and `npm test` still pass.
