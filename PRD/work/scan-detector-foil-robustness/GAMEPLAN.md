# GAMEPLAN: scan-detector-foil-robustness

## Architecture

This package fixes the scan pipeline at one boundary only — the **detector** — so cards that currently fail at `detectCard()` reach the existing, unchanged downstream pipeline.

```
ScanCameraSurface captures live frame
  -> detectCard(frame)            ← THE ONLY PRODUCT LEVER (recall)
  -> warpPerspective(corners)     ← unchanged
  -> useScanCapture.identify      ← unchanged: Region A crop -> CARDHSH1 hash -> match
  -> stabilizer lock gate         ← unchanged precision guard (lockDistance 78 / marginMin 14)
  -> auto-add only on lock        ← unchanged
```

The single product lever is **detector recall**: raise it aggressively so the previously-failing ornate/etched-foil and low-contrast-border cards produce a stable 4-corner quad. The precision guard stays downstream — a detected quad never auto-adds on its own; the DEC-059 stabilizer distance+margin vote decides identity. Over-detection therefore costs at most a wasted frame, never a wrong card. Owner-directed posture: **loosen first, tighten only if spurious warps actually appear** (DEC-072).

All detector tuning constants and detection-side helpers live in `apps/frontend/src/lib/scan/detector.ts` (DEC-072 / REQ-050). `tuning.ts` remains the stabilizer/frame-selection home and is **not** a detector-tuning surface in this package.

## Data Flow

1. **Evidence capture (Slice A)** — with the debug overlay off, Capture behaves exactly as today; with the overlay on, the same Capture button additionally downloads the exact raw camera frame it grabbed. Diagnostic only: no change to detect/warp/identify/stabilizer/add behavior, no network call.
2. **Fixture corpus (Slice B)** — committed fixture seeds and/or committed deterministic synthetic degradations (glare/specular, low-contrast border vs. surface, perspective skew, foil-like highlights) with a provenance manifest become the reproducible outcome bar. A detector eval harness reports per-fixture detect success and an aggregate rate. The ignored Scryfall image cache may help select seeds but is never a test/acceptance prerequisite.
3. **Detector tuning (Slice C)** — `detector.ts` raises recall via loosened/adaptive Canny + solidity/rectangularity/aspect/area gates and stronger multi-channel (foil/glare-tolerant) edge sourcing; a low-contrast-border fallback path runs **only** after the primary pipeline finds nothing. New corners feed the unchanged warp + recipe.
4. **User feedback (Slice D)** — sustained `no-card` surfaces a condition-aware nudge through the existing searching/convergence feedback area (DEC-057/DEC-062 path); manual search/capture stays available; raw status text is not leaked.
5. **Validation (Slice E)** — record before/after detect-then-lock rate across committed fixtures and on-device, confirm no new false auto-adds under the unchanged stabilizer gate, and verify all frozen boundaries.

## Implementation Slices

| Slice | Objective | Depends |
| --- | --- | --- |
| A | Debug-gated raw-frame export on the existing Capture button (REQ-051). | None |
| B | Committed detector fixture corpus + provenance manifest + eval harness/baseline (REQ-051). | None |
| C | Detector recall tuning + foil/glare edge sourcing + low-contrast fallback in `detector.ts` (REQ-050). | B |
| D | Persistent `no-card` nudge through the existing searching-state path (REQ-050). | None |
| E | Outcome evidence, frozen-boundary verification, and cleanup/promotion checklist. | A, B, C, D |

A, B, D are parallel-ready. C is sequential after B because its tuning target is the corpus baseline. E is the final aggregation slice.

## Verification Checklist

- `npm --workspace apps/frontend run test -- src/components/ScanCameraSurface.test.tsx`
- `npm --workspace apps/frontend run test -- src/lib/scan/detector.test.ts`
- `npm --workspace apps/frontend run test -- src/hooks/useScanCapture.test.ts`
- `npm --workspace apps/frontend run typecheck`
- `npm run quality:check`
- Manual device check: debug overlay off → Capture unchanged; debug overlay on → Capture exports the exact raw frame.
- Manual/eval check: committed corpus records before/after detect-then-lock rate; previously-failing hard captures no longer stop at `no-card`; no new false auto-adds.

## Frozen Boundaries (DEC-072 / REQ-050 / REQ-051)

- Do not change `apps/frontend/src/lib/scan/recipe.ts` (`cropRegionA` / `phashRegionPacked`) geometry.
- Do not change `apps/frontend/src/lib/scan/identify.ts` matching / orientation / distance logic.
- Do not change `apps/frontend/src/lib/scan/tuning.ts` lock-gate values (`lockDistance` / `marginMin`) as a detection lever.
- Do not change `apps/frontend/public/data/cardhashes.bin`, the `CARDHSH1` bin format, scan map artifacts, or DEC-051/REQ-034 parity vectors.
- No OCR, no corpus rebuild, no runtime scan network calls; no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, the provider boundary, or any product-facing endpoint.
- The ignored `apps/frontend/data/scryfall/card-images/` cache is never a test or acceptance prerequisite.
- If a fixture proves unfixable without Region A geometry or bin-format change, record it as a **separate escalation** and leave it out of this package (DEC-069 precedent) — never fold it in.
