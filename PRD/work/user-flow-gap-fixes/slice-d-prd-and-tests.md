# Slice D — PRD updates and test sweep

## Status: complete

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

- [x] DEC-024 and FLOW-001 match slices A–C behavior.
- [x] All targeted tests pass.
- [x] [GAMEPLAN.md verification checklist](GAMEPLAN.md#verification-checklist) items checked.

## Verification

- `npm --workspace apps/frontend run test -- src/lib/contextFlow/flow.test.ts src/App.test.tsx` — 79 tests passed.
- `npm --workspace apps/backend run test -- src/app.contract.test.ts src/promptContext.test.ts src/promptNormalization.test.ts` — 33 tests passed.
- `npm --workspace apps/frontend run test` — 139 tests passed.
- `npm --workspace apps/backend run test` — 64 tests passed.
- Manual checklist coverage is represented by existing App tests for default Stack Resolving phase, card-gated collection/enrichment submit, and command-card owner plus zone-card target enrichment.
