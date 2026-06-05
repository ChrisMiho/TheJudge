## Status

- status: **planned** (not started)
- parent phase: UX Wave 2 — post-refinement gap fixes
- supersedes / amends: [user-flow-refinements](../user-flow-refinements/README.md) (slices 01–06 shipped; this work closes reported gaps)
- source feedback: manual walkthrough — empty-zone submit, `turnPhase` API error, phase default, command-zone enrichment UX
- canonical plan: [GAMEPLAN.md](GAMEPLAN.md)

## Purpose

Close gaps in the staged context flow after UX Wave 2 refinements: require a real card context before submit, fix `turnPhase` contract mismatch, default phase to stack resolving, and separate ownership from targets in enrichment.

**Implementing agents:** treat this folder as the single source of truth. Do not rely on Cursor-only plan files under `.cursor/plans/`.

## Agent read order

1. This README
2. [GAMEPLAN.md](GAMEPLAN.md) (overview, root causes, verification)
3. The slice doc for the slice you are implementing (A → E in order unless told otherwise)
4. `PRD/sections/decisions.md` (update **DEC-024** in slice D)
5. `PRD/sections/user-flows.md` (FLOW-001 edge cases)
6. `PRD/sections/functional-requirements.md` (REQ-012, REQ-018, REQ-019 as needed)

## Slices

| Slice | File | Status | Depends on |
| --- | --- | --- | --- |
| A | [slice-a-turn-phase-required.md](slice-a-turn-phase-required.md) | complete | — |
| B | [slice-b-card-gate.md](slice-b-card-gate.md) | complete | A |
| C | [slice-c-enrichment-ownership.md](slice-c-enrichment-ownership.md) | complete | B |
| D | [slice-d-prd-and-tests.md](slice-d-prd-and-tests.md) | planned | A, B, C |
| E | [slice-e-alignment-review.md](slice-e-alignment-review.md) | planned | D |

## Implementation map

| Slice | Primary code |
| --- | --- |
| A | `apps/frontend/src/App.tsx`, `types.ts`, `lib/contextFlow/flow.ts`, tests |
| B | `flow.ts`, `ZoneCollectionStep.tsx`, `EnrichmentStep.tsx`, `App.tsx`, tests |
| C | `EnrichmentStep.tsx`, tests |
| D | `PRD/sections/user-flows.md`, `PRD/sections/decisions.md`, slice-01 note, full test run |
| E | `contextFlow/`, contract tests, optional small refactors; fill review checklist in slice E doc |

## Product decisions (locked for this work)

| Topic | Decision |
| --- | --- |
| Minimum cards | At least **one card in any** selected zone before Continue (collection) and Decrypt (enrichment) |
| Default turn phase | `stack_resolving` (UI: “Stack Resolving”); **no** “None” / unknown option |
| Empty selected zones | Still allowed individually; omitted from `gameContext.zones` in payload (unchanged) |
| Phase zone defaults | Do not change `phaseZoneDefaults.ts` without separate sign-off (slice 03 checkpoint) |

## When done

- Mark each slice **Status** at top of its file: `planned` → `in progress` → `complete`
- Update this README table
- Run verification in [GAMEPLAN.md § Verification](GAMEPLAN.md#verification-checklist)
- Promote durable changes into `PRD/sections/user-flows.md` and `decisions.md` (slice D)
- Optional: set this folder `status: complete` with date
