# MVP1 Key Decisions Snapshot

This file distills MVP1 decisions most relevant to MVP2 implementation continuity.

## Product and Scope Posture
- `DEC-001`: MVP1 is a flow-validation milestone, not full gameplay/rules accuracy.
- `DEC-002`: TheJudge is an assistant; responses should avoid false authority.
- `DEC-013`: Backend must not add rules-engine or legality simulation behavior.

## Contract and Interaction Stability
- `DEC-004`: Stack ordering is bottom-to-top (`stack[0]` bottom; last item top).
- `DEC-005`: New stack entries append to the end (top of stack).
- `DEC-009`: Blank question fallback remains deterministic (`Resolve the stack`).
- `DEC-010`: Product-facing backend surface stays intentionally narrow.
- `DEC-014`: Failure handling preserves user state with retry control.

## Provider and Integration Direction
- `DEC-011`: Mock-first backend strategy validates flow before Bedrock integration.
- `DEC-017`: Mock response shape remains contract-compatible for transition safety.

## Context and Data Strategy
- `DEC-012`: Metadata is prebuilt/static for MVP1; runtime sync is out of scope.
- `DEC-019`: Approved structured context expansion (game context, battlefield context, mana-spent semantics) is part of MVP1 baseline.

## Notes for MVP2 Work
- These decisions are historical continuity anchors.
- Active requirement authority remains in:
  - `PRD/sections/decisions.md`
  - `PRD/sections/integrations-and-data.md`
  - `PRD/sections/non-functional-requirements.md`
