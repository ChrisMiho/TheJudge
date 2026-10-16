# Graph run — ci-warnings-cleanup

- Run ID: `graph-20261016-061526` (spec-forming half); build half `graph-20261016-092729`
- Profile: `loaded (env sentinel)` — printed by `npm run graph:preflight` at node 1; build half `unverified`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`; graph canary `denied — graph tier armed (nohup true)`
- Autonomous base: `origin/main`
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-ci-warnings-cleanup`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261016-061526/` (one file, `ci-warnings-capture.md`, copied verbatim to `intake/`)
- Current node: `close` (attempt 1)
- Next action: `/graph-implement PRD/work/ci-warnings-cleanup/` resumes from the `STATUS.*` marker in `.worktrees/implement-ci-warnings-cleanup`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 7` | branch `thejudge-auto/ci-warnings-cleanup` pushed (`git ls-remote` → `f0241ec4`) from `.worktrees/kickoff-ci-warnings-cleanup`; launch checkout still on `main`; lock `.worktrees/.graph-run.lock` runId `graph-20261016-061526` | 2026-10-16 |
| 2 | shape | sonnet | ok | `0 → 12` | `PRD/work/ci-warnings-cleanup/` (IDEA.md, README.md, STATUS.ideation, intake/ci-warnings-capture.md) and board row committed `c122658a`, pushed; local `npm run lint` = 0 errors, 19 warnings | 2026-10-16 |
| 3 | define | opus | ok | `0 → 56` | `DESIGN-BRIEF.md`, `STATUS.refined`, board row committed `3c484ba8`, pushed; no `GATE-QUESTIONS.md` (no product-truth change) → no gate; driver re-checked chosen majors via `gh api repos/<action>/contents/action.yml?ref=<tag>` → all `node24` | 2026-10-16 |
| 4 | gate-qc | sonnet | ok | `0 → 11` | Quality-check PASS, findings none; recorded in README `## Preparation gate`; run stops here — docs PR opened, park at `owner-action` (`STATUS.owner-action`, board row moved) | 2026-10-16 |
| 5 | gate-review | driver | ok | `degraded (no run state)` | build half run `graph-20261016-092729`: docs PR #315 merged (`origin/main` `d94b34e1`); kickoff worktree removed clean (`git worktree remove`); claim commit `c006c90c` on `thejudge-auto/ci-warnings-cleanup-work` cut from `origin/main` `d94b34e1`, pushed; lock taken from the launch root; graph canary `nohup true` denied; no `GATE-QUESTIONS.md` → nothing to apply, driver restored `STATUS.refined` (only marker), README status, board row under refined | 2026-10-16 |
| 4 | gate-qc (build half, attempt 1) | sonnet | ok | `0 → 10` | PASS, findings none; brief re-checked against `origin/main` `d94b34e1`: `npx eslint .` in the worktree → 19 warnings (15 fast-refresh in 9 files, `ConversationThread.tsx:173` hook deps, 3 unused-disable) = brief; six jobs in `.github/workflows/quality-check.yml` all `runs-on: ubuntu-latest`, pins checkout/setup-node/upload-artifact/download-artifact/configure-aws-credentials `@v4` as described; no `PRD/sections/` change (only mention `non-functional-requirements.md:206` stays true on `ubuntu-24.04`); no files written; README `## Preparation gate` PASS recorded by the driver; worktree and launch-checkout porcelain empty | 2026-10-16 |
| 5 | plan | sonnet | failed | `0 → 11` | commit `fbe4d000` (= origin tip): `GAMEPLAN.md`, `slice-a-workflow-pins.md` + `slice-a.criteria.json` (7, 2 manual), `slice-b-lint-fixes.md` + `slice-b.criteria.json` (10, 1 manual), `STATUS.active`, board row under active; pins match `DESIGN-BRIEF.md:101-103`. Driver check failed it: `slice-a.criteria.json` A7 is post-merge only (`changes`/`deploy` never run on a PR, `slice-a-workflow-pins.md:24`), so `build` cannot earn it before the owner's merge and could not report `ok` honestly; precedent `PRD/instructions/receipts/follow-ups-keep-their-rules-2026-10-12.md:104` keeps post-merge checks as an owner-run GAMEPLAN reading. Re-dispatched as attempt 2 to move A7 there | 2026-10-16 |
| 5 | plan (attempt 2) | sonnet | ok | `0 → 7` | commit `d36c13a8` (= origin tip): A7 removed from `slice-a.criteria.json` and the slice A checklist; full check from `DESIGN-BRIEF.md` criterion 5 now an owner-run `## Post-merge reading` at `GAMEPLAN.md:27`, pointer at `slice-a-workflow-pins.md:24`; slice A 6 criteria (1 manual, A6 — PR run annotations, earnable in `build`), slice B 10 (1 manual) unchanged, every `value` false; `STATUS.active` only marker; board row under active; worktree porcelain empty (published for `build`) | 2026-10-16 |
| 6 | build | sonnet | ok | `0 → 65` | PR https://github.com/ChrisMiho/TheJudge/pull/316 (open, base `main`); 12 commits `6a6cfcf5` (A) … `cfdad454` (A6 evidence, ship-ready) = origin tip; 16/16 criteria `value: true` (A 6, B 10); reported `npm run lint` 0 errors / 0 warnings (was 19), `npm run typecheck` pass, 6 targeted test files / 119 tests pass, `ci-workflow-parity` 5/5 and `deploymentPipeline` 4/4 unedited, `npm run quality:check` 0; A6: PR run `38926130654` six jobs passed, annotations API 0 per job (final docs-only push started run `38926614536`, pending at return); no `PRD/sections/` change; `STATUS.ship-ready`; return side: launch-checkout porcelain empty before and after (identical), `classifyBuildWrites` over 42 paths (`git diff --name-only origin/main HEAD` + `.tmp/pr-body.md`) → `ok`, 0 outside `.worktrees/implement-ci-warnings-cleanup/`; worktree porcelain empty | 2026-10-16 |
| 7 | review | opus | ok | `0 → 20` | APPROVE: 16/16 met (A1-A6, B1-B10), 0 Critical / 0 Important, 1 Minor (four formerly private helpers now exported from `frozenGameContextTriggerLabel.ts` and `ambientSceneFallback.ts`, required by the split; no change needed); `destinationRegistry` aliases were private constants on `origin/main`, exports unchanged; reviewer re-ran `npm run lint` 0, `npm run typecheck` 0, `ci-workflow-parity` 5/5, 13 frontend test files / 195 tests pass, `npm run quality:check` 0; A6 on head `2cfcfa43`: run `38926832228` (`pull_request`, success), six jobs 0 annotations each; launch and worktree porcelain empty (no reviewer writes) | 2026-10-16 |

## Gate verdicts

- None: refinement proposed no product-truth change, so no `GATE-QUESTIONS.md` exists. The owner's merge of docs PR #315 is the build signal.

## Open gate

- None

## Dispatch prompts

### preflight

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of graph run `graph-20261016-061526`. Invoke the `graph-preflight` skill via the Skill tool and follow it exactly with these inputs:

- --branch thejudge-auto/ci-warnings-cleanup
- --slug ci-warnings-cleanup
- --run-id graph-20261016-061526
- --pid 6563

Steps: (1) run `npm run graph:preflight -- --branch thejudge-auto/ci-warnings-cleanup --slug ci-warnings-cleanup --run-id graph-20261016-061526 --pid 6563 --dry-run` from the working directory above; (2) if it exits non-zero, stop and report its output verbatim; (3) otherwise run the identical command without --dry-run; (4) issue the universal canary command and the graph canary command the script prints as real Bash tool calls — both must be DENIED by the hook; report the exact deny reason text for each; (5) confirm end state: in .worktrees/kickoff-ci-warnings-cleanup the current branch is thejudge-auto/ci-warnings-cleanup, `git ls-remote --heads origin thejudge-auto/ci-warnings-cleanup` shows it, and the launch checkout's branch is still main.

Rules: never retry a denied command; never hand-resolve a refusal; never write the lock by hand; never commit, stash, or switch the launch checkout. Change files only with the Write and Edit tools and run git as short separate calls. If you write any prompt for a subagent, copy the Working directory line above into it unchanged.

Report back, in plain lines: shape, base, worktree (absolute path), the Profile line verbatim, the lock record, universal canary result + reason text, graph canary result + reason text, and the end-state confirmations. Outcome: ok or failed.

### shape

graph is controlling

You are node 2 (`shape`) of graph run `graph-20261016-061526`. Invoke and follow the `thejudge-kickoff` skill (read `.claude/skills/thejudge-kickoff/SKILL.md` in the working directory below) in its controlled mode.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-ci-warnings-cleanup

Copy that Working directory line unchanged into any prompt you write. Every file you read or write lives under that path — never under /Users/chrismiho/Coding/Projects/TheJudge/PRD directly (that is the owner's launch checkout; do not touch it).

Slug (use exactly): `ci-warnings-cleanup`. Branch already checked out there: `thejudge-auto/ci-warnings-cleanup`.

Staged intake (absolute path): /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261016-061526/ — one file, `ci-warnings-capture.md`, the driver's capture of every warning and notice annotation from the latest Quality Check run. Copy it verbatim into `PRD/work/ci-warnings-cleanup/intake/` and commit it. Intake is evidence, not authority.

The owner's request, verbatim:

> on the most recent github actions workflow, i can see 17 warningings listed about ubuntu and some other aspects of the code, can we address these?

Your job: create `PRD/work/ci-warnings-cleanup/` with the normal `IDEA.md`, `README.md`, and `STATUS.ideation` marker, and add the package row to `PRD/work/STATUS.md`. Search `PRD/instructions/receipts/` for prior runs on the same ground (keywords: workflow, quality-check.yml, GitHub Actions, Node 20, ubuntu, runner, lint warning, react-refresh, exhaustive-deps, deploy, arm64) and write one `## Prior run` line per match. Investigate only request-relevant material to ground the IDEA: `.github/workflows/quality-check.yml` (every `runs-on` and every `uses:` pin), the frontend ESLint config and how lint runs in CI (is `--max-warnings` set?), and each file named in the intake (what the flagged export or hook dependency is). Run the frontend lint locally if `node_modules` is present in the worktree (install them in the worktree if not) to confirm the current warning count. Record what you find with file paths, but do not decide a fix — choices such as which action versions or runner image to pin belong to refinement and the owner.

Mechanics: change files with the Write and Edit tools. Run git as short separate calls from the working directory (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`. Commit the package, the intake copy, and the board row on the branch and push. Do not edit `PRD/sections/`, workflow files, or any code. Do not create `GRAPH-RUN.md` — the driver writes the ledger.

Do not spawn subagents or forks. Do not sleep or poll. Stay well under 60 tool calls.

Report back: outcome (`ok`, `failed`, or `NO ACTIONABLE PACKAGE`), the files created, the commit sha and push result, the prior-run matches, the local lint warning count, and a short evidence summary per warning group (file paths).

### define

graph is controlling

You are node 3 (`define`), attempt 1, of graph run `graph-20261016-061526`. Invoke the `thejudge-refinement` skill (read `.claude/skills/thejudge-refinement/SKILL.md` in the working directory below) and follow its controlled mode. Tool-call cap 150 — verify directly, spawn no subagents or forks, no sleeping or polling, stay well under the cap.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-ci-warnings-cleanup

Copy that Working directory line unchanged into any prompt you write. Work only inside that directory (branch `thejudge-auto/ci-warnings-cleanup`). Never write under /Users/chrismiho/Coding/Projects/TheJudge outside `.worktrees/kickoff-ci-warnings-cleanup`.

Package: `PRD/work/ci-warnings-cleanup/` (IDEA.md and README.md carry node 2's evidence and prior-run receipts; `intake/ci-warnings-capture.md` is the CI annotation capture). The owner's symptom: the Quality Check workflow on GitHub lists warnings — the Node 20 action-runtime deprecation on every job, React lint warnings from the static job, and the notice that `ubuntu-latest` moves to Ubuntu 26 on 2026-10-19. The owner wants them addressed. Node 2 found 19 lint warnings locally, more than the CI annotations show (GitHub caps annotations per step); decide on the evidence whether the uncapped siblings belong in the core scope, and keep anything wider than clearing the warnings the owner sees (for example making new warnings fail CI) as a separately offered follow-up in the brief, not the core proposal.

Verify external facts from source, not memory. For every action the workflow pins (`actions/checkout`, `actions/setup-node`, `actions/upload-artifact`, `actions/download-artifact`, `aws-actions/configure-aws-credentials`), read its current release notes on GitHub (`gh release list` / `gh release view` against the action repo, or `gh api`) and record the first major that runs on Node 24 and any breaking change that touches how this workflow uses it (for example artifact name or merge behavior, credential inputs). For the runner, read https://github.com/actions/runner-images/issues/14748 (`gh issue view 14748 -R actions/runner-images`) and record what changes on Ubuntu 26 that could affect this workflow — especially the deploy job that builds the arm64 Lambda bundle with native modules — and which explicit runner labels exist. Record each fact in the brief with its source.

Lint fixes must not change app behavior: the fast-refresh warnings are non-component exports beside components (move them to sibling modules and update imports), and the `ConversationThread.tsx:173` hook-dependency warning needs a fix that keeps the scroll-to-latest behavior identical — explain in the brief how that is guaranteed.

Then write `DESIGN-BRIEF.md` per the skill. Product truth is proposed, not written: never edit `PRD/sections/`, workflow files, or code. Check whether current truth in `PRD/sections/` states anything about CI, the workflow, runner images, or lint policy; when the design needs new or changed product truth, write `PRD/work/ci-warnings-cleanup/GATE-QUESTIONS.md` with one `## <STABLE-ID>` block per stable ID, each opening with the three plain-language lines from `PRD/instructions/plain-language-standard.md` (What this decides, In plain terms, What happens if you say no), then that ID's complete proposed diff, then the verdict and reason slots. Propose amendments in place rather than contradictions. Every product decision you cannot settle from confirmed truth under the preparation contract's assumption ladder goes to the owner through `GATE-QUESTIONS.md` — decide each one fresh, on its own evidence. When no product truth changes, write no questions file.

Mechanics: change files with the Write and Edit tools. Run git as short separate calls from the working directory (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`. Set the package status marker per the skill. Do not edit `GRAPH-RUN.md` — the driver owns the ledger.

Report back: outcome (`ok` or `failed`), the verified action and runner facts (with sources), the chosen design in plain words, the files written, whether `GATE-QUESTIONS.md` exists and the stable IDs in it, the commit sha and push result, and `git status --porcelain` for the worktree.

### gate-qc

graph is controlling

You are node 4 (`gate-qc`), attempt 1, of graph run `graph-20261016-061526`. Invoke the `thejudge-quality-check` skill (read `.claude/skills/thejudge-quality-check/SKILL.md` in the working directory below) and follow its controlled mode. Tool-call cap 60 — spawn no subagents or forks, no sleeping or polling, stay well under the cap.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-ci-warnings-cleanup

Copy that Working directory line unchanged into any prompt you write. Work only inside that directory (branch `thejudge-auto/ci-warnings-cleanup`).

Package: `PRD/work/ci-warnings-cleanup/`. Grade `DESIGN-BRIEF.md` against PRD alignment and agent-readiness per the skill. Refinement wrote no `GATE-QUESTIONS.md` and states that no `PRD/sections/` truth changes; check that claim against `PRD/sections/` (anything stating CI, workflow, runner image, action versions, or lint policy). Check that every acceptance criterion in the brief is observable and that the behavior-preservation argument for the lint fixes (especially the `ConversationThread.tsx` scroll-to-latest change) is sound against the current code. The brief's external facts (action majors and their Node runtimes, runner labels) were re-checked by the driver against each action's `action.yml`; spot-check any you doubt with `gh api` rather than memory.

Write only what the skill writes on PASS or FAIL (its report and, on FAIL, the status marker change). Never edit `PRD/sections/`, workflow files, code, `GRAPH-RUN.md`, or the README `## Preparation gate` section — the driver owns the last two. Mechanics: Write and Edit tools for files; git as short separate calls from the working directory (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`.

Report back: verdict (`PASS` or `FAIL`), the complete findings list (or `none`), the files written, the commit sha and push result (if any), and `git status --porcelain` for the worktree.

### gate-qc (build half, attempt 1)

graph is controlling

You are node 4 (`gate-qc`), build half attempt 1, of graph run `graph-20261016-092729`. Invoke the `thejudge-quality-check` skill (read `.claude/skills/thejudge-quality-check/SKILL.md` in the working directory below) and follow its controlled mode. Tool-call cap 60 — spawn no subagents or forks, no sleeping or polling, stay well under the cap.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-ci-warnings-cleanup

Copy that Working directory line unchanged into any prompt you write. Work only inside that directory (branch `thejudge-auto/ci-warnings-cleanup-work`, cut from `origin/main` after the owner merged docs PR #315). Never write under /Users/chrismiho/Coding/Projects/TheJudge outside `.worktrees/implement-ci-warnings-cleanup`.

Package: `PRD/work/ci-warnings-cleanup/`. This is the build-half re-grade. There is no `GATE-QUESTIONS.md` (no product-truth change), so the brief is unchanged since the spec-forming PASS; what may have moved is the code under it. Re-grade `DESIGN-BRIEF.md` against PRD alignment and agent-readiness per the skill, and confirm against the current checkout that every file, line, workflow job, `uses:` pin, `runs-on` value, and lint warning the brief names still exists as described (run the frontend lint in the worktree, installing `node_modules` there first if absent, and compare the warning list with the brief). Confirm the brief still claims no `PRD/sections/` change and that nothing in `PRD/sections/` contradicts that.

Write only what the skill writes on PASS or FAIL (its report and, on FAIL, the status marker change). Never edit `PRD/sections/`, workflow files, code, `GRAPH-RUN.md`, or the README `## Preparation gate` section — the driver owns the last two. Mechanics: Write and Edit tools for files; git as short separate calls from the working directory (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`.

Report back: verdict (`PASS` or `FAIL`), the complete findings list (or `none`), the local lint warning count and whether it matches the brief, the files written, the commit sha and push result (if any), and `git status --porcelain` for the worktree.

### plan

graph is controlling

You are node 5 (`plan`), attempt 1, of graph run `graph-20261016-092729`. Invoke the `thejudge-map-out` skill (read `.claude/skills/thejudge-map-out/SKILL.md` and its `reference.md` in the working directory below) and follow its controlled mode. Tool-call cap 120 — spawn no subagents or forks, no sleeping or polling, stay well under the cap.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-ci-warnings-cleanup

Copy that Working directory line unchanged into any prompt you write. Work only inside that directory (branch `thejudge-auto/ci-warnings-cleanup-work`). Never write under /Users/chrismiho/Coding/Projects/TheJudge outside `.worktrees/implement-ci-warnings-cleanup`.

Package: `PRD/work/ci-warnings-cleanup/`. The README `## Preparation gate` records `Quality-check: PASS` with no findings (verify it before writing anything; you cannot self-certify one). There is no `GATE-QUESTIONS.md`: no `PRD/sections/` truth changes. Slice `DESIGN-BRIEF.md` into lettered slice docs plus `GAMEPLAN.md` per the skill, and emit one `slice-<letter>.criteria.json` beside each slice doc with every criterion initialised `false` and an `evidence` block (command pattern, file paths, or `manual: true`), per the map-out reference. Every acceptance criterion must trace to the brief; add no scope the brief does not state, and keep the brief's offered follow-ups out of the slices. Set the status marker and the `PRD/work/STATUS.md` board row per the skill.

Mechanics: Write and Edit tools for files; git as short separate calls from the working directory (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`. Do not edit `GRAPH-RUN.md`, `PRD/sections/`, workflow files, or code.

Report back: outcome (`ok` or `failed`), the slices with a one-line summary each, the criteria count per slice (and how many are manual), the files written, the commit sha and push result, the status marker now present, and `git status --porcelain` for the worktree.

### plan (attempt 2)

graph is controlling

You are node 5 (`plan`), attempt 2, of graph run `graph-20261016-092729`. Use the `thejudge-map-out` skill (read `.claude/skills/thejudge-map-out/SKILL.md` and its `reference.md` in the working directory below) in its controlled mode. Tool-call cap 120 — spawn no subagents or forks, no sleeping or polling; this is a small correction and should take few calls.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-ci-warnings-cleanup

Copy that Working directory line unchanged into any prompt you write. Work only inside that directory (branch `thejudge-auto/ci-warnings-cleanup-work`). Never write under /Users/chrismiho/Coding/Projects/TheJudge outside `.worktrees/implement-ci-warnings-cleanup`.

Package: `PRD/work/ci-warnings-cleanup/`. Attempt 1 (commit `fbe4d000`) is good except one defect. Criterion A7 in `slice-a.criteria.json` and `slice-a-workflow-pins.md:24` is post-merge only: the `changes` and `deploy` jobs never run on a PR, so the `build` node cannot earn it before the owner merges, and `build` may report `ok` only when every criterion is `true`. Fix it this way: remove A7 from `slice-a.criteria.json` and from the slice doc's acceptance-criteria checklist, and record the same check, with its full wording from `DESIGN-BRIEF.md` acceptance criterion 5 (around line 240), as an owner-run post-merge reading in `GAMEPLAN.md` (a reading, not a gate — the shape `PRD/instructions/receipts/follow-ups-keep-their-rules-2026-10-12.md:104` shows) and as a pointer line in the slice doc. Keep the check itself intact — this moves where it lives, not what it checks. Leave every other criterion, slice B, the status marker, and the board row unchanged. Also confirm A6 (the PR run with zero annotations) is earnable inside `build`, since `build` opens the PR and CI runs on it; leave it as is if so.

Mechanics: Write and Edit tools for files; git as short separate calls from the working directory (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`. Do not edit `GRAPH-RUN.md`, `PRD/sections/`, workflow files, or code.

Report back: outcome (`ok` or `failed`), the criteria count per slice now (and how many are manual), where the post-merge reading now lives (file and line), the files changed, the commit sha and push result, and `git status --porcelain` for the worktree.

### build

graph is controlling

You are node 6 (`build`), attempt 1, of graph run `graph-20261016-092729`. Invoke the `thejudge-implement-all` skill (read `.claude/skills/thejudge-implement-all/SKILL.md` and its `reference.md` in the working directory below) and follow its controlled mode. Tool-call cap 4000. Spawn no subagents or forks — implement the slices yourself, sequentially, in this one worktree.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-ci-warnings-cleanup

Copy that Working directory line unchanged into any prompt you write. Work in place in that worktree — no second worktree, no contributor branch. Shared branch: `thejudge-auto/ci-warnings-cleanup-work` (already checked out there; the code PR is `thejudge-auto/ci-warnings-cleanup-work` into `main`). Every path you write must lie inside `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-ci-warnings-cleanup/`; never write to the launch checkout at /Users/chrismiho/Coding/Projects/TheJudge.

Package: `PRD/work/ci-warnings-cleanup/` — `GAMEPLAN.md`, `slice-a-workflow-pins.md` + `slice-a.criteria.json` (6), `slice-b-lint-fixes.md` + `slice-b.criteria.json` (10), `DESIGN-BRIEF.md`. No `GATE-QUESTIONS.md`: no `PRD/sections/` truth changes, so write none. Implement every slice to its acceptance criteria. Lint fixes must not change app behavior: the fast-refresh splits move non-component exports into sibling modules and update imports only; the `ConversationThread.tsx` fix keeps scroll-to-latest identical, as the brief explains. Leave the brief's offered follow-ups (making lint warnings fail CI, the Ubuntu 26.04 move, Dependabot) out.

Open the code PR into `main` per the skill. The PR body opens with the plain-language block from `PRD/instructions/plain-language-standard.md` and ends with these two lines exactly:

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01MyoXR52i9TAid8cFQd7vZ3

End every commit message with these two lines exactly:

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MyoXR52i9TAid8cFQd7vZ3

Criterion A6 reads the PR's own Quality Check run. After the PR is open and your last push is made, you may wait on it with one blocking `gh pr checks <number> --watch` call (Bash timeout up to 600000 ms, repeat at most twice if still running); then read each job's annotations with `gh api repos/ChrisMiho/TheJudge/check-runs/<job-id>/annotations`. Record the observation as a dated line naming A6. If any annotation remains, fix it and re-check rather than marking A6 true.

Flip a criterion to `true` only on evidence you actually produced; a criterion you cannot meet stays `false` and you report `failed` with the reason. Set `STATUS.ship-ready` only when every criterion in both files is `true`, per the skill.

Mechanics: change files with the Write and Edit tools. Run git as short separate calls (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A`, `--all`, or `.`. No `nohup`, no background `&`, no `git stash`, no `git reset --hard`, no `git clean`. Do not edit `GRAPH-RUN.md`, any `thejudge-*` skill, `.claude/settings*.json`, or `CLAUDE.md`. Stop any dev server or preview you start, and call `browser_close` if you use a browser.

Report back: outcome (`ok` or `failed`), the PR URL, each commit sha with its slice, every path you wrote (absolute or worktree-relative, one per line), the criteria tally per slice, the test, lint, typecheck, and `npm run quality:check` results you ran, the A6 annotation reading, the status marker now present, and `git status --porcelain` for the worktree.

### review

graph is controlling

You are node 7 (`review`), attempt 1, of graph run `graph-20261016-092729`: a fresh-context, no-write reviewer. You have read and search tools only — no Write, Edit, or NotebookEdit — and you must not change any file, commit, push, or comment on the PR. Tool-call cap 120. Spawn no subagents.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-ci-warnings-cleanup

Copy that Working directory line unchanged into any prompt you write. Work only inside that directory (branch `thejudge-auto/ci-warnings-cleanup-work`, PR https://github.com/ChrisMiho/TheJudge/pull/316 into `main`).

Inputs: the diff `git diff origin/main...HEAD` in that worktree; the slice docs `PRD/work/ci-warnings-cleanup/slice-a-workflow-pins.md` and `slice-b-lint-fixes.md` with their `.criteria.json` files; `GAMEPLAN.md` and `DESIGN-BRIEF.md`. You have not seen how the build was done, and should not ask.

Rubric — the slices' own acceptance criteria, quoted:

Slice A:
- A1. `.github/workflows/quality-check.yml` contains no `@v4` action reference.
- A2. The pins are exactly `actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-artifact@v7`, `actions/download-artifact@v8`, `aws-actions/configure-aws-credentials@v6`.
- A3. All six `runs-on` lines read `ubuntu-24.04`; no `ubuntu-latest` remains.
- A4. No other workflow line changes: the diff against `origin/main` touches only `uses:` and `runs-on:` lines.
- A5. The tests that read the workflow (`scripts/ci-workflow-parity.test.mjs`, `apps/frontend/src/lib/deploymentPipeline.test.ts`) pass with no edit.
- A6. The PR's Quality Check run: every job that runs (`static`, `backend`, three frontend shards, `coverage-merge`) succeeds and shows zero annotations, checked with `gh api repos/ChrisMiho/TheJudge/check-runs/<job-id>/annotations`. (PR run only.)

Slice B:
- B1. `npm run lint` on the work branch prints no problems (0 errors, 0 warnings).
- B2. Each of the nine fast-refresh files is split as listed in Requirement 1 and the new files exist.
- B3. Each `createContext` call appears exactly once in the codebase for the moved contexts (feedback seam, sheet close, brand tap, left-edge drawer, assistant seed); provider and hook share that one object.
- B4. `ConversationThread.tsx` keeps the layout effect's dependency list exactly `[messages.length]` and calls `scrollToLatestRef.current(...)` at all three former call sites.
- B5. The three unused `eslint-disable` comments are gone.
- B6. `npm run typecheck` passes.
- B7. `ConversationThread.test.tsx` and the provider-plus-hook tests (`seedContext.test.tsx`, `FeaturePortalMenu.test.tsx`, `FeedbackContextProvider.test.tsx`, `SheetShell.test.tsx`, `GameSetupPanel.test.tsx`) pass.
- B8. `npm run quality:check` passes locally.
- B9. No test assertion is edited: the diff of test files shows only import-path changes (reviewer reads the diff).
- B10. `eslint.config.mjs` is unchanged.

Also check the brief's behavior-preservation bar: the lint fixes change no app behavior (moved exports keep the same values; no export removed that a caller still needs — look closely at the `destinationRegistry` change, which removed aliases; scroll-to-latest is identical). Re-run lint, typecheck, the B7 tests, and the two A5 tests yourself. For A6, read the PR's latest Quality Check run on the current head (`gh pr checks 316`, then the annotations API per job); one blocking `gh pr checks 316 --watch` call (Bash timeout up to 600000 ms) is allowed if it is still running.

Severity rule: Critical or Important only for a gap that breaks a quoted criterion or changes app behavior. A preference, a style note, or an improvement outside the slices' stated requirements is never Critical or Important — rate it Minor. Do not manufacture findings.

Report back: verdict (`APPROVE` or `CHANGES REQUESTED`), each criterion A1-A6 and B1-B10 as met / not met with its evidence, every finding with severity and file:line, the commands you ran and their results, and confirm you wrote nothing (`git status --porcelain` empty).

### close

graph is controlling

You are node 8 (`close`), attempt 1, of graph run `graph-20261016-092729`. Invoke the `thejudge-cleanup` skill (read `.claude/skills/thejudge-cleanup/SKILL.md` and its `reference.md` in the working directory below) and follow its controlled mode, PR-ready path: you run on the code branch before the owner merges. Tool-call cap 120 — spawn no subagents or forks, no sleeping or polling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-ci-warnings-cleanup

Copy that Working directory line unchanged into any prompt you write. Work only inside that directory (branch `thejudge-auto/ci-warnings-cleanup-work`, code PR https://github.com/ChrisMiho/TheJudge/pull/316 into `main`, open). Never write under /Users/chrismiho/Coding/Projects/TheJudge outside `.worktrees/implement-ci-warnings-cleanup`.

Package: `PRD/work/ci-warnings-cleanup/` at `STATUS.ship-ready`; review approved 16/16 criteria. No `PRD/sections/` truth changed (no `GATE-QUESTIONS.md`); confirm that and promote nothing. Write the receipt under `PRD/instructions/receipts/` per the skill, opening with the plain-language block from `PRD/instructions/plain-language-standard.md`. Fold `GRAPH-RUN.md`'s `## Node ledger` and `## Instruction ledger` verbatim into the receipt's `## Graph run` section, with a `- PR:` line and the summary line `Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/316`. Name both run ids: spec-forming half `graph-20261016-061526` (docs PR #315), build half `graph-20261016-092729`. Write the `## Intake` section for `intake/ci-warnings-capture.md`. Carry into the receipt, as owner follow-ups, the `GAMEPLAN.md` `## Post-merge reading` (the `main` run's `changes` and `deploy` jobs with zero annotations, and one live answer with the embedder loaded — no lexical-fallback WARN in CloudWatch) and the brief's three offered follow-ups (make lint warnings fail CI, the Ubuntu 26.04 move, Dependabot), plus the reviewer's one Minor note. Remove the board row from `PRD/work/STATUS.md` and delete the package with `git rm -r PRD/work/ci-warnings-cleanup`.

Mechanics: Write and Edit tools for files; git as short separate calls from the working directory (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`. Do not merge or close the PR. End the commit message with these two lines exactly:

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MyoXR52i9TAid8cFQd7vZ3

Report back: outcome (`ok` or `failed`), the receipt path, confirmation that no `PRD/sections/` change was needed, the board change, the number of tracked paths removed, the commit sha and push result, the PR state, and `git status --porcelain` for the worktree.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| owner launch request (verbatim in IDEA.md): on the most recent GitHub Actions workflow there are 17 warnings about ubuntu and other aspects of the code, can we address these | answered-once | shape | — |
