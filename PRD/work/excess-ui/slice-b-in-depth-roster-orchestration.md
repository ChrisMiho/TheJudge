# Slice B — In-Depth roster orchestration and preservation

## Status: done

## Goal

Wire one synchronized secondary-details state into In-Depth Question while preserving every existing
player value, roster rule, and submitted counter contract.

## Requirements

1. Add exactly one secondary-details boolean in `MtgAssistantApp` beside the existing outer
   `playersDetailsExpanded` state. It defaults false and is the only state supplied to every nested
   player arrow.
2. Pass Slice A's controlled state/toggle props into `PlayerRosterEditor`. Keep the existing
   `renderPlayerExtras` markup and all counter callbacks/data owners in `MtgAssistantApp`; visibility
   must not rebuild or normalize counter state.
3. Replace the outer inline toggle with a named transition that preserves its current open behavior
   and resets secondary details false whenever the outer roster closes. Reopening must show compact
   cards with name/life visible and all counter inputs absent.
4. Leave secondary state unchanged when adding or removing a player. A newly added player must
   inherit expanded presentation, and remaining players must stay expanded after removal.
5. Preserve the exact existing helper copy, 2–8 bounds, duel/multiplayer life defaults, active-player
   fallback, display-name labels, validation, counter inventory, input labels, and responsive grids.
6. Keep the Life Tracker seed effect's existing data-copy and outer-roster-open behavior, but ensure
   seeded secondary details start collapsed. Tests must expand through the new arrow before editing
   or asserting seeded counter inputs.
7. Prove collapsing/reopening presentation does not alter display names, life, scalar counters,
   Commander damage, named counters, or the eventual `gameContext.players` payload.
8. Add/update shared test helpers only where doing so keeps app-level setup readable; do not encode
   a second disclosure state model in helpers.

## Tests

- `MtgAssistantApp.player-counters.test.tsx`: outer-open compact default, synchronized reveal of all
  counter groups, seeded values hidden then revealed unchanged, add/remove inheritance, and
  outer-close/reopen reset with value preservation.
- `MtgAssistantApp.player-counters.test.tsx`: edit representative name/life/scalar/Commander/named
  values, collapse/reset/re-expand, then submit and assert the same normalized player payload.
- `App.responsive-presentation.test.tsx`: the compact name/life baseline and outer/staged state stay
  mounted across resize; the automatic single-tree responsive contract remains intact.
- `test/appTestHelpers.tsx`: optional focused helper for the nested all-player arrow if multiple
  integration tests need it; retain the current outer `expandPlayerDetails` meaning.

## Acceptance criteria

- [ ] `npm --workspace apps/frontend run test -- MtgAssistantApp.player-counters` proves counter
      inputs are absent after opening the outer roster and appear for all active players after any
      nested arrow is activated.
- [ ] A test adds and removes players while expanded and proves the shared state remains expanded for
      the current active roster without changing existing player values or count bounds.
- [ ] Closing/reopening the outer roster collapses secondary details while all name/life inputs and,
      after re-expansion, all counter values remain unchanged.
- [ ] Seed coverage proves Life Tracker values still copy exactly, the outer roster still opens, and
      counter inputs begin hidden until the shared arrow is activated.
- [ ] Submission coverage proves disclosure toggles/resets do not change the normalized
      `gameContext.players` payload for unchanged inputs.
- [ ] The canonical helper string is asserted exactly and no new visible guidance text is introduced.
- [ ] `npm --workspace apps/frontend run typecheck` passes without changes to shared request/types,
      backend validation, or counter schemas.

## Verification

```bash
npm --workspace apps/frontend run test -- MtgAssistantApp.player-counters App.responsive-presentation
npm --workspace apps/frontend run typecheck
git diff --check
```

## Files touched

- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`
- `apps/frontend/src/components/portal/MtgAssistantApp.player-counters.test.tsx`
- `apps/frontend/src/App.responsive-presentation.test.tsx`

### Discovered scope

Wiring the shared secondary-details boolean into `MtgAssistantApp` also collapses seeded
counter inputs by default in the two Life Tracker handoff integration suites, which were not
listed above because they exercise `MtgAssistantApp` only through the real portal without
otherwise touching this slice's contract. Updated `apps/frontend/src/App.player-life-tracker-flow.test.tsx`
and `apps/frontend/src/App.player-life-tracker-seed.test.tsx` to expand the shared arrow before
reading/editing counter fields, keeping `npm run quality:check` green. Slice C still owns
updating `App.player-life-tracker-flow.test.tsx` further for the destination-round-trip reset
behavior it introduces.
- `apps/frontend/src/test/appTestHelpers.tsx`
