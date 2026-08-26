# Graph run — quick-lookup-spec

- Run ID: `graph-20260826-174916`
- Profile: `unverified`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`
- Graph canary: `denied — graph tier armed (nohup true)`
- Autonomous base: `origin/thejudge-auto/quick-lookup-spec`
- Staging: `.worktrees/.graph-intake/graph-20260826-174916/`
- Current node: `define`
- Next action: `/graph-run PRD/work/quick-lookup-spec/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 5` | branch `thejudge-auto/quick-lookup-spec` created from `main` and pushed; classification `clean` (no stash); lock `held` pid 59134; both canaries denied | 2026-08-26 |
| 2 | shape | sonnet | ok | `0 → 34` | package `PRD/work/quick-lookup-spec/` created (`IDEA.md`, `README.md` with backing sources, `STATUS.ideation`); board row added under `## ideation` | 2026-08-26 |

## Open gate

- None

## Dispatch prompts

### preflight

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of an autonomous graph run. Invoke the `graph-preflight` skill and follow it exactly. Copy the `Working directory:` line above, unchanged, into every prompt you write to any sub-step.

Run parameters:
- Branch to create and push: `thejudge-auto/quick-lookup-spec`
- Run ID: `graph-20260826-174916`
- Base: current branch (`main`)

Do this:
1. Read `PRD/instructions/graph-workflow-contract.md` as the skill instructs, then invoke `graph-preflight`.
2. Take the concurrency lock via the script (do not hand-write it).
3. Run the dry-run: `npm run graph:preflight -- --branch thejudge-auto/quick-lookup-spec --run-id graph-20260826-174916 --dry-run`. Report the classification, the resolved base, the planned commands, and both the `profile sentinel:` / `Profile:` lines verbatim.
4. If the action is `blocked`, stop and report the offending paths — do not hand-resolve.
5. Otherwise run the identical command without `--dry-run`, same `--run-id`.
6. Issue the liveness canary as a real Bash tool call and require the hook to DENY it. Then issue the graph canary (`GRAPH_CANARY_COMMAND`) after the lock is held and require a DENY. Report `classifyCanary()` and `classifyGraphCanary()` ledger lines verbatim. An allowed canary is BLOCKED — report it and stop.
7. Confirm end state: `git status --porcelain` empty, `git branch --show-current` is `thejudge-auto/quick-lookup-spec`.

Do NOT create any package folder, worktree, or write to PRD/. That is node 2's job. Do not remove the stop sentinel. Do not drop/pop/reorder any stash.

Report back, verbatim where the skill says verbatim:
- The `Profile:` line (sentinel present or unverified)
- The `Canary:` ledger line and the graph-canary ledger line
- The classification (clean / commit / stash), and if a stash was taken, the exact `git stash list | grep graph-preflight/graph-20260826-174916` and `git stash apply <ref>` restore lines
- The resolved autonomous base (`origin/thejudge-auto/quick-lookup-spec`)
- Confirmation the branch was pushed and the tree is clean
- The lock state the script reported (free/held/stale/corrupt)

### shape

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 2 (`shape`) of an autonomous graph run. Invoke the `thejudge-kickoff` skill and follow it exactly in graph mode. Copy the `Working directory:` line above, unchanged, into every prompt you write to any sub-step.

Run parameters:
- Slug (use exactly this — do not re-derive): `quick-lookup-spec`
- Run ID: `graph-20260826-174916`
- Branch already created and pushed by node 1: `thejudge-auto/quick-lookup-spec`

The request (the idea to capture, verbatim):
"Write the current-state feature spec for the quick-lookup feature — Phase A #5 of the docs-refactor gameplan. Land it at PRD/sections/quick-lookup/README.md on the DEC-168 template. It runs the full backend path — prompt assembly, retrieval, and the provider boundary — so capture that flow, not just the UI. Keep it draft and non-authoritative."

Do this:
1. Read root `README.md` and `PRD/README.md` for onboarding context as the skill instructs.
2. Create the work package `PRD/work/quick-lookup-spec/` with `IDEA.md` capturing the request above, and set `STATUS.ideation`.
3. This is Phase A #5 of the docs-refactor gameplan (`PRD/work/adhoc/refactor-gameplan.md`). The idea is a **current-state feature-spec** for the quick-lookup feature, written on the DEC-168 template, landing at `PRD/sections/quick-lookup/README.md`. It is draft and non-authoritative — `sections/decisions.md` stays precedence #1. Note in IDEA.md that this is a documentation/consolidation task, not a code change.
4. If the request cannot be turned into an actionable package, return `NO ACTIONABLE PACKAGE` with the reason.

Do NOT run refinement, do NOT write to `PRD/sections/`, do NOT create a worktree. Only shape the package. Do not touch the concurrency lock or the stop sentinel. Do not copy the intake yourself — the driver handles intake staging.

Report back:
- The package path created and the `STATUS.*` marker set
- A one-line summary of what IDEA.md captured
- Confirmation you did not write outside `PRD/work/quick-lookup-spec/`
- Whether the outcome is a normal package or `NO ACTIONABLE PACKAGE`

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| Write the current-state feature spec for the quick-lookup feature — Phase A #5 of the docs-refactor gameplan. Land it at PRD/sections/quick-lookup/README.md on the DEC-168 template. It runs the full backend path — prompt assembly, retrieval, and the provider boundary — so capture that flow, not just the UI. Keep it draft and non-authoritative. | answered-once | shape | — |
