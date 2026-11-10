# Task 15: The house style and the quality harness

**Depends on:**

- In Lantern: nothing. This brief runs first.
- In the owner's skills library:
  - brief 27, *A house style, and a quality harness that enforces it*: the `house-style` package at `v1.0.0`, the `house-style` skill, and the plugin's `Stop` and `PostToolUse` hooks;
  - brief 15, *Enforce the base-ui and code-structure skills in every repo*: how the convention checkers are wired and when they run `--warn-only`.
- The owner's grilling of 2026-11-10, questions Q5-Q14 and Q45-Q46 of the skills library's open questions, and the new questions in decisions 2, 6 and 10.

**Runs before:** 16, 17 and 18. The reformat touches up to 43 TypeScript files, and those briefs rewrite or move most of them. Formatting first gives one clean reformat commit, and the formatter hook keeps every later diff formatted.

**Before you start:** run `brief-board guide` ([CLAUDE.md](../../CLAUDE.md)).

## Context

On 2026-11-09 the owner made three calls for every web app they own: Base UI 1.9.0 everywhere, the whole app on Tailwind v4, and the researched conventions enforced in each repo. The skills library's brief 27 measured the house style, the one the owner and their agents already write, and found it consistent but unenforced: nothing formats it, and the linter is thin. Its answer is a two-layer harness:

- **The repo's gate:** `npm run check` and its fast subset `npm run check:fast`. They hold for a human, any agent and the deploy.
- **The Claude Code layer:**
  - the plugin's `Stop` hook runs `check:fast`, and exits 2 on a failure;
  - its `PostToolUse` hook formats each saved file;
  - `.claude/rules/web.md` and `.claude/rules/server.md` are scoped by `paths:`;
  - a short root `CLAUDE.md` holds the commands.

This brief adopts both layers in Lantern. Briefs 16-18 then turn on their own checks inside it.

### What Lantern has today (read 2026-11-10)

- **`tsconfig.base.json`** already has `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `isolatedModules`, and `module`/`moduleResolution` `NodeNext`. `web/tsconfig.json` overrides them to `ESNext`/`bundler`, sets `types` to Vite's client types, and includes `src` and `vite.config.ts`, so **tests are type-checked in all three workspaces** (`server/tsconfig.json` and `shared/tsconfig.json` include `src`). No test file is hidden from `tsc`.
- **`eslint.config.js`** (31 lines): `@eslint/js` recommended, `typescript-eslint` recommended untyped (8.69.0), `eslint-plugin-react-hooks` 7.1.1 on `web/src/**`, and `_`-prefixed unused names. `npx eslint .` reports 0 findings.
- **No formatter.** No Prettier config, no `format` script.
- **Scripts** (root `package.json:14-21`): `typecheck` is `tsc -b && tsc -p web --noEmit` (two runs, because the root `tsconfig.json` has `files: []` and references only `shared` and `server`); `lint` is `eslint .`; `test` is `vitest run`; `dev` builds `shared` first (line 16); there is **no `pretest` and no `check`**.
- **No root `CLAUDE.md` and no `.claude/`.** The only `CLAUDE.md` is [corpus/CLAUDE.md](../../CLAUDE.md), which Claude Code loads only once an agent reads a file under `corpus/`. An agent that never opens the corpus sees no commands and none of the hard rules (no secrets, no CI, no pushes, no deploys).
- **`.npmrc`** has `save-exact=true`; every dependency is pinned.
- **The Docker image** (`infrastructure/Dockerfile`) runs a full `npm ci` in the `deps` stage (line 38), on `node:24-alpine` with only `python3 make g++` added (line 29). **There is no `git`.** The builder stage then runs `npx tsc -b server` (line 47).
- **The web tests** run in vitest's default `node` environment, through `renderToStaticMarkup` (`web/src/Shell.test.tsx:1`). There is no DOM test environment.

### Measured on 2026-11-10

Taken on a scratch copy of the repo (never in it), after `npm ci`: Prettier 3.8.1 (the machine's), TypeScript 6.0.3, typescript-eslint 8.69.0, Node 22. The file set is the 88 TypeScript and JavaScript files outside `vendor/`: 6,524 lines (`server/src`, `shared/src`, `web/src`, the three config files).

**Prettier churn.** `--trailing-comma all`, everything else default (the code already uses double quotes and semicolons), `--write` then `git diff --numstat`, summing removed lines:

| `printWidth` | Lines changed | Files changed |
|---|---|---|
| 100 | 380 | 65 |
| 110 | 300 | 59 |
| 120 | 201 | 50 |
| 130 | 133 | 43 |
| 140 | 100 | 38 |
| 150 | 70 | 27 |
| 160 | 67 | 23 |
| 180 | 68 | 20 |
| 200 | 102 | 24 |

Lantern is written wide: 117 lines run past 130 columns, and the least churn is flat from 150 to 180. At the estate's likely 120 it is 201 lines in 50 files (3.1%).

The other file types:

- **CSS:** `web/src/styles.css` changes 4 lines, all multi-value `font-family`, `box-shadow` and `transition` declarations that Prettier splits one value per line. Brief 17 deletes the file.
- **JSON and `web/index.html`:** no change.
- **Markdown** (README, `docs/`, `corpus/`): 132 lines in 15 files. Prose, left out (decision 3).

**TypeScript flags.** `verbatimModuleSyntax` and `erasableSyntaxOnly` added to `tsconfig.base.json`, then `tsc -b` and `tsc -p web --noEmit`:

- **`erasableSyntaxOnly`: 5 errors**, all parameter properties: `server/src/sources/http.ts:12, 23, 25` and `web/src/api.ts:23, 24`.
- **`verbatimModuleSyntax`: 0 errors.**

**The house shapes**, counted with the TypeScript parser over the same 88 files:

| Shape | Count | Where |
|---|---|---|
| `enum` | 0 | |
| `any` (the keyword) | 0 | |
| `@ts-ignore` / `@ts-nocheck` / `@ts-expect-error`, `eslint-disable` | 0 | |
| `TODO` / `FIXME` / `XXX` / `HACK` | 0 | |
| non-null `!` in source | **17** | `server/src/suggest/score.ts:71` (×2), `72` (×2), `86`, `110`; `server/src/testing.ts:23`; `server/src/states.ts:103`; `server/src/db.ts:123`; `server/src/sources/posters.ts:42`; `server/src/pool/files.ts:33`; `server/src/pool/import.ts:139, 143`; `server/src/app.ts:68`; `web/src/Poster.tsx:16`; `web/src/route.ts:50, 51` |
| non-null `!` in `*.test.ts` | **12** | `server/src/suggest/score.test.ts:64, 66` (×2); `auth.test.ts:36` (×2); `sources/omdb.test.ts:86, 87`; `routes/titles.test.ts:63`; `routes/suggestions.test.ts:42, 43`; `routes/sources.test.ts:54, 55` |
| `console` | 13 | all in CLIs or the entry before its logger exists: `server/src/index.ts:34`, `seed.ts:71, 79`, `sources/check.ts:42, 44, 45, 50`, `pool/cli.ts:43, 48, 58, 59, 60, 67` |
| `process.env` in `server/src` | 6 (+1 test) | `index.ts:31`, `seed.ts:60, 61, 67`, `sources/check.ts:35`, `pool/cli.ts:38`; the test is `auth.test.ts:110`; `web/vite.config.ts:43` is a build config |
| default exports | 3 | `vitest.config.ts:5`, `eslint.config.js:11`, `web/vite.config.ts:41`: all configs |
| parameter properties | 5 | the five `erasableSyntaxOnly` errors above |
| `void` on a promise | 8 | `server/src/reply.ts:15`, `web/src/AccountPage.tsx:61, 65, 69`, `LoginPage.tsx:41, 121`, `auth.ts:29`, `AuthGate.tsx:36` |
| `as` casts | 37 in source, 8 in tests | |

The parser also reports one "namespace", `server/src/app.ts:120`. It is `declare module "fastify"`, an augmentation, and `no-namespace` allows it.

**Six typed rules** (`no-floating-promises`, `no-misused-promises`, `await-thenable`, `switch-exhaustiveness-check` with `considerDefaultExhaustiveForUnions: true`, `no-unnecessary-type-assertion`, `consistent-type-imports`), plus `no-non-null-assertion`, through `projectService`, over `server/src shared/src web/src`: **7 s**, and:

| Rule | Findings |
|---|---|
| `no-floating-promises`, `no-misused-promises`, `await-thenable`, `consistent-type-imports` | 0 |
| `no-unnecessary-type-assertion` | 3: `server/src/pool/files.ts:46`, `server/src/suggest/suggest.ts:46`, `web/src/ListPages.tsx:41` |
| `switch-exhaustiveness-check` | 1: `web/src/route.ts:39` (`first` is `string \| undefined`; the switch has no `default`) |
| `no-non-null-assertion` | 29 (the 17 and 12 above) |

**knip** 5.88.1, with the CLIs as entries (`server/src/index.ts`, `seed.ts`, `server/src/sources/check.ts`, `server/src/pool/cli.ts`; `web/src/main.tsx`): **1 unused dependency**, `@base-ui/react` (`web/package.json:13`), which brief 16 puts to use; 33 unused exports and 12 unused exported types, mostly constants and helpers exported for tests (`server/src/app.ts:42-76`, `suggest/score.ts:18-115`).

**A missing `pretest`.** On the scratch copy with `shared/dist` and `server/dist` removed, `npx vitest run` ends with **10 of 18 test files failed**, 43 tests passing. After `npx tsc -b` it is 18 of 18 and 104 tests, in 6 s. `@lantern/shared` resolves through `shared/dist` (`shared/package.json:7-13`), which is gitignored, so `npm test` fails on a fresh clone.

**Not measured:** `@vitest/eslint-plugin` recommended (not installed on the scratch copy); `projectService` against `project` timing; `check` and `check:fast` as scripts (they don't exist). Step 1 measures them.

## Owner decisions (defaults this brief builds)

1. **Where the configs come from** (Q6, brief 27 decision 1). Default: the `house-style` package, extended from Lantern's configs.

   Lantern adds a constraint: the Docker `deps` stage runs a full `npm ci` **without `git`**, and `tsconfig.base.json` is copied into that stage (`infrastructure/Dockerfile:36`). A `github:` dependency would break it. Default within that: the tagged GitHub tarball URL, which npm fetches without git. If the owner prefers `github:`, add `git` to the `apk add` line at line 29 in the same commit. If Q6 goes the other way (configs copied into the repo), the same rules land as local files with a version header. Steps 3-5 don't change.
2. **Width** (Q8). Default: the estate's one width. If it isn't settled when this runs, use 150: Lantern's churn is flat from 150 to 180 (67-70 lines), and the-board's least churn is also 150, so the family shares it. *New question for the grilling*: is the small tools family's width 150 while the estate is 120 or 130? At 120 Lantern pays 201 lines.
3. **Markdown stays out of Prettier** (Q45). Default: `.prettierignore` lists `*.md`.
4. **tsconfig** (Q11). Default: add `verbatimModuleSyntax` and `erasableSyntaxOnly`, not `exactOptionalPropertyTypes`.
5. **Typed lint** (Q12). Default: the six rules through `projectService` (7 s here), with `switch-exhaustiveness-check` set to `considerDefaultExhaustiveForUnions: true`.
6. **The house shapes** (Q13). Default:
   - `no-non-null-assertion`: **error in source, warning in tests** (17 fixed, 12 left as warnings). `server/src/testing.ts` and `server/src/sources/testing.ts` are test helpers and take the test setting. *New question for the grilling*: the-board has 65 `!` and wicket 51 in tests, so is the split the estate's rule?
   - `no-console` is an error outside the four CLI files and the entry.
   - `no-process-env` (from `eslint-plugin-n`) starts as a **warning**, because its 6 findings are brief 18's work.
   - the rest are errors.
7. **`check:fast`** (Q10). Default: a typecheck plus ESLint on the changed files, under about 15 s warm with one changed file.
8. **The Claude Code layer** (Q7). Default: the plugin's hooks. If the owner chooses committed hooks, add them to `.claude/settings.json` here.
9. **A root `CLAUDE.md`** (Q46). Default: create one, and move the repo-wide rules out of [corpus/CLAUDE.md](../../CLAUDE.md) into it: the no-secrets, no-CI, no-pushes, no-deploys bullets, and the brief-board section.
10. **`pretest`.** Default: `"pretest": "tsc -b shared"`, as `dev` already does. This is the estate's fix (Almanac has it; the-board, Satchel and Shelfmark need it). Alternative: a vitest alias from `@lantern/shared` to its source, which hides the build step but makes tests run against source the server never ships.

## Files you OWN

- `tsconfig.base.json`, and `web/tsconfig.json` (only to add `incremental` with a `tsBuildInfoFile`).
- `eslint.config.js`.
- New: the Prettier config, `.prettierignore` and `.git-blame-ignore-revs`.
- The root `package.json` (scripts, devDependencies) and `package-lock.json`.
- The reformat itself: whitespace-only changes to every file Prettier covers.
- The fixes the new rules ask for:
  - the five parameter properties (`server/src/sources/http.ts`, `web/src/api.ts`);
  - the 17 source `!`s;
  - `web/src/route.ts:39` and the three unnecessary assertions.
- New: `.claude/rules/web.md`, `.claude/rules/server.md`, `CLAUDE.md`.
- [corpus/CLAUDE.md](../../CLAUDE.md): its repo-wide rules move out.
- `scripts/conventions.json` (brief 15 of the library's exceptions file), if an exception is needed.
- `infrastructure/Dockerfile`: only the `apk add` line, and only under decision 1's `github:` branch.
- Corpus: [wiki/decisions.md](../../wiki/decisions.md) (a new entry), [wiki/status.md](../../wiki/status.md), [log.md](../../log.md), [.planned-roots](../../.planned-roots) (drop `.claude` and `scripts` once they exist).

## Files you must NOT touch

- Behaviour. Apart from the fixes above, every change is formatting or configuration.
- `server/vendor/` and `web/vendor/`: generated copies of the Ward library, ignored by ESLint and Prettier.
- The layout of `server/src` and the CSS, which are briefs 18 and 17.
- The skills library and the `house-style` repo. A rule that seems wrong for Lantern is reported back, not patched locally.

## What to do

One commit per step, each with `npm run typecheck`, `npm test`, `npm run lint` and `npm run build` green.

1. **Measure first**, on a scratch copy. Record in the `log.md` entry:
   - the six typed rules' counts and lint time with `projectService` against `project` (the table above is the baseline);
   - `npx knip` from the `house-style` preset;
   - the `tsc` counts with the two flags;
   - `@vitest/eslint-plugin` recommended's count, with `assertFunctionNames` set to what the tests use (`expect`);
   - the `pretest` failure: remove `shared/dist` and run `npx vitest run`, expecting 10 of 18 files failed.

   A rule that finds more than about 20 real problems, or mostly false ones, goes back to the owner before it is turned on (brief 27's rule: bring it, don't loosen it). `no-non-null-assertion` is the only one over that line, and decision 6 already answers it.
2. **`pretest`, Prettier and the reformat.**
   1. Add `"pretest": "tsc -b shared"`. Confirm: with `shared/dist` removed, `npm test` passes.
   2. Add `prettier` (pinned) and the config: `printWidth` per decision 2, `trailingComma: "all"`, the rest default.
   3. Add `.prettierignore`: `*.md`; `server/vendor/` and `web/vendor/`; `package-lock.json`; `dist/`, `data/`, `coverage/`; `web/public/`.
   4. Add `"format": "prettier --write ."` and `"format:check": "prettier --check ."`, and commit this alone.
   5. Run `npm run format` and commit only that, as `style: format with Prettier`.
   6. Add that commit's full hash to `.git-blame-ignore-revs`, in its own commit, and hand the owner the one-time `git config blame.ignoreRevsFile .git-blame-ignore-revs`.
3. **tsconfig.** Add `verbatimModuleSyntax` and `erasableSyntaxOnly` to `tsconfig.base.json`.
   - Replace the five parameter properties with declared fields assigned in the constructor. Behaviour and `readonly` stay.
   - Add `"incremental": true` and a `tsBuildInfoFile` under `node_modules/.tmp/` to `web/tsconfig.json`.
   - The Dockerfile's `npx tsc -b server` must still build.
4. **ESLint.** Extend the house config (decision 1), passing Lantern's roots:
   - web is `web/src`; server is `server/src`; shared is `shared/src`;
   - the CLIs are `server/src/index.ts` (later `server.ts`), `seed.ts`, `server/src/sources/check.ts`, `server/src/pool/cli.ts`;
   - the test files are `*.test.{ts,tsx}`, `server/src/testing.ts` and `server/src/sources/testing.ts`.

   The diff in effect:

   | Rule | Today | After | Findings today |
   |---|---|---|---|
   | the six typed rules | off | error, through `projectService` | 4 (step 1) |
   | `no-non-null-assertion` | off | error in source, warn in tests | 17 source (fix), 12 test (leave) |
   | `no-restricted-syntax` on `TSEnumDeclaration` | off | error | 0 |
   | `no-warning-comments` (`todo`, `fixme`), pointing at `corpus/` | off | error | 0 |
   | `no-console` outside the CLI files | off | error | 0 |
   | `no-default-export` (from `eslint-plugin-import-x`) outside `*.config.*` | off | error | 0 |
   | `no-process-env` (from `eslint-plugin-n`) on `server/src` outside `config.ts` and tests | off | **warn**; brief 18 makes it an error | 6 |
   | `@vitest/eslint-plugin` recommended on tests | off | error | step 1 |
   | `no-explicit-any`, `ban-ts-comment` | error (recommended) | unchanged | 0 |
   | `react-hooks` recommended on `web/src` | on | unchanged | 0 |
   | `better-tailwindcss` | absent | brief 17 adds it | |

   Typed linting needs `allowDefaultProject` for the files no tsconfig includes: `vitest.config.ts`, `eslint.config.js`. The root `tsconfig.json` has `files: []`. Fix what the typed rules find (the three assertions and the `route.ts:39` switch), or list each finding left, with its reason, in the outcome note.
5. **The gate.** In the root `package.json`:
   - `check` runs `typecheck`, `lint`, `format:check`, `check:conventions` and `test`.
   - `check:conventions` is knip plus the two convention checkers from the `house-style` package (or `scripts/`). `check-base-ui` runs `--warn-only` until brief 17 is done, and `check-structure` `--warn-only` until brief 18 is done. knip reports `exports` as a warning, and `dependencies` strictly: the unused `@base-ui/react` fails it until brief 16 imports it, so this step marks that one dependency as expected in `knip.json`, with a comment naming brief 16, and brief 16 removes the line.
   - `check:fast` runs `typecheck`, then ESLint on the files changed against `HEAD` plus untracked ones. A small Node script in `scripts/`, with no shell-only syntax (the owner works on Windows under WSL).
   - `lint` stays `eslint .`.

   Time `check:fast` warm with one changed file, and `check` in full. Record both.
6. **`.claude/rules/`.** Each file under about 40 lines, with `paths:` frontmatter.
   - **`web.md`** (`paths: ["web/src/**"]`):
     - read the `base-ui` skill;
     - Base UI only through `web/src/components/ui/` wrappers, from subpaths (brief 16 creates the folder);
     - dark mode is `prefers-color-scheme` only, no `data-theme`;
     - the swipe card owns pointer drags and the rating page owns the window's keys, so a new control on `/rate` must not eat arrow keys ([wiki/decisions.md](../../wiki/decisions.md), "Swipes on the cards are for the titles not seen");
     - glossary words in UI copy ([wiki/glossary.md](../../wiki/glossary.md));
     - tests are static markup (`renderToStaticMarkup`) and assert on roles and text, not class names.

     Briefs 16 and 17 add the Base UI and Tailwind lines.
   - **`server.md`** (`paths: ["server/src/**", "shared/src/**"]`):
     - read the `code-structure` skill, and [wiki/architecture.md](../../wiki/architecture.md) and [wiki/data-model.md](../../wiki/data-model.md);
     - every row is scoped to the signed-in user (`userIdOf(request)`, `server/src/routes/states.ts:19`);
     - errors are `{ code, message }` (`errorBodySchema`, `shared/src/api.ts:14`), through `fail()`, which the web parses;
     - `server/vendor/` is generated, so never edit it;
     - the server works only while answering a request: no timers, no background jobs ([wiki/decisions.md](../../wiki/decisions.md), "No background work");
     - no secret is ever logged or written to the repo; keys are named by their `.env` variable.

     Brief 18 adds the structure lines.
7. **`CLAUDE.md`** at the root, under about 60 lines:
   - one line on what Lantern is, and "read [corpus/index.md](../../index.md) first";
   - the commands: `npm run dev`; `npm run check` before every hand-back; `npm run check:fast`; one test with `npx vitest run <file>`; `npm run seed -w @lantern/server`; `npm run titles:import -w @lantern/server`;
   - the places that mislead: the typecheck is two runs; `.env` sits at the repo root; the API is on 8810 and Vite on 5180 at `/lantern/`; `OMDB_API_KEY` unset means no posters and a 503 `no_key` from the record route, which is normal in development;
   - the moved repo-wide rules and the brief-board section.

   [corpus/CLAUDE.md](../../CLAUDE.md) keeps the layout, numbering, frontmatter, source of truth, and the public-repo writing rules.
8. **Corpus.**
   - Add a [wiki/decisions.md](../../wiki/decisions.md) entry, "The house style, formatted and checked": the width, the config source, what was rejected and why.
   - Update [wiki/status.md](../../wiki/status.md) and [log.md](../../log.md), and drop `.claude` and `scripts` from [.planned-roots](../../.planned-roots).
   - Run `bash corpus/lint.sh` until it ends clean.

## Acceptance

- [ ] `npm run check` passes. Its run time and `check:fast`'s, warm with one changed file, are in the outcome note, and `check:fast` is under about 15 s or the owner has accepted the time.
- [ ] `npx prettier --check .` passes. The reformat is one commit that changes whitespace only (`git diff -w <hash>^ <hash>` shows nothing beyond line wrapping), and its hash is in `.git-blame-ignore-revs`.
- [ ] With `shared/dist` removed, `npm test` passes: `pretest` built it.
- [ ] `tsconfig.base.json` has `verbatimModuleSyntax` and `erasableSyntaxOnly`. `npm run typecheck` and `docker build -f infrastructure/Dockerfile .` pass.
- [ ] ESLint reports zero errors with every rule in step 4's table, and the counts before and after are in the outcome note. `npx eslint . 2>&1 | grep -c warning` is the 12 test `!`s and nothing else.
- [ ] A deliberate `enum`, a `!` in `server/src/app.ts`, a `console.log` there, `// TODO` and an `export default` in a non-config file each fail `npm run lint`; a `!` in a `*.test.ts` only warns. Revert them after.
- [ ] `.claude/rules/web.md` and `server.md` exist with `paths:` frontmatter. The root `CLAUDE.md` is under about 60 lines and lists `npm run check`.
- [ ] With the plugin's hooks on, an agent's edit is formatted on save, and a type error stops it at `Stop`.
- [ ] `bash corpus/lint.sh` ends clean.

## Interplay

- Brief 16 imports Base UI, which clears knip's one unused dependency, and removes the expected-unused line from `knip.json`. Brief 17 adds `better-tailwindcss` and drops `check-base-ui`'s `--warn-only`. Brief 18 adds dependency-cruiser, drops `check-structure`'s `--warn-only`, and turns `no-process-env` (from `eslint-plugin-n`) into an error.
- The reformat changes `web/src/styles.css` by 4 lines; brief 17 deletes the file.
- If brief 18 renames `server/src/index.ts` to `server.ts`, the CLI list in `eslint.config.js` changes with it.
