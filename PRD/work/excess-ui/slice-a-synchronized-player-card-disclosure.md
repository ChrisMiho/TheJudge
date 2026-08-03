# Slice A — Synchronized player-card disclosure contract

## Status: done

## Goal

Make `PlayerRosterEditor` render compact player-card baselines plus repeated arrows backed by one
controlled all-player secondary disclosure state.

## Requirements

1. Extend `PlayerRosterEditorProps` with one boolean for the shared secondary-details state and one
   toggle callback. Keep the component controlled; do not add internal or per-player expansion
   state.
2. Preserve the current outer count/add/remove row, outer `isExpanded` behavior, player bounds,
   callback semantics, and name/life input labels.
3. When the outer roster is open, render display name and optional life total for every active player
   whether secondary details are collapsed or expanded.
4. When `renderPlayerExtras` is supplied, render one arrow inside every active player card. Every
   arrow must:
   - read the same controlled boolean;
   - invoke the same toggle callback;
   - expose the same `aria-expanded` value;
   - use an accessible name that explicitly says it shows/hides secondary details for all players;
   - provide at least a 44×44px touch target;
   - use stable disclosure-control/region semantics for the rendered secondary content.
5. Render every player's extras only while the shared state is expanded. If no extras renderer is
   supplied, render no nested arrow or empty secondary region.
6. Keep the existing mobile-first card/input classes and shared accent/motion treatment. Do not add
   a dependency, visible guidance copy, or viewport-specific markup.
7. Rework the unit-test harness so its active `players` collection follows add/remove operations and
   can drive one shared secondary boolean without accidentally modeling independent cards.

## Tests

- `PlayerRosterEditor.test.tsx`: compact outer-open baseline, extras absent by default, identical
  `aria-expanded` across every arrow, expand via Player 1, collapse via Player 2, no mixed state,
  ≥44×44px classes, and stable accessible all-player names/relations.
- `PlayerRosterEditor.test.tsx`: add while expanded inherits the shared state; remove while expanded
  leaves remaining arrows/content expanded and retains 2–8 count bounds.
- Existing editor cases: outer default/collapse, display-name and life callbacks, optional life
  totals, no-extras behavior, and count-control touch targets remain green.

## Acceptance criteria

- [ ] `npm --workspace apps/frontend run test -- PlayerRosterEditor` proves name/life stay visible
      while secondary extras are absent in the compact state.
- [ ] The focused test expands all player extras from the first card's arrow and collapses all of
      them from a different card's arrow; every arrow reports the same state at each assertion.
- [ ] The focused test proves an added active player follows expanded state and removal does not
      collapse remaining cards or regress 2–8 bounds.
- [ ] DOM/class assertions prove every nested arrow is at least 44×44px and its accessible name
      communicates the all-player effect.
- [ ] A no-extras test proves the component emits neither nested arrows nor empty disclosure regions.
- [ ] `npm --workspace apps/frontend run typecheck` passes with one controlled shared-state contract
      and no internal/per-player disclosure model.

## Verification

```bash
npm --workspace apps/frontend run test -- PlayerRosterEditor
npm --workspace apps/frontend run typecheck
git diff --check
```

## Files touched

- `apps/frontend/src/components/PlayerRosterEditor.tsx`
- `apps/frontend/src/components/PlayerRosterEditor.test.tsx`
