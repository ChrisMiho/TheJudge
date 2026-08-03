# Slice C — Semantic token-role normalization

## Status: done

## Goal

Normalize existing accent foreground usage so every fixed profile remains legible through the shared
four-token semantic contract, with no profile-specific styling or expanded surface inventory.

## Requirements

1. Audit existing accent-bearing consumers against the approved role rule:
   - accent text on dark/slate surfaces uses `accent-soft`;
   - accent text on light surfaces uses `accent-strong`;
   - text/icons on filled `accent` or `accent-strong` controls use `accent-contrast`.
2. Correct the known Life Tracker dark-surface mismatches in `GameSetupPanel`, `CounterPanel`, and
   `PlayerLifeTrackerApp`, including dark modal headings, active counter/tab labels, and actions on
   translucent dark surfaces. Preserve the existing light Life Tracker card use of
   `accent-strong` and all life/counter behavior.
3. Correct the filled conversation user bubble to use `text-accent-contrast`; preserve message
   alignment, history, follow-up behavior, and motion.
4. Verify representative Quick Question, scanner, staged In-Depth, and portal chrome consumers
   already use the correct roles. Change a consumer only when the surface/foreground pairing is
   mismatched; do not redesign or broaden coverage.
5. Add focused class-contract tests for every changed surface and representative unchanged Quick,
   portal, scanner, dark, light, and filled examples. Tests assert semantic token roles rather than
   profile names or computed Tailwind output.
6. Do not change neutral backgrounds, card-identity rings, semantic red error/destructive states,
   scanner behavior/motion, REQ-060 ambient membership, or product layout.

## Tests

- `GameSetupPanel.test.tsx`, `CounterPanel.test.tsx`, and `PlayerLifeTrackerApp.test.tsx`: dark
  foregrounds use `text-accent-soft`, fixed filled controls use `text-accent-contrast`, and light
  player-card accents remain `text-accent-strong` where applicable.
- `ConversationThread.test.tsx`: user bubble uses `bg-accent-strong` with
  `text-accent-contrast`; assistant bubble remains neutral.
- Existing Quick Lookup, Theme/portal, `ScanCameraSurface`, `ScanReviewBubble`, and App theming tests:
  targeted representative assertions confirm correct token roles and absence of fixed palette hues.

## Acceptance criteria

- [ ] `npm --workspace apps/frontend run test -- GameSetupPanel CounterPanel PlayerLifeTrackerApp ConversationThread QuickLookupApp ScanCameraSurface ScanReviewBubble App.theming`
      passes the representative dark/light/filled role matrix.
- [ ] Tests prove Black-profile accent text on dark Life Tracker surfaces uses `text-accent-soft`,
      while filled controls and the conversation user bubble use `text-accent-contrast`.
- [ ] A focused review of every changed class confirms no `data-theme` branch, profile id/name,
      inline profile value, or new CSS variable was added (manual diff check).
- [ ] Existing life totals, counters, conversation history, Quick Question flow, and scanner tests
      remain green, demonstrating presentation-only changes.
- [ ] `npm --workspace apps/frontend run typecheck` passes and `git diff --check` reports no errors.

## Verification

```bash
npm --workspace apps/frontend run test -- GameSetupPanel CounterPanel PlayerLifeTrackerApp ConversationThread QuickLookupApp ScanCameraSurface ScanReviewBubble App.theming
npm --workspace apps/frontend run typecheck
! rg -n 'data-theme|dataTheme|palette\.id|paletteId' apps/frontend/src/components/portal/life-tracker apps/frontend/src/components/ConversationThread.tsx
git diff --check
```

## Files touched

- `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx`
- `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.test.tsx`
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx`
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.test.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.test.tsx`
- `apps/frontend/src/components/ConversationThread.tsx`
- `apps/frontend/src/components/ConversationThread.test.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.test.tsx`
- `apps/frontend/src/components/ScanCameraSurface.test.tsx`
- `apps/frontend/src/components/ScanReviewBubble.test.tsx`
- `apps/frontend/src/App.theming.test.tsx`
