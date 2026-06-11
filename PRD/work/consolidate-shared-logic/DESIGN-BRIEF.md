# Design Brief — Consolidate Shared Logic and Remove Duplication

## Scope

Pure refactor. Zero behavior changes. Zero API or prompt contract changes. No new product features.

## Decisions referenced

- DEC-013 — backend must not implement legality validation or rules simulation; scope stays narrow
- DEC-020 — HTTP contract frozen; request/response shapes unchanged
- DEC-021 — `GameContext` model unchanged
- `technical-design-rules.md` — keep backend intentionally small; no extra endpoints; no shared npm package

## Non-goals

- No new product features or behavior changes
- No changes to prompt content, API contracts, or request/response shapes
- No creation of a shared npm package between frontend and backend
- No frontend/backend unification of normalization strategies
- No changes to test coverage thresholds beyond what cleanup naturally produces
- `App.tsx` orchestration extraction (finding 10) — deferred

## Design decisions

### Backend constants module

Create `apps/backend/src/constants.ts` as the single authoritative backend constants file.

Consolidate into it:
- `orderedPlayerLabels` — currently hardcoded in `validation/askAiRequest.ts:15-24`, `prompt/normalization.ts:19-28`, and `test-utils/requestBuilders.ts:4-13`
- `CANONICAL_ZONE_ORDER` — currently in `prompt/normalization.ts:38` and `cardRulings.ts:38`
- Derive `NON_STACK_CANONICAL_ZONE_ORDER` from `CANONICAL_ZONE_ORDER` using a filter rather than a separate definition

Fix truncation duplication: `cardRulings.ts` imports `truncateOracleText` from `prompt/normalization.ts` instead of reimplementing `truncateWithSuffix`.

### Backend module split

Split `prompt/normalization.ts` (470 lines, three mixed concerns) into three files within `apps/backend/src/prompt/`:

| File | Responsibility |
|------|---------------|
| `normalization.ts` | Normalization logic only (currently lines 66–100) |
| `promptFormatting.ts` | Display formatting — `formatPlayerRef`, `buildPlayerDisplayNameLookup`, and related helpers (currently lines 112–255) |
| `promptDiagnostics.ts` | Diagnostics (currently lines 308–391) |

All existing imports throughout the backend update to point to the correct split file.

### Rulings function collapse

`cardRulings.ts`: collapse `resolveRulingsForPrompt()` (lines 154–197) and `resolveRulingsForPromptWithDebug()` (lines 199–257) into a single function with an optional debug flag. Callers updated accordingly.

### Frontend EnrichmentStep.tsx extraction

Extract from `EnrichmentStep.tsx` (689 lines):
- Embedded utilities `parseManaSpent()` (line 47) and `formatContextTarget()` (line 54) → separate lib file under `apps/frontend/src/lib/`
- Multi-state management (~10 `useState` hooks) → custom hook under `apps/frontend/src/hooks/`

Audit all frontend code that displays player names to check whether it imports from the existing `lib/playerLabels.ts` or inlines the algorithm. This is a finding-only audit — document any inline usages found; no fixes are in scope for this work package.

### Cross-app duplication (accepted trade-off)

Frontend fallback question constants and player display formatting partially mirror backend implementations. Given the no-shared-package constraint and that each app's implementation serves a different rendering context (UI vs. prompt assembly), this duplication is accepted technical debt. Each app independently consolidates within its own boundary per this work package; no further action is taken at the cross-app boundary.

## Slice decomposition

| Slice | Scope | Parallel? |
|-------|-------|-----------|
| A | Backend constants: create `constants.ts`; consolidate `orderedPlayerLabels`, `CANONICAL_ZONE_ORDER`; fix truncation import | Yes — parallel to C |
| B | Backend module split: `normalization.ts` → 3 files | After A; parallel to D |
| C | Frontend: extract `EnrichmentStep.tsx` utilities + hook; audit `playerLabels.ts` usage (finding only) | Yes — parallel to A |
| D | Rulings function collapse: `resolveRulingsForPrompt` + `resolveRulingsForPromptWithDebug` → single function with optional debug flag | After A; parallel to B |
| E | Ship gates; promote durable outcomes; delete work folder | After B + C + D |

## REQ/FLOW/DEC changes

None. This work package is entirely within existing confirmed decisions.
