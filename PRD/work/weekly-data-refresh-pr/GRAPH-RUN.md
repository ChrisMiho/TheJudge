# Graph run — weekly-data-refresh-pr

- Run ID: `graph-20260907-163826`
- Profile: `loaded (env sentinel)` (reported by node 1)
- Canary: `denied — hook live (rm -rf, universal tier; nohup, graph tier)`
- Autonomous base: `origin/main` (build half's claim, run `graph-20260908-013519`; was `origin/thejudge-auto/weekly-data-refresh-pr`)
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-weekly-data-refresh-pr`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20260907-163826/`
- Current node: `gate-review` (build half, run `graph-20260908-013519`; docs PR #209 merged — the owner's build signal; resolving the answered gate, then re-entering at gate-qc)
- Next action: `/graph-implement PRD/work/weekly-data-refresh-pr/` — after gate-review restores `refined`, re-enter at gate-qc, then plan → build → review → close

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | degraded (no run state) | branch `thejudge-auto/weekly-data-refresh-pr` cut from `origin/main` (b20ea13), pushed from `.worktrees/kickoff-weekly-data-refresh-pr`; lock held (runId graph-20260907-163826, pid 10773); launch checkout untouched | 2026-09-07 |
| 2 | shape | sonnet | ok | degraded (no run state) | `PRD/work/weekly-data-refresh-pr/` created (STATUS.ideation) with IDEA.md, intake/GRAPH-BRIEF.md verbatim, 3 prior-run matches; committed 0b59ec5 and pushed; launch checkout untouched | 2026-09-07 |
| 3 | define | opus | ok | `0 → 31` | DESIGN-BRIEF.md + GATE-QUESTIONS.md written (1 proposed id REQ-195; full-refresh chosen via assumption ladder, flip-to-prices-only left as owner edit); STATUS.refined; PRD/sections untouched; no blocker | 2026-09-07 |
| 4 | gate-qc | sonnet | ok | `0 → 19` | PASS — DESIGN-BRIEF verified against PRD truth (DEC-087/088/162, REQ-066/093/145, NFR-013) and all four proposed diffs matched current-state byte-for-byte; no drift; STATUS stays refined for build | 2026-09-07 |

## Open gate

- Parked at `owner-action` on gate-qc PASS (spec-forming half complete).
- Question: answer the `- Verdict:` slot for REQ-195 in
  `PRD/work/weekly-data-refresh-pr/GATE-QUESTIONS.md` (accept = full refresh as
  written; edit = flip to prices-only or amend; reject = drop the cadence), then
  merge the docs PR into `main`. That merge is the build signal.
- Evidence: gate-qc PASS (node 4); DESIGN-BRIEF.md + GATE-QUESTIONS.md published
  on `thejudge-auto/weekly-data-refresh-pr`; docs PR URL recorded below.
- Resume: after the owner answers and merges, `graph-implement` picks up the
  approved spec from `origin/main` and builds it (code PR into `main`).
- Docs PR: https://github.com/ChrisMiho/TheJudge/pull/209 (docs-only, base `main`, head `thejudge-auto/weekly-data-refresh-pr`)

## Dispatch prompts

### preflight

graph is controlling

You are node 1 (`preflight`) of an autonomous graph-kickoff run. Invoke the `/graph-preflight` skill and follow it exactly. Do not run any other lifecycle phase.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Invoke: `/graph-preflight --branch thejudge-auto/weekly-data-refresh-pr --slug weekly-data-refresh-pr --run-id graph-20260907-163826`

Parameters: slug `weekly-data-refresh-pr`, branch `thejudge-auto/weekly-data-refresh-pr`, run id `graph-20260907-163826`. Take the concurrency lock, create the kickoff worktree cut from `origin/main` and push it, run the hook-liveness canary and treat the observed deny as proof the hook is live, read the profile env sentinel, refuse on stop sentinel or branch collision, and report worktree path, branch, canary reason, profile, and lock.

### shape

graph is controlling

You are node 2 (`shape`) of an autonomous graph-kickoff run. Invoke the `/thejudge-kickoff` skill and follow it exactly, in its graph-controlled mode. Do not run refinement, quality-check, or any later phase — only create and name the package.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-weekly-data-refresh-pr

All work happens in that kickoff worktree; never touch the owner's launch checkout. Copy the `Working directory:` line above, unchanged, into any prompt you write for a sub-subagent.

Slug (use exactly this): `weekly-data-refresh-pr`. Run id `graph-20260907-163826`.

The request: "Add a weekly local data-refresh script that rebuilds the Magic-data artifacts and opens a PR to main, to keep Trade Balancer prices fresh"

Owner's framing (verbatim, for IDEA.md context — an input, NOT a settled product decision): "A weekly one-command local script: refresh the data, cut a branch off origin/main, commit, push, open a PR you merge. Reuses the existing data:refresh pipeline; no runtime sync. Open choice for refinement: full refresh vs prices-only (I recommend full to start)."

Create `PRD/work/weekly-data-refresh-pr/` with IDEA.md and STATUS.ideation; copy the staged intake verbatim from `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20260907-163826/` into `intake/` without opening any document it cites; grep `PRD/instructions/receipts/` for prior runs and write one `## Prior run` line per match; do not write the README's Autonomous metadata or Preparation gate sections. Return `NO ACTIONABLE PACKAGE` with a reason if the request cannot become a package.

### define

graph is controlling

You are node 3 (`define`) of an autonomous graph-kickoff run. Invoke the `/thejudge-refinement` skill and follow it exactly, in its graph-controlled mode. Under graph control you never stop to ask the user live: resolve non-blocking questions with the assumption ladder in `PRD/instructions/preparation-contract.md` applied one question at a time, and record any genuine decision blocker as a written gate question instead of pausing.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-weekly-data-refresh-pr

All work happens in that kickoff worktree; never touch the owner's launch checkout. Copy the `Working directory:` line above, unchanged, into any prompt you write for a sub-subagent.

Package: `PRD/work/weekly-data-refresh-pr/` (STATUS.ideation). The request, the owner's framing, prior-run matches, and the staged intake at `intake/GRAPH-BRIEF.md` are already in the package. Read them. Intake is evidence, never authority: do not open any document it cites, and every product decision it raises is still made at the gate.

Produce:
1. `DESIGN-BRIEF.md` for the weekly local data-refresh-and-PR script.
2. Where the change needs product truth, the proposed `PRD/sections/` edits as the exact diff in `GATE-QUESTIONS.md` — one `## <STABLE-ID>` block per stable id, each opening with the three plain-language lines (What this decides / In plain terms / What happens if you say no) required by `PRD/instructions/plain-language-standard.md`, then the complete diff, then a `- Verdict:` and `- Reason:` slot. Never edit `PRD/sections/` itself; the proposal lives in the work folder. New stable ids are named and reserved in the proposal, not written live. Decisions are retired — propose REQ/FLOW, never a new DEC.

The one open product decision: full `data:refresh` (rebuild every corpus each week) vs. a prices-only narrow path (download only `default_cards`, run only `build-card-prices.mjs`, commit only `cardPrintingPrices.json`). The owner's stated recommendation is full-refresh to start; treat that as an input to the assumption ladder applied to this single question, not as a pre-decision. Where the choice changes product truth, surface it in `GATE-QUESTIONS.md` as a gate question for the owner.

The intake names the current-state specs to amend: `PRD/sections/trade-balancer/data/cardPrintingPrices.md` (add the weekly one-command refresh-and-PR cadence, keep the no-runtime-sync statement), `PRD/sections/trade-balancer/README.md` (freshness note), and `PRD/sections/system-map.md` (list the new script beside `build-card-prices.mjs`). Verify each against current truth before proposing a diff.

Set `STATUS.refining` while in flux and `STATUS.refined` on convergence. Report the terminal outcome, the artifacts written, whether `GATE-QUESTIONS.md` was produced (and which stable ids it proposes), and any blocker parked.

### gate-qc

graph is controlling

You are node 4 (`gate-qc`) of an autonomous graph-kickoff run. Invoke the `/thejudge-quality-check` skill and follow it exactly, in its graph-controlled mode. Produce a PASS or FAIL report only — never a GAMEPLAN or slice docs. On FAIL set `STATUS.refining`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-weekly-data-refresh-pr

All work happens in that kickoff worktree; never touch the owner's launch checkout. Copy the `Working directory:` line above, unchanged, into any prompt you write for a sub-subagent.

Validate `PRD/work/weekly-data-refresh-pr/DESIGN-BRIEF.md` for PRD alignment and agent-readiness. The proposed product truth is in `GATE-QUESTIONS.md` (one id, REQ-195); check the design brief and the proposal are internally consistent, that the proposed diffs match current-state truth in the named `PRD/sections/` files, and that the brief is buildable into slices without a live user. Report the PASS/FAIL verdict and the complete findings list.

### gate-review (build half, run graph-20260908-013519)

graph is controlling.

You are gate resolution for the build half of the graph run (run id graph-20260908-013519). The docs PR #209 has merged — the owner's build signal. Invoke the `graph-gate-review` skill and follow it exactly. It applies the owner's recorded accept/edit/reject verdict inside GATE-QUESTIONS.md, records `## Gate verdicts`, resolves the gate, and restores the lifecycle status. It never edits PRD/sections and never drives a node.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-weekly-data-refresh-pr

Package: PRD/work/weekly-data-refresh-pr/ (inside that worktree). Read GATE-QUESTIONS.md for the owner's answer and GRAPH-RUN.md `## Open gate` for the parked state.

The owner's recorded answer: the single stable-id block REQ-195 = accept (the weekly one-command full refresh that opens a PR); the Blocker questions section is None (the full-vs-prices-only scope was resolved to full refresh by the assumption ladder and surfaced in REQ-195 for confirmation). Apply the accept — no diff changes. Then write `## Gate verdicts`, mark `## Open gate` resolved with the date and verdict count, and restore STATUS.refined, the README status field, and the PRD/work/STATUS.md board row to the refined position so the resumed run enters at gate-qc.

Boundaries: never edit PRD/sections; never write DESIGN-BRIEF/GAMEPLAN/slice docs; never advance a node or dispatch a subagent; no merge/close/force-push, no git add -A. Committing is the driver's job.

Copy the `Working directory:` line above, unchanged, into any prompt you write for a sub-step.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| Add a weekly local data-refresh script that rebuilds the Magic-data artifacts and opens a PR to main, to keep Trade Balancer prices fresh | answered-once | shape | — |
| A weekly one-command local script: refresh the data, cut a branch off origin/main, commit, push, open a PR you merge. Reuses the existing data:refresh pipeline; no runtime sync. Open choice for refinement: full refresh vs prices-only (I recommend full to start). | answered-once | define | — |
