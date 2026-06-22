# Card-scan "never locks in" — root-cause analysis

**Date:** 2026-06-21
**Branch:** feature/fix-detection
**Reporter symptom:** Holding a card to the camera surfaces a constantly-churning list
of many card names at the bottom of the picker; the correct card *occasionally* appears,
but the detector never "hones in" / locks onto a single card. The feature is unusable.

## Pipeline recap (as built)

```
ScanCameraSurface (auto-scan ~3 fps)
  └─ each tick: full-frame → detectCard() → perspective-warp to 745×1040
       └─ useScanCapture.identify(image)
            ├─ isCardBack() gate
            ├─ CardIdentifier.identify() → top-10 {card_id, distance}
            ├─ matched = best.distance ≤ MATCH_THRESHOLD (120)
            ├─ resolveScanCandidates() → up to 10 CardMetadataItem
            └─ setResolvedCandidates(resolved)   ← REPLACES list every frame
                 └─ ZoneCardPicker renders the list when length > 1
```

Hash facts (grounding the thresholds): `phashRegionPacked` = 3 channels × a 256-bit
DCT pHash (`recipe.ts:13`). `regionDistance` = mean per-channel Hamming on a **0–256
scale** (`identify.ts:118-128`). Two *unrelated* cards score ≈ **128**. A genuine match
is typically **< ~50**.

## Root causes (evidence-backed)

### 1. PRIMARY — no temporal stabilization / lock-in exists
`useScanCapture.identify()` runs every auto-scan frame and **wholesale replaces**
`resolvedCandidates` with a fresh top-10 each time (`useScanCapture.ts:128-129`). Nothing
remembers prior frames; nothing votes across frames. The *only* auto-accept path is
`if (resolved.length === 1)` (`useScanCapture.ts:132`) — a degenerate condition that
essentially never fires because `identify()` returns up to 10 candidates. So the system
*can only* stream a new noisy list every ~333 ms forever. **This is the "never resolves"
behavior directly.**

### 2. Match threshold is near-random → the list floods
`MATCH_THRESHOLD = 120` on a 0–256 scale (`identify.ts:16`) means "anything better than
~94% of random passes as matched." Almost every frame therefore "matches" something and
surfaces ~10 mostly-noise names. The true card only wins the top slot when a frame's warp
happens to be clean. There is no use of the **best-vs-second margin** and no minimum
**confidence gate** before surfacing candidates.

### 3. COMPOUNDING — unstable / expensive per-frame input
- The detector runs a full pure-JS CV pipeline (Canny + morphology + flood-fill contours,
  `detector.ts`) on the **full-resolution** camera frame every tick. Slow, and the warped
  quad wobbles frame-to-frame → the hash and top-1 wobble → list churns.
- Non-forced `no-card` frames do **not** clear the list (`ScanCameraSurface.tsx:72-75`),
  so stale names linger between detections.

## Why the engine itself is NOT the problem
The reporter sees the correct card surface *occasionally*. That proves the fingerprint
library + warp + hash **can** identify correctly. The defect is in **convergence and
confidence gating around** the engine, not the engine. Fix those and the existing engine
becomes usable. (`cardhashes.bin` is present: 97,311 entries.)

## Fix thesis
Add a **temporal stabilizer** that votes top-1 identity across a short rolling window and
**locks in** only when one card is (a) consistently the best over N frames, (b) below a
*tight* confidence distance, and (c) clearly ahead of the runner-up by a margin. On lock,
**pause** auto-scan and present a single confident result for one-tap accept (DEC-052
"accept → re-scan loop"). Gate per-frame surfacing by confidence so the noise list stops
flooding. Downscale detection input so effective FPS rises (more votes) and the warp is
steadier. Detector geometry/engine math is unchanged — this is purely a control/UX layer.
