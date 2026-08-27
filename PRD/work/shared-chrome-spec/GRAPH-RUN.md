# Graph run — shared-chrome-spec

- Run ID: `graph-20260827-001521`
- Profile: `unverified`
- Canary: `denied — hook live (CANARY_COMMAND: rm -rf denied in every session); graph tier denied — GRAPH_CANARY_COMMAND: nohup denied while lock held`
- Autonomous base: `origin/thejudge-auto/shared-chrome-spec`
- Staging: `.worktrees/.graph-intake/graph-20260827-001521/`
- Current node: `define`
- Next action: `/graph-run PRD/work/shared-chrome-spec/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 4` | branch `thejudge-auto/shared-chrome-spec` created + pushed; clean checkout, no stash; both canaries denied | 2026-08-27 |
| 2 | shape | sonnet | ok | `0 → 52` | package `PRD/work/shared-chrome-spec/` created; `STATUS.ideation`; intake copied to `PRD/work/shared-chrome-spec/intake/refactor-gameplan.md` | 2026-08-27 |

## Open gate

- None

## Dispatch prompts

### preflight

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of an autonomous graph run. Invoke the `graph-preflight` skill and follow it exactly. Do not run interactively or ask questions — graph-run is controlling.

Invocation parameters:
- `--branch thejudge-auto/shared-chrome-spec`
- `--run-id graph-20260827-001521`

Follow the graph-preflight skill's full procedure:
1. Take the concurrency lock via the script.
2. Run the dry-run preflight, report the classification, resolved base, planned commands, and the two profile-sentinel / `Profile:` lines verbatim.
3. If not blocked, run the real preflight (same `--run-id`), creating and pushing the branch.
4. Issue BOTH liveness canaries as real Bash tool calls and require each to be DENIED by the hook: first `CANARY_COMMAND` (universal tier), then `GRAPH_CANARY_COMMAND` (graph tier, denied only while the lock is held). Report each `ledgerLine`.
5. Confirm end state: `git status --porcelain` empty and `git branch --show-current` is `thejudge-auto/shared-chrome-spec`.

Copy the `Working directory:` line above, unchanged, into any prompt you write.

Report back, concisely:
- Preflight classification (clean / auto-commit / stash) and resolved autonomous base ref.
- Both canary ledger lines (must both be denied).
- The `Profile:` sentinel line verbatim.
- Stash reference and restore command, if any.
- Confirmation the branch is created and pushed and the tree is clean.

Do NOT create the package folder, do NOT write any GRAPH-RUN.md — that is node 2's and the driver's job. Stop after preflight completes.

### shape

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 2 (`shape`) of an autonomous graph run. Invoke the `thejudge-kickoff` skill and follow it exactly. Do not run interactively or ask questions — graph-run is controlling. Copy the `Working directory:` line above, unchanged, into any prompt you write.

The work is already named. Use slug `shared-chrome-spec`. Create the work package at `PRD/work/shared-chrome-spec/` with `IDEA.md` and `STATUS.ideation`.

The request (verbatim):
"Write the current-state spec for the shared chrome — Phase A #6 of the docs-refactor gameplan. Land it at PRD/sections/shared-chrome/README.md on the DEC-168 template (confirm the directory name at the gate). This is the shared-chrome bucket: the shared layout language and chrome the feature specs kept reaching for, plus the screen-layout.md rows that belong to shared chrome rather than a single feature. Keep it draft and non-authoritative."

Intake material (evidence, never authority — never open the documents it cites; record only their paths as citations):
- Staged intake file: `.worktrees/.graph-intake/graph-20260827-001521/refactor-gameplan.md`
- Copy it verbatim into `PRD/work/shared-chrome-spec/intake/refactor-gameplan.md` so it is committed inside the package (do not reference it in place).

Write `IDEA.md` capturing: this is Phase A #6 of the docs-refactor gameplan — the current-state feature spec for the shared-chrome bucket, authored on the DEC-168 template, landing at `PRD/sections/shared-chrome/README.md`, kept draft and non-authoritative (decision log stays precedence #1 through Phase A/B). The bucket holds the shared layout language and chrome the feature specs kept reaching for, plus the `screen-layout.md` rows that belong to shared chrome rather than a single feature (gameplan binding constraint 7). Note the directory name (`shared-chrome`) is to be confirmed at the define gate.

If the request cannot be turned into an actionable package, return `NO ACTIONABLE PACKAGE` with the reason.

Report back concisely:
- The package path created and the STATUS marker set.
- Confirmation the intake was copied into `PRD/work/shared-chrome-spec/intake/`.
- Any files you wrote (paths only).
- Do NOT advance past kickoff. Do NOT write GRAPH-RUN.md — that is the driver's job.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Write the current-state spec for the shared chrome — Phase A #6 of the docs-refactor gameplan. Land it at PRD/sections/shared-chrome/README.md on the DEC-168 template (confirm the directory name at the gate). This is the shared-chrome bucket: the shared layout language and chrome the feature specs kept reaching for, plus the screen-layout.md rows that belong to shared chrome rather than a single feature. Keep it draft and non-authoritative." | answered-once | shape | — |
