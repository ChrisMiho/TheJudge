# Slice B — Detector Fixture Corpus

## Status: planned

## Goal

Create the committed, reproducible detector fixture corpus and eval harness that Slice C tunes recall against by outcome (REQ-051).

## Requirements

1. Add committed fixture seeds and/or committed generated synthetic fixtures plus a provenance manifest.
2. Cover at least these condition classes: obvious baseline card, glare/specular highlight, low-contrast border vs. surface, perspective skew, and foil-like/internal-edge distraction.
3. Synthetic degradation is generated deterministically/parameterizably and must not require ignored files under `apps/frontend/data/scryfall/card-images/`.
4. An eval harness reports per-fixture detector success and an aggregate detect rate, recording a baseline before Slice C tuning.
5. Tests exercise the fixture loading/generation code and at least one detector pass through the corpus.
6. Downloaded/owner fixtures carry clear recorded provenance before commit (human-approval network posture).

## Acceptance criteria

- [ ] `npm --workspace apps/frontend run test -- src/lib/scan/detector.test.ts` verifies committed fixtures load and run through `detectCard`/`detectCardCorners`.
- [ ] A test verifies synthetic degradation generation is deterministic for fixed parameters.
- [ ] A manifest in the fixture directory records each fixture's source/provenance, generation parameters where applicable, and intended condition class.
- [ ] A detector eval command or test output records baseline detect-rate evidence before Slice C tuning.
- [ ] Manual review confirms no acceptance path depends on untracked `apps/frontend/data/scryfall/card-images/` files.

## Verification

```bash
npm --workspace apps/frontend run test -- src/lib/scan/detector.test.ts
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/lib/scan/detector.test.ts`
- `apps/frontend/src/lib/scan/__fixtures__/detector/` (committed fixtures)
- `apps/frontend/src/lib/scan/__fixtures__/detector/manifest.json` (provenance)
- `apps/frontend/src/lib/scan/detectorFixtures.ts` or equivalent fixture helper
- `apps/frontend/src/lib/scan/detectorFixtures.test.ts` or equivalent tests
- Optional eval script under `scripts/` if a CLI report is chosen over test-only reporting
