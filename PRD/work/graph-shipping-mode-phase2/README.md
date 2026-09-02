status: active

# graph-shipping-mode-phase2

Two decoupled tools joined by main: **`graph-kickoff`** (parallel spec-former —
each idea its own worktree-rooted session, opens a proposal PR) and
**`graph-implement`** (single background build loop — watches main, picks up
approved-but-unbuilt specs, ships each as its own code PR). Approval is
answer-then-merge; a parked build parks one and the loop continues. Isolation is
per-worktree-session (no boundary-hook change). Subagent fan-out is a knob, off by
default, cost logged. Phase 1 (`graph-shipping-mode-phase1`) is **merged** (PR
#158).

See `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (the product-truth proposal), and
`GAMEPLAN.md`.

## Slice table

| Slice | Objective | Applies | Depends on | Status |
| --- | --- | --- | --- | --- |
| [A](slice-a-split-and-rename.md) | Split `graph-run` → `graph-kickoff` + `graph-implement` + shared reference; retire `graph-run`; rewrite contract & predicate | REQ-160 | — | **done** |
| [B](slice-b-build-loop.md) | `graph-implement` becomes the background build loop | REQ-171 | A | **done** |
| [C](slice-c-loop-safety.md) | Loop safety: kill switch, per-build liveness, bounds, fan-out knob | REQ-172, REQ-154, REQ-159 | B | **done** |
| [D](slice-d-worktree-isolation.md) | Per-worktree kickoff isolation; no hook change | REQ-170 | A | **done** |
| [E](slice-e-downstream-and-close.md) | Downstream (`overnight-codehealth`, docs, `AGENT-SKILLS.md`), fixtures, final verification | — | A,B,C,D | planned |

## Implementation map

- **Skills:** new `graph-kickoff`, `graph-implement`; retire `graph-run`; shared
  `graph` reference; `graph-preflight`/`graph-gate-review` renamed refs only.
- **Contract:** `PRD/instructions/graph-workflow-contract.md` (authority) rewritten
  to the two named tools + predicate rename.
- **Scripts:** `graph-preflight.mjs` per-idea worktree (Slice D); boundary hook
  **unchanged**.
- **Product truth (by intent, per slice):** REQ-170/171/172 new; REQ-154/159/160
  edited. No new `DEC-###`/`FLOW-###`.
- **Downstream:** `overnight-codehealth`, `OPERATOR.md`, `PRD/README.md`,
  `AGENT-SKILLS.md`, fixtures.

## Gate note

The `GATE-QUESTIONS.md` verdict slots are the owner's product-truth gate. The
substantive decisions were made with the owner in refinement; **the PR review is
the gate on the exact REQ diffs.**
