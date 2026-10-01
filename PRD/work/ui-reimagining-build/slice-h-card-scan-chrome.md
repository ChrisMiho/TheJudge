# Slice H — Card scan chrome, with a holding list

## Status: done

## Goal

The scanner gets the new frame — lit viewfinder with three bands, a
shutter, an ✕ exit, one count pill on every host, a caution pop-up, a
themed Debug panel — while detection, lock and the ding stay unchanged. A
scanned card waits in the scanner's own holding list, shown by the count
pill, and joins the zone or trade side only when the player closes the
scanner.

## Dependencies

Slice A (frame, tokens), slice B (shared sheet — the caution pop-up and
Debug panel reuse it), slice D (In-depth's Cards station is one scan
destination), slice G (Trade Balancer is the other scan destination).

## Requirements

Realises this `GATE-QUESTIONS.md` id, applied to `PRD/sections/` by intent
together with the code:

1. REQ-214 (**edit**, owner-edited) — the scanner in the new frame: lit
   viewfinder, three bands, shutter, ✕ exit (keeps the accessible name "Exit
   scan", `A12`), one count pill now on every host, caution pop-up, themed
   Debug panel. Detection, lock, and the ding are unchanged. A scanned card
   waits in the scanner's own holding list, shown by the count pill; it
   joins the zone or trade side only when the player closes the scanner —
   not the instant it is recognised. This restores the mockup's original
   "join when you close the scanner" rule over the proposal's earlier
   add-on-recognition draft (`A11`).

## Files touched

- `apps/frontend/src/components/ScanCameraSurface.tsx` (+ `.test.tsx`) —
  lit viewfinder, three bands, shutter, ✕ exit, count pill wired to the
  holding list, themed chrome.
- `apps/frontend/src/components/ScanReviewBubble.tsx` — caution pop-up,
  themed.
- `apps/frontend/src/components/ScanDebugOverlay.tsx` — themed Debug panel.
- `apps/frontend/src/components/ScanCardOutline.tsx` — unchanged detection
  outline, re-themed only.
- New holding-list state (scanner-local, cleared on close) — likely a
  `apps/frontend/src/lib/scan/` module or local component state; detection
  pipeline (`lib/scan/detection`, `lib/scan/identification`) stays
  untouched per the brief.
- `PRD/sections/scan/README.md`, `PRD/sections/functional-requirements.md`
  — apply REQ-214 by intent.

## Tests

- `ScanCameraSurface.test.tsx` — holding list accumulates recognised cards,
  count pill reflects it, cards join the destination only on close, not on
  recognition.
- `ScanReviewBubble.test.tsx`, `ScanDebugOverlay.test.tsx` — themed chrome,
  unchanged behaviour.

## Acceptance criteria

- [x] H1. `npm run quality:check` passes.
- [x] H2. `npm --workspace apps/frontend run test` passes.
- [x] H3. A recognised card is added to the scanner's own holding list, not
      immediately to the zone or trade side; the count pill reflects the
      holding list's size.
- [x] H4. Closing the scanner moves every held card into the destination
      (zone or trade side) in one step.
- [x] H5. The ✕ exit control keeps the accessible name "Exit scan"; the
      shutter keeps "Capture" (A12).
- [x] H6. Detection, lock, and the ding are observably unchanged (same
      component, re-themed only — no change to `lib/scan/detection` or
      `lib/scan/identification`).
- [x] H7. `PRD/sections/` carries REQ-214 (owner-edited holding-list
      wording) by intent.
- [x] H8 (manual). REQ-202 pair: Life Tracker screenshot before/after this
      slice's scanner chrome theming, at 390×844 and 1440×900, saved to
      `docs/design/ui-reimagining/build-screenshots/h/`.
- [x] H9 (manual). Browser scenario at 390×844: scan two cards into In-depth
      details' Cards station without closing the scanner — both appear only
      in the holding list (count pill = 2); close the scanner — both land
      in the destination zone picker.
- [x] H10 (manual). Browser scenario: the same holding-then-close behaviour
      repeated with Trade Balancer as the destination.
- [x] H11 (manual). Cleanup evidence recorded: browser closed, owned
      servers stopped, ports released, capture output path named.

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
```

## Files touched

(see above)
