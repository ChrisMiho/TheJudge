# Slice 03 — Flow foundation

status: complete

**Prerequisites:** [slice-02-prompt-and-eval.md](./slice-02-prompt-and-eval.md)  
**Next slice:** [slice-04-ui-game-setup-and-zones.md](./slice-04-ui-game-setup-and-zones.md)

## Goal

Extract **flow logic** from `App.tsx`: step order, Back/Continue guards, phase→zone default merge. No full UI redesign yet — logic + tests first (or thin shell).

## Scope

### Module (`apps/frontend/src/lib/contextFlow/`)

Suggested files:

- `steps.ts` — step IDs, order, labels
- `phaseZoneDefaults.ts` — matrix from [phase-zone-assumptions.md](./phase-zone-assumptions.md)
- `mergeSelectedZonesOnPhaseChange(current, newPhase)` — additive merge
- `canAdvance(step, state)` — validation per step (no min card count)
- `buildEnrichmentQueue(gameContext)` — flatten zone cards in canonical order
- `buildAskAiRequest(question, gameContext)` — omit empty zone keys

### Step IDs (v1)

`game-setup` → `zone-confirm` → `zone-collection` → `enrichment` → (submit on enrichment view)

### Tests

- Phase change retains cards; adds assumed zones
- `buildAskAiRequest` omits empty zones
- Enrichment queue order stable
- Back navigation does not mutate unrelated state (test via pure functions)

## Tasks

- [x] Create `contextFlow` module
- [x] Port logic from `App.tsx` incrementally where safe
- [x] Unit tests for defaults matrix and merge behavior
- [ ] Optional: minimal `ContextFlowShell.tsx` rendering placeholder steps for manual smoke test

## Validation gate

```bash
npm --workspace apps/frontend run test
npm run typecheck
```

Manual (if shell exists):

- [ ] Step forward/back through placeholders without state loss

## Done when

- Flow rules live outside `App.tsx` with test coverage
- `buildAskAiRequest` produces slice-01-compatible payload from in-memory state

## Out of scope

- Full game setup / zone UI (slice 04)
- Per-zone card search UI (slice 05)
- Enrichment UI (slice 06)
- Deleting old 4-step flow from `App.tsx` (can coexist until slice 06)

## Hardening note

This slice is the right place to introduce extensibility before adding zone UI — avoids another monolith edit later.
