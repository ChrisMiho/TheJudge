# graph-shipping-mode-phase1

## Problem
The graph-run backbone can't work through several ideas in one sitting. Two
things block it: (1) `graph-preflight`'s base→main guard refuses **any** fresh
run while **any** `thejudge-auto/*` → main PR is open, even when the new target
shares no files with it — so the first parked package freezes the rest of a
night (this is what stalled the overnight-codehealth loop after one target);
and (2) run one **always** parks at `owner-action` even when the define gate is
empty, forcing a second manual kickoff for ideas that have nothing for the
owner to decide.

## Outcome
Two behaviour-preserving changes to the graph backbone:
1. **Overlap-scoped base→main guard.** A fresh run is blocked only when the new
   package's declared target files intersect an open `thejudge-auto/*` PR's
   changed files (`gh pr list --json files`). Keep the fail-closed default when
   overlap can't be determined; the resume path (`--take-lock`) stays exempt as
   today.
2. **Auto-bridge on an empty gate.** When `define` produces no `PRD/sections/`
   diff (no `GATE-QUESTIONS.md`), run one continues into run two automatically
   — spec → implementation in one kickoff. An idea WITH open questions still
   parks at `owner-action` exactly as now. The final merge (`land`) is never
   automated: it stays the owner's approval.

Together these unblock the overnight-codehealth loop and deliver the
single-idea auto-flow path (spec → implementation → owner merges).

## Non-goals
- No concurrency yet: still one run at a time (one lock, shared checkout). True
  parallel spec-forming via one base branch + a worktree per run, plus an
  approval-watcher that fires part 2, is **Phase 2** ([[graph-shipping-mode-phase2]]).
- No "ship multiple specs together" grouping — each idea stays its own package
  and PR.
- `land` stays a human merge; no auto-merge, ever.
- Product/app truth (`PRD/sections/`) is untouched — this is an agent-workflow
  change to `PRD/instructions/graph-workflow-contract.md`, the graph skills, and
  `scripts/graph-preflight.mjs` (+ its tests).

## Why now
Surfaced live on 2026-09-01: the overnight-codehealth loop parked its first
target (dormant `isCardBack()` removal, PR #157) and then every subsequent fresh
run hit the unconditional base→main guard, ending the night after one package.
The guard is armed and correct for dependent work; it just overcorrects for
independent targets.
