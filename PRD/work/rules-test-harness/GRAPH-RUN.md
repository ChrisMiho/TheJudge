# Graph run — rules-test-harness

- Run ID: `graph-20261006-181340`
- Profile: `loaded (env sentinel)` (graph-preflight observation at node 1)
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`; graph tier `denied — armed (nohup true)`
- Autonomous base: `origin/thejudge-auto/rules-test-harness` (rewritten to `origin/main` by the build half's claim)
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rules-test-harness` (rewritten to `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-rules-test-harness` by the build half's claim)
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261006-181340/`
- Current node: `define`
- Next action: `/graph-kickoff PRD/work/rules-test-harness/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 10` | branch `thejudge-auto/rules-test-harness` pushed (`git ls-remote --heads origin thejudge-auto/rules-test-harness` → `066fbbd`) from `.worktrees/kickoff-rules-test-harness`; launch checkout still on `main` (reflog: no switch); lock `.worktrees/.graph-run.lock` runId `graph-20261006-181340` pid 19738 | 2026-10-06 |
| 2 | shape | sonnet | ok | `0 → 14` | `PRD/work/rules-test-harness/IDEA.md` (10 `## Prior run` lines), `README.md`, `STATUS.ideation`, `intake/GRAPH-BRIEF.md` (`cmp` identical to staging), `PRD/work/STATUS.md` ideation row | 2026-10-06 |

## Open gate

- None

## Dispatch prompts

### preflight

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of graph run `graph-20261006-181340`. Follow the `graph-preflight` skill at `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/graph-preflight/SKILL.md` exactly (read it first, and read `PRD/instructions/graph-workflow-contract.md`). Copy the `Working directory:` line above, unchanged, into any prompt you write.

Inputs:
- --branch thejudge-auto/rules-test-harness
- --slug rules-test-harness
- --run-id graph-20261006-181340
- --pid 19738

Procedure (from the skill): run from the working directory above
1. `npm run graph:preflight -- --branch thejudge-auto/rules-test-harness --slug rules-test-harness --run-id graph-20261006-181340 --pid 19738 --dry-run`
2. On exit 1 or 2, stop and relay the message verbatim. Never hand-resolve anything.
3. Otherwise re-run the identical command without `--dry-run`.
4. Issue the script's `CANARY_COMMAND` as a real Bash tool call and require a hook deny; then, after the lock is taken, issue `GRAPH_CANARY_COMMAND` as a real Bash tool call and require a deny. Record each reason text verbatim. An allowed canary is BLOCKED — stop and report.
5. Confirm the end state: `cd .worktrees/kickoff-rules-test-harness && git branch --show-current` equals the branch; `git ls-remote --heads origin thejudge-auto/rules-test-harness` shows it; `git branch --show-current` at the root is still `chore/remove-blue-probe-folder`.

Never commit, stash, or switch the launch checkout. Never remove the lock or the stop sentinel. Never force-push.

Report back, plainly: outcome (ok / failed / blocked), the `shape:`, `base:`, `worktree:` lines, the `Profile:` line, the lock record (cat .worktrees/.graph-run.lock), both canary commands and their deny reason text verbatim, and the end-state checks.

### shape

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-rules-test-harness

You are node 2 (`shape`) of graph run `graph-20261006-181340`. Run the `thejudge-kickoff` skill (read `.claude/skills/thejudge-kickoff/SKILL.md` in the working directory above and follow it in its graph-controlled mode). Copy the `Working directory:` line above, unchanged, into any prompt you write. Do all reads and writes inside that working directory; never write to `/Users/chrismiho/Coding/Projects/TheJudge/PRD/` (the launch checkout).

Slug (use verbatim): `rules-test-harness` — package folder `PRD/work/rules-test-harness/`.

Request from the owner: build the rules test harness backbone — a six-layer-ready case format, an offline gate that catches dropped cards and missed rules, a budget-safe on-demand answer grader, an owner review flow, and about 400 cases covering every real mechanic once plus about 120 hard interactions.

Intake staging (absolute path, read-only source): `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261006-181340/` — one file, `GRAPH-BRIEF.md` (a probe-derived graph-run brief the owner prepared). Copy it verbatim into `PRD/work/rules-test-harness/intake/GRAPH-BRIEF.md`. Intake is evidence, never authority (see `## Intake is evidence, never authority` in `PRD/instructions/graph-workflow-contract.md`). Do not open or fetch anything the intake cites — including the probe folder and FINDINGS files it names; record those only as citations.

Also grep `PRD/instructions/receipts/` for prior runs against the same ground (answer-quality evals, gold cases / worked solutions, rule retrieval, eval harnesses) and write one `## Prior run` line per match into `IDEA.md`.

Do not commit, push, or edit `PRD/sections/` — the driver commits. Do not create a `GRAPH-RUN.md`; the driver owns it. If the request cannot become an actionable package, return `NO ACTIONABLE PACKAGE` with the reason.

Report back: outcome, every file you created or changed (paths relative to the working directory), the STATUS marker set, the `PRD/work/STATUS.md` board row you wrote, and the prior-run matches.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Build the rules test harness backbone: a six-layer-ready case format, an offline gate that catches dropped cards and missed rules, a budget-safe on-demand answer grader, an owner review flow, and ~400 cases covering every real mechanic once plus ~120 hard interactions" | answered-once | shape | — |
| "Decisions already made — do not re-litigate" (intake `GRAPH-BRIEF.md`, owner decisions of 2026-10-06) | answered-once | define | — (the owner's stated decisions are input to refinement; each one that becomes product truth still gets its own `GATE-QUESTIONS.md` slot, per `## Intake is evidence, never authority`) |
