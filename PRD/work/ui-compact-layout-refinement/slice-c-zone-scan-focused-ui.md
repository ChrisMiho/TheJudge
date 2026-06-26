# Slice C — Zone Scan Focused UI

## Status: done

## Goal

When scan mode is open on the add-cards screen, dedicate the viewport to the camera by hiding redundant chrome and simplifying scan panel headers. Manual search fallback remains via Exit scan. Also remove the stale empty-state suggestion placeholder from zone collection entirely.

## Requirements

### Remove empty-state placeholder (all modes)

- Delete the `Select a suggestion to preview and add a card to {zone}.` paragraph in `ZoneCardPicker` (~242). When no card is selected, show nothing — search + suggestions are sufficient affordance.

### Hide while `isScanOpen`

- Search label + input + Scan button (`ZoneCardPicker` ~104–128)
- Zone card list grid
- Autocomplete suggestions (already partially guarded)
- Card owner select and `CardSelectionPreview`

### Camera chrome

- Remove `Scan card` heading row above the video.
- Move **Exit scan** button to `absolute right-3 top-3 z-20` inside the `relative` wrapper around `ScanCameraSurface`.
- Offset `ScanReviewBubble` downward (e.g. `top-12`) so it does not overlap Exit scan.

### Remove manual-entry prompt

- Delete `showManualEntryPrompt` UI block and related props wiring from `ZoneCardPicker` and `ZoneCollectionStep`.
- Optionally stop exporting `showManualEntryPrompt` from `useScanCapture` if unused elsewhere.
- Update test `"still escalates to manual entry after the low-confidence threshold"` — prompt no longer renders.

## Acceptance criteria

- [ ] When `scan.isOpen`, search input and Scan button are not in the document.
- [ ] When `scan.isOpen` with cards present, zone card list is not in the document.
- [ ] `getByRole("button", { name: "Exit scan" })` remains findable and closes scan.
- [ ] Manual-entry prompt and "Use manual search" button never render.
- [ ] `Select a suggestion to preview and add a card` copy is not in the document (scan open or closed).
- [ ] Scan review bubble tests pass (adjust positioning assertions if needed).

## Dependencies

- `parallel-ready`: DEC-050 (manual search via exit), DEC-058 (review bubble), DEC-065 (uncluttered scan layout)

## Files touched

- `apps/frontend/src/components/ZoneCardPicker.tsx`
- `apps/frontend/src/components/ZoneCollectionStep.tsx`
- `apps/frontend/src/components/ScanReviewBubble.tsx` (optional offset prop)
- `apps/frontend/src/hooks/useScanCapture.ts` (optional cleanup)
- `apps/frontend/src/components/ZoneCardPicker.test.tsx`

## Verification

```bash
npm --workspace apps/frontend run test -- src/components/ZoneCardPicker.test.tsx
npm --workspace apps/frontend run test -- src/hooks/useScanCapture.test.ts
npm --workspace apps/frontend run typecheck
```
