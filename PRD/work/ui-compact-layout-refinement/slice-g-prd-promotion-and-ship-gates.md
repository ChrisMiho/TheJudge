# Slice G — PRD Promotion and Ship Gates

## Status: pending

## Goal

Align durable PRD scan UX with DEC-076 (post-ship refinement notes and REQ amendments), run full quality gates, and prepare the work package for cleanup.

## Requirements

### PRD alignment (DEC-076 scan contradictions)

DEC-075, DEC-076, REQ-055, REQ-056, and FLOW-008 are already in `sections/` from refinement. Slice G verifies and completes the remaining scan-domain alignment:

- `PRD/sections/decisions/scanning.md` — add **DEC-076 refines DEC-052/055/056** tombstone notes (escalation prompt removed; manual search via Exit scan; manual tap-capture unchanged)
- `PRD/sections/functional-requirements.md` — amend **REQ-038** and **REQ-040** acceptance criteria to match **REQ-056** (no in-scan escalation prompt; review-bubble running count)
- `PRD/sections/user-flows.md` — fix **FLOW-006** step 4 to reference the review bubble, not the hidden zone list
- `PRD/sections/system-map.md` — update **Scan UX in zone picker** summary for DEC-076

### Integration tests

- Density toggle persistence + state safety in `App.test.tsx`
- Zone grid scroll + scan hide tests (Slices B, C)
- Enrichment scroll cap test (Slice D)
- Easter egg tests (Slice A)

### Ship gates

```bash
npm run quality:check
```

### Manual acceptance

- Game context (players expanded, Easter egg)
- Zone collection: 5+ cards grid scroll; scan mode focused UI
- Enrichment View all cards with 5+ cards in one zone
- Chunky regression vs remembered baseline; slim visibly tighter
- Answered conversation with frozen summary expanded

## Acceptance criteria

- [ ] All slices A–F marked done in README slice table.
- [ ] Scan-domain PRD alignment complete: scanning.md refinement notes, REQ-038/040 amendments, FLOW-006 step 4, system-map scan summary — consistent with DEC-076 and REQ-056.
- [ ] `npm run quality:check` passes.
- [ ] Manual spot-check list completed.

## Dependencies

- `sequential`: Slices A, B, C, D, E, F — all implementation complete

## Cleanup

After human confirms ship: run `thejudge-cleanup` to write receipt and delete `PRD/work/ui-compact-layout-refinement/`.

## Verification

```bash
npm run quality:check
```
