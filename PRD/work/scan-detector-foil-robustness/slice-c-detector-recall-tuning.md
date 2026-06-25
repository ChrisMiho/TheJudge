# Slice C — Detector Recall Tuning

## Status: planned

## Depends on: B (the fixture corpus is the outcome bar)

## Goal

Raise `detectCard()` recall for hard real-world frames while keeping all detection-side tuning inside `detector.ts` (REQ-050, levers a–c of DEC-072).

## Requirements

1. Tune detector constants in `apps/frontend/src/lib/scan/detector.ts` against the corpus: `CANNY_LO/HI`, `SOLIDITY_MIN`, `RECTANGULARITY_MIN`, `ASPECT_TOLERANCE`, `MIN/MAX_AREA_FRAC`, and morphology iterations as needed.
2. Strengthen foil/glare-tolerant edge sourcing (multi-channel edge combination) so speculars and internal foil edges do not starve the outer-border contour.
3. Add a low-contrast-border fallback path (e.g. adaptive thresholding) that runs **only** after the primary pipeline finds no card.
4. Preserve `detectCard` public behavior: return a canonical warped image on a detected card, `null` when no plausible card exists, and invoke the corners callback only when a card is detected.
5. Do not touch Region A recipe, pHash, the bin format, scan corpus artifacts, matching logic, or stabilizer lock-gate values.
6. Document any unfixable fixture as an explicit escalation candidate instead of changing a frozen boundary.

## Acceptance criteria

- [ ] `npm --workspace apps/frontend run test -- src/lib/scan/detector.test.ts` verifies the primary path still detects the obvious baseline fixtures.
- [ ] Same test file verifies the foil/glare and low-contrast fixture classes now return a card or corners where the Slice B baseline failed.
- [ ] Same test file verifies the fallback path is used only when the primary path finds nothing.
- [ ] `npm --workspace apps/frontend run test -- src/lib/scan/stabilizer.test.ts` verifies stabilizer behavior is unchanged.
- [ ] Code review/manual check confirms no changes to `recipe.ts`, `identify.ts`, `tuning.ts` lock-gate values, `cardhashes.bin`, or scan map artifacts.

## Verification

```bash
npm --workspace apps/frontend run test -- src/lib/scan/detector.test.ts
npm --workspace apps/frontend run test -- src/lib/scan/stabilizer.test.ts
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/lib/scan/detector.ts`
- `apps/frontend/src/lib/scan/detector.test.ts`
- `apps/frontend/src/lib/scan/__fixtures__/detector/manifest.json` (only if tuning evidence needs fixture notes)
