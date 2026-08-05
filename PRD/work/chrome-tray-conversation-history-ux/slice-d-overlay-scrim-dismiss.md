# Slice D — Outside/scrim dismiss for View Context and History

## Status: planned

## Goal

View Context and History overlays dismiss when the user activates the dimmed outside/scrim region,
in addition to Close and Escape (DEC-142 / REQ-117).

## Requirements

1. In `AdaptiveContextDialog`, activating the dimmed overlay outside the panel surface closes the
   dialog and restores focus to the View Context trigger (same path as Close/Escape).
2. In `ConversationHistoryDrawer`, activating the dimmed overlay outside the panel surface closes
   the drawer and restores focus appropriately (same path as Close/Escape).
3. Clicks/taps on the panel surface itself must not close the overlay.
4. Close and Escape continue to work on both overlays.
5. Focus trap while open is unchanged; reduced-motion behavior is unchanged.
6. Menu tray outside-click-to-close remains as already shipped; do not alter Menu↔History mutual
   exclusivity (`useLeftEdgeDrawer`).

## Implementation notes

Both overlays already use a full-viewport root (`.adaptive-context-overlay` /
`.conversation-history-overlay`) wrapping a surface section. Wire dismiss on the overlay root and
`stopPropagation` on the surface (or equivalent hit-target split) so scrim clicks close and surface
clicks do not. Reuse each component's existing `closeDialog` / `onClose` path — do not invent a
second close channel.

## Acceptance criteria

- [ ] With View Context open, activating the scrim closes it and focus returns to the trigger
- [ ] With History open, activating the scrim closes it and focus restores appropriately
- [ ] Activating inside either panel surface does not close the overlay
- [ ] Close and Escape still work on both
- [ ] Focus trap / Tab cycling while open is unchanged
- [ ] Menu outside-click-to-close and Menu↔History exclusivity still work

## Verification

```bash
npm --workspace apps/frontend run test -- AdaptiveContextDialog
npm --workspace apps/frontend run test -- ConversationHistoryDrawer
npm --workspace apps/frontend run test -- FeaturePortalMenu
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/AdaptiveContextDialog.tsx`
- `apps/frontend/src/components/AdaptiveContextDialog.test.tsx`
- `apps/frontend/src/components/ConversationHistoryDrawer.tsx`
- `apps/frontend/src/components/ConversationHistoryDrawer.test.tsx`
