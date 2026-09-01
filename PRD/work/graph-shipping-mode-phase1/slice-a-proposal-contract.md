# Slice A — Proposal contract + docs

## Status: done

## Goal
Encode the propose/apply/close division and the "GATE-QUESTIONS.md is the proposal"
signal in the process contracts, so refinement, implement, cleanup, and the gate
all read one authoritative description.

## Requirements
1. `PRD/instructions/graph-workflow-contract.md`: state that refinement writes the
   proposed `PRD/sections/` changes only into `GATE-QUESTIONS.md` and never mutates
   `PRD/sections/`; the gate signal is the presence of proposed changes in
   `GATE-QUESTIONS.md`, not a live `PRD/sections/` diff; `graph-gate-review`
   finalizes the proposal in place; implement applies durable truth + code by
   intent; cleanup promotes once.
2. `PRD/instructions/preparation-contract.md` and `workflow-reference.md`: reconcile
   any description of the old "refinement edits `PRD/sections/` in place" flow.
3. Do not change Phase-2 concerns: leave the base→main guard and the two-run split
   description intact except where they reference where writing happens.

## Acceptance criteria
- [ ] A1 `graph-workflow-contract.md` describes propose (work-folder only) / apply
  (durable truth + code) / close (promote once), and the GATE-QUESTIONS-as-gate-signal.
- [ ] A2 No instruction doc still says refinement writes/promotes `PRD/sections/`
  during define.
- [ ] A3 `npm run test:scripts` green (no script contract was broken by doc edits).

## Verification
```bash
grep -n "propose" PRD/instructions/graph-workflow-contract.md
grep -rn "GATE-QUESTIONS" PRD/instructions/graph-workflow-contract.md
npm run test:scripts
```

## Files touched
- `PRD/instructions/graph-workflow-contract.md`
- `PRD/instructions/preparation-contract.md`
- `PRD/instructions/workflow-reference.md`
