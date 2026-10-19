# Slice C — Scanner says why it refused a repeat card

## Status: planned

## Goal

On In-Depth's Cards station, a refused repeat scan shows its reason inside the
scanner, under the camera.

## Requirements

1. `ScanPanel.tsx` takes an optional notice and renders it under the camera
   beside the scan-data failure line, with the existing `tb-note` style and
   `role="status"`. No new `index.css` rule.
2. `ZoneCollectionStep.tsx` passes `scanCapture.blockedNotice` through
   `ZoneCardPicker.tsx`'s scan props to the panel.
3. Wording is the zone's own manual-add message, unchanged ("Duplicate cards
   are not supported in MVP1." or "MVP stack limit reached (10 cards)."). It
   clears on the next held card or when the scanner closes (hook already
   resets). The holding list does not grow.
4. Apply the finalized REQ-214 diff in `GATE-QUESTIONS.md` (`## REQ-214`,
   verdict accept) to `PRD/sections/functional-requirements.md` and
   `PRD/sections/scan/README.md`, by intent against current truth. Each added
   line appears exactly once.
5. Ask a Question's scanner is not changed (non-goal).

## Acceptance criteria

- [ ] `ScanPanel.test.tsx`: the notice renders under the camera with `role="status"` when given and not otherwise
- [ ] `ZoneCollectionStep.test.tsx`: with a card already on the Stack, a scan lock of that card shows "Duplicate cards are not supported in MVP1." inside the open scanner and the holding list does not grow
- [ ] The Stack-cap message shows in the scanner at the 10-card cap (test)
- [ ] The REQ-214 diff is applied to `functional-requirements.md` and `scan/README.md`, each new line exactly once, and no other line of those files changed
- [ ] No `index.css` change and Ask a Question's scanner call is untouched
- [ ] Typecheck and lint pass

## Verification

```bash
npm --workspace apps/frontend run test -- ScanPanel ZoneCollectionStep ZoneCardPicker
grep -c "blocked-scan notice" PRD/sections/functional-requirements.md PRD/sections/scan/README.md
git diff --stat origin/main...HEAD -- PRD/sections apps/frontend/src/index.css
npm run typecheck
npm run lint
```

## Files touched

- `apps/frontend/src/components/ScanPanel.tsx`
- `apps/frontend/src/components/ZoneCardPicker.tsx`
- `apps/frontend/src/components/ZoneCollectionStep.tsx`
- `apps/frontend/src/components/ScanPanel.test.tsx`
- `apps/frontend/src/components/ZoneCollectionStep.test.tsx`
- `PRD/sections/functional-requirements.md` (REQ-214 diff)
- `PRD/sections/scan/README.md` (REQ-214 diff)
