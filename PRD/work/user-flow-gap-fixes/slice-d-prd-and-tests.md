# Slice D — PRD updates and test sweep

## Status: planned

## Depends on

Slices A, B, C

## Goal

Align durable PRD with implemented behavior and confirm automated + manual verification.

## PRD updates

### `PRD/sections/decisions.md` — DEC-024

Revise from “zero cards allowed” to:

- Submit requires **at least one card in at least one selected zone**.
- `gameContext.zones` still contains only non-empty zone arrays.
- Selected-but-empty zones still represented via `selectedZones` + prompt scope sentence.

### `PRD/sections/user-flows.md` — FLOW-001

- Step 1: turn phase required; defaults to stack resolving.
- Edge case: replace “submit still succeeds with no zones contain cards” with blocked continue/submit until ≥1 card in a selected zone.

### `PRD/work/user-flow-refinements/slice-01-game-context-compact.md`

- Note: “None” phase option removed by user-flow-gap-fixes slice A.

## Tests

Run full suites:

- `apps/frontend` — `flow.test.ts`, `App.test.tsx`
- `apps/backend` — `app.contract.test.ts`, relevant prompt tests

Add/update tests if gaps found during sweep.

## Acceptance

- [ ] DEC-024 and FLOW-001 match slices A–C behavior.
- [ ] All targeted tests pass.
- [ ] [GAMEPLAN.md verification checklist](GAMEPLAN.md#verification-checklist) items checked.
