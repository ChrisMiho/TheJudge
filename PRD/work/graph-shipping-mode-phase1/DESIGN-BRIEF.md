# Design brief — graph-shipping-mode-phase1 (propose / apply / close)

Status: draft for owner review (shape approved 2026-09-01; brief awaiting sign-off).

## Summary
Rework where durable writes happen in the `thejudge-*` lifecycle so that
spec-forming only *documents* a proposed change (inside the work folder) and
implementation *applies* it (durable `PRD/sections/` truth **and** code, together).
This is the foundation that makes decoupled, parallel, loop-driven shipping
possible; it is correct and worth doing even single-threaded.

Agent-workflow change only. No product/app truth (`PRD/sections/`) changes as a
result of this package.

## Motivation
The old manual flow had refinement mutate `PRD/sections/` up front; automation
carried that forward. That single choice causes: (a) parallel spec-formers touch
shared section files and collide; (b) product truth enters main before the code
that backs it; (c) the base→main guard has to block concurrency because every
package holds an open truth-bearing PR. Moving the writing removes all three at
the root.

## The change — division of labour

| Phase | Skill | New responsibility |
| --- | --- | --- |
| Propose | `thejudge-refinement` | Writes ONLY inside `PRD/work/<slug>/`: `DESIGN-BRIEF.md`, the proposed `PRD/sections/` changes as markdown/diff, `GATE-QUESTIONS.md`. Never mutates durable `PRD/sections/` or code. |
| Apply | `thejudge-implement-all` (+ slices) | Applies the approved proposal: writes the real `PRD/sections/` edits **and** the code, together, in one PR. Applies **by intent** against current truth, not by replaying a frozen diff. |
| Close | `thejudge-cleanup` | Promotion happens once, at apply/close; then deletes the work folder. Reconcile any double-promotion. |

Consequent adjustments:
- **Gate reads the proposal.** `graph-run`'s post-`define` diff check and
  `graph-gate-review` operate on the work-folder proposal, not a live `PRD/sections/`
  diff. Empty proposal = no gate.
- **Guard/auto-bridge retire.** The base→main guard and the run-one→run-two
  auto-bridge become mostly unnecessary; shrink or remove with tests, don't extend.

## Principles this must honour (carry graph-run's discipline forward)
1. **Enforce in code, not prompts.** The committed PreToolUse hook / scripts are
   the enforcers; instructions are intent only. "A guardrail that depends on an
   agent remembering is not a guardrail."
2. **Idempotent, resumable off durable state.** Never apply the same proposal
   twice; "approved" and "already applied" are facts checkable from the repo, not
   held in an agent's head.
3. **Park, don't guess; few explicit human touchpoints.** Two only — approve a
   spec that has open questions, and merge the code. Never pre-authorise past
   either.
4. **Isolate state; one writer per thing.** Each former writes only its own work
   folder; worktree-per-run for isolation.
5. **Bound every loop; provide a kill switch and fail-closed liveness.**
6. **Test decision logic as pure functions** (ready-detection, apply-by-intent),
   like `graph-preflight`'s classifiers.

## Subagents / cost (owner preference, 2026-09-01)
- Subagent / parallel fan-out is a **knob, off by default**.
- Per-run subagent token cost is written to the ledger so cost is a glance, not a
  guess. Baseline from one real run this session: the spec-forming half
  (audit + preflight + shape + define + gate-qc) ≈ 340k tokens across five
  subagents (heaviest gate-qc ≈ 95k); the implementation half is heavier (build is
  the large node) — budget ~2–3× for a full spec-to-ship run.

## Non-goals
- No concurrency, background loop, or approval-watcher — that is
  [[graph-shipping-mode-phase2]].
- `land` (merge to main) stays a human merge; no auto-merge to main.
- No `PRD/sections/` product-truth changes from this package.

## Open design details to settle in map-out
- Exact on-disk form of the "proposed changes" artifact (unified diff vs. proposed
  section bodies) and how apply-by-intent consumes it robustly when main has moved.
- Whether the manual and graph modes share one code path for propose/apply or
  differ only at the orchestration edge.
- Concrete retirement plan + tests for the base→main guard and auto-bridge.

## Verification approach
- Pure-function unit tests for any new classifier.
- Skill fixtures for the reworked `refinement` / `implement` / `cleanup` behaviour.
- A dry end-to-end: one behaviour-preserving target flows propose → approve →
  apply, and main is byte-consistent (truth + code) at every merge boundary.
