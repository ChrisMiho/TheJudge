## Status

- status: **active**
- parent phase: UX Wave 2 — post-walkthrough gap fix
- source feedback: manual walkthrough (2026-06-05) — friend skipped targets in enrichment; AI answered that the stack was empty despite battlefield cards being present
- canonical plan: [GAMEPLAN.md](GAMEPLAN.md)
- source sections: `PRD/sections/user-flows.md`, `PRD/sections/functional-requirements.md`, `PRD/sections/decisions.md`

## Purpose

Fix misleading AI responses when users submit **battlefield-only** (or other non-stack) context with a **blank question**, which currently falls back to `"Resolve the stack"` even when no stack cards were added. Skipping targets in enrichment is **not** the root cause; this package addresses the real mismatch between populated zones and the default question.

**Implementing agents:** treat this folder as the single source of truth. Do not rely on Cursor-only plan files under `.cursor/plans/`.

## Agent read order

1. This README
2. [GAMEPLAN.md](GAMEPLAN.md) (root cause, repro, verification)
3. The slice doc for the slice you are implementing (**A → D** unless told otherwise)
4. `PRD/sections/user-flows.md` (FLOW-001 edge cases — update in slice D)
5. `PRD/sections/decisions.md` (add **DEC-###** in slice D)
6. `PRD/instructions/doc-lifecycle.md` (promote and delete this folder when done)

## Slices

| Slice | File | Status | Depends on |
| --- | --- | --- | --- |
| A | [slice-a-context-aware-fallback.md](slice-a-context-aware-fallback.md) | planned | — |
| B | [slice-b-enrichment-summary.md](slice-b-enrichment-summary.md) | planned | A |
| C | [slice-c-zone-collection-nudge.md](slice-c-zone-collection-nudge.md) | planned | — |
| D | [slice-d-prd-and-closeout.md](slice-d-prd-and-closeout.md) | planned | A, B, C |

## Implementation map

| Slice | Primary code |
| --- | --- |
| A | `apps/frontend/src/lib/contextFlow/flow.ts`, `apps/backend/src/prompt/context.ts`, tests |
| B | `apps/frontend/src/components/EnrichmentStep.tsx`, `App.tsx` (if helper import needed), tests |
| C | `apps/frontend/src/components/ZoneCollectionStep.tsx`, `App.tsx` (`onFlashStatus`), tests |
| D | `PRD/sections/user-flows.md`, `PRD/sections/decisions.md`, full test run, delete this folder |

## Product decisions (locked for this work)

| Topic | Decision |
| --- | --- |
| Skipping targets | **Unchanged** — targets remain optional per REQ-017 / FLOW-001 |
| Minimum cards | **Unchanged** — at least one card in **any** selected zone (existing gate) |
| Stack empty + blank question | Use **zone-aware fallback question**, not `"Resolve the stack"` |
| Stack has cards + blank question | Keep `"Resolve the stack"` |
| Submit blocking | **Do not** require stack cards when other zones are populated (Option A) |
| Phase zone defaults | **Unchanged** — `main_1` may preselect stack without requiring stack cards |

## When done

- Mark each slice **Status** at top of its file: `planned` → `in progress` → `complete`
- Update this README slice table
- Run verification in [GAMEPLAN.md § Verification checklist](GAMEPLAN.md#verification-checklist)
- Slice D: promote into `sections/`, then **delete** this entire folder per `doc-lifecycle.md`
