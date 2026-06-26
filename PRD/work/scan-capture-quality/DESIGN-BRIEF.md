# DESIGN-BRIEF: scan-capture-quality

## Goal

Widen the scan **capture-quality window** so cards lock across a range of distances and lighting instead of only a narrow sweet spot. Owner symptom (2026-06-25 re-test): scanning "turns into a game of finding the right spot and holding still — works at certain distances and certain lights, but idk how to tune it." This is **not** a detection problem (DEC-072/DEC-073 already raised `detectCard()` recall and `detectCard()` passes on the real frames) and **not** a matching-engine problem — it is **capture quality** feeding the existing, frozen warp → Region A → `CARDHSH1` match → DEC-059 lock pipeline.

## Root cause (evidence)

Every owner-exported frame — including the one captured at the distance that scanned well (`scan-frame-1782439377948.png`) and the committed `real/` frames — is **640×480**, because `ScanCameraSurface.openCamera` calls `getUserMedia({ video: { facingMode: { ideal: "environment" } } })` with **no resolution constraint**, so the browser returns its low default regardless of camera capability. With the card filling ~82% of frame height it is only ~390px tall natively, and the warp **upscales it to the 1040px canonical height (~2.6×)** before hashing Region A. The captured frames scored Region A quality 0.501 / 0.451 against `FRAME_QUALITY_ACCEPT_THRESHOLD = 0.45` — right at the edge — which is exactly why only a thin distance/light band locks.

## Scope (three levers, all upstream of the frozen matching boundary)

Two of the three levers from refinement were already built; refinement reshaped the scope accordingly:

1. **A — Capture-resolution prior (the headline new work; DEC-074 / REQ-053).** Request a higher-resolution capture mode via `getUserMedia` `MediaTrackConstraints` (`width`/`height` `{ ideal: 1920/1080 }`, `facingMode { ideal: "environment" }`, continuous `focusMode` where supported), always `ideal` (never `exact`) so weak/locked-down devices degrade gracefully. The hidden capture canvas already grabs at native `videoWidth`/`videoHeight`, so the larger stream flows into the warp with no other capture-path change. Detection still runs on the `MAX_DETECT_DIMENSION` (640) downscale, so there is **no detection slowdown** — only the fixed-output warp samples a larger source.
2. **B — Positive in-zone capture cue (small addition; DEC-074 / REQ-054).** The searching-state feedback already surfaces *negative* cause-aware hints (glare/blur/occlusion/low-detail via `conditionHint`). Add the affirmative half: once a frame's `qualityScore` clears the accept threshold but the card has not yet locked, show a "good — hold steady" cue so the user knows when they have found the lockable zone. Reuses the existing convergence/nudge view-model; non-blocking; no new control.
3. **C — Best-frame window + frame-quality recalibration (calibration only, no new product truth).** Best-frame-of-window already ships (`frameSelection.ts` `FrameSelector`, `FRAME_SELECTOR_WINDOW_SIZE = 5`, DEC-062 lever 2). Set the window `5 → 3` and recalibrate the `FRAME_QUALITY_*` norms (notably `FRAME_QUALITY_SHARPNESS_NORM` and `FRAME_QUALITY_ACCEPT_THRESHOLD`) against the higher-resolution frames, since those were tuned at 640×480. Outcome-validated `tuning.ts` calibration under DEC-062 — recorded here, carries no DEC/REQ.

## Decisions

- **DEC-074** (new, `decisions/scanning.md`) — higher-resolution camera capture mode (+ continuous autofocus, graceful `ideal` fallback) as a capture-quality lever upstream of the frozen recipe/bin/identify/lock boundary, plus a positive in-zone cue and `tuning.ts` recalibration. Complements DEC-062 (query conditioning), DEC-072/DEC-073 (detection-side recall); supersedes none.
- Builds on / frozen against: DEC-051/REQ-034 (recipe + parity), DEC-053 (oracle-level identity), DEC-059 (lock gate — the precision guard, untouched), DEC-062 (query conditioning + best-frame + condition feedback this extends), DEC-065 (uncluttered scan layout), DEC-072/DEC-073 (detection already handled).

## Requirements / Flows

- **REQ-053** (new) — higher-resolution capture request with graceful fallback.
- **REQ-054** (new) — positive in-zone capture cue while searching.
- **FLOW-006** (Scan cards into a zone) — one edge case added for higher-resolution capture + the positive in-zone cue. No new FLOW.
- Existing referenced: REQ-037 (camera capture/detector), NFR-010 (scan perf/footprint).

## Non-goals / frozen boundaries

- No change to the Region A recipe geometry (`recipe.ts` `cropRegionA`/`phashRegionPacked`), the `CARDHSH1` bin format, `cardhashes.bin`, the bridge/manifest artifacts, `identify.ts` distance/orientation/ranking, or the DEC-059 stabilizer lock gate (`lockDistance`/`marginMin`). A higher-resolution source warps through the same unchanged recipe; DEC-051/REQ-034 byte-exact pHash + DB-load parity held. A fix that genuinely needed any of these is a separate recipe + full-DB-rebuild escalation — flagged and recorded, never folded in (DEC-069/DEC-072 precedent).
- **No torch/flash control and no explicit exposure constraints this round** (owner-chosen: resolution + continuous autofocus only). A torch toggle remains a clean future extension.
- No detector corner-finding change (DEC-072/DEC-073 already own that).
- Scanning stays frontend-only with zero scan-time network calls; no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, the provider boundary, or any product-facing endpoint.
- Resolution ceiling, focus mode, the `5 → 3` best-frame window, and the `FRAME_QUALITY_*` norms are outcome-validated calibration constants (DEC-052/DEC-055/DEC-059/DEC-062 precedent), not product open questions.

## Validation

Outcome-based (DEC-052/DEC-055/DEC-059/DEC-062 precedent): the acceptance gate is a **fresh owner on-device pass** showing the lock window widened — a **DB-registered** card locks across a broader distance/light range than before, with **no new false auto-adds** — plus confirmation that an exported frame now reports native resolution above 640×480 on a supporting device. The frame-quality / best-frame / capture constants are calibration, validated by this outcome, not by bit-equality. (Note the prior package's lesson: a synthetic or automated pass is necessary-but-not-sufficient; the on-device outcome is the gate.)

## Open questions

None blocking. Low-light affordance is deferred by decision, not an open question.

## Files in play (for map-out; not prescriptive)

- `apps/frontend/src/components/ScanCameraSurface.tsx` — `getUserMedia` constraints in `openCamera`; positive-cue copy in the searching indicator (`CONDITION_HINT_COPY` neighborhood).
- `apps/frontend/src/hooks/useScanCapture.ts` — positive-cue view-model field on `ScanConvergence` (additive, pure), set when `selection.quality.acceptable` and not locked.
- `apps/frontend/src/lib/scan/tuning.ts` — `FRAME_SELECTOR_WINDOW_SIZE` 5→3; `FRAME_QUALITY_*` recalibration.
- Frozen — do **not** edit: `recipe.ts`, `identify.ts`, `cardhashes.bin`, `cardScanMap.json`, `stabilizer.ts` gate values (DEC-059), `detector.ts` (DEC-072/073 owns it).
