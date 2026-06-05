## Status

- status: **planned** (not started)
- parent phase: UX Wave 2 — post-refinement polish
- supersedes / amends: [user-flow-refinements slice 01](../user-flow-refinements/slice-01-game-context-compact.md) (display names in roster + partial prompt only)
- source feedback: demo walkthrough — active player list and downstream selects ignore edited player names; LLM prompt still uses raw `Player N` for caster, owner, and targets
- canonical plan: [GAMEPLAN.md](GAMEPLAN.md)

## Purpose

Propagate user-entered player display names from game setup through the entire staged flow UI and into the LLM prompt. Canonical player identity remains fixed `PlayerLabel` values in the API; display names are UI- and prompt-facing only.

**Implementing agents:** treat this folder as the single source of truth. Do not rely on Cursor-only plan files under `.cursor/plans/`.

## Agent read order

1. This README
2. [GAMEPLAN.md](GAMEPLAN.md) (overview, root causes, locked decisions, verification)
3. The slice doc for the slice you are implementing (A → C in order unless told otherwise)
4. `PRD/sections/decisions.md` (add **DEC-025** in slice C)
5. `PRD/sections/user-flows.md` (FLOW-001 game setup step)
6. `PRD/sections/functional-requirements.md` (REQ-015 constraints)
7. `PRD/sections/integrations-and-data.md` (`GamePlayerContext.displayName`, `activePlayer`)

## Slices

| Slice | File | Status | Depends on |
| --- | --- | --- | --- |
| A | [slice-a-ui-player-labels.md](slice-a-ui-player-labels.md) | planned | — |
| B | [slice-b-prompt-player-resolution.md](slice-b-prompt-player-resolution.md) | planned | A |
| C | [slice-c-prd-and-tests.md](slice-c-prd-and-tests.md) | planned | A, B |

## Implementation map

| Slice | Primary code |
| --- | --- |
| A | `apps/frontend/src/lib/playerLabels.ts` (new), `App.tsx`, `ZoneCardPicker.tsx`, `ZoneCollectionStep.tsx`, `EnrichmentStep.tsx`, optional `BattlefieldStep.tsx`, `App.test.tsx` |
| B | `apps/backend/src/promptNormalization.ts`, `apps/backend/src/promptContext.ts`, `apps/backend/src/types.ts`, `promptNormalization.test.ts`, eval fixture(s) |
| C | `PRD/sections/decisions.md`, `user-flows.md`, `functional-requirements.md`, `integrations-and-data.md`, full test run |

## Product decisions (locked for this work)

| Topic | Decision |
| --- | --- |
| Canonical identity | API payload fields (`caster`, `owner`, `targetPlayer`, `activePlayer`, `label`) stay `PlayerLabel` (`Player 1` … `Player N`) |
| Display format | When `displayName` is set and differs from `label`, show **`Player N (Name)`** in UI option text and prompt lines; when unset, show **`Player N`** only |
| UI `<option value>` | Always the raw `PlayerLabel`; only visible label text changes |
| Prompt game context | Keep existing per-player roster lines with `displayName=`; add **`activePlayer`** line when provided, using the same display format |
| Prompt card lines | Resolve `caster`, `owner`, and `player:` targets through the player roster lookup |
| Out of scope | Renaming labels in the API, schema changes, or replacing `PlayerLabel` with freeform strings |

## When done

- Mark each slice **Status** at top of its file: `planned` → `in progress` → `complete`
- Update this README table
- Run verification in [GAMEPLAN.md § Verification](GAMEPLAN.md#verification-checklist)
- Promote durable changes into `PRD/sections/` (slice C)
- Delete this folder per `PRD/instructions/doc-lifecycle.md`
- Update `PRD/README.md` active work table if navigation changed
