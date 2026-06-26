# GAMEPLAN: scan-capture-quality

Widen the scan **capture-quality window** so a DB-registered card locks across a broader distance/light range, not just a narrow sweet spot. Three levers, all **upstream of the frozen warp → Region A → `CARDHSH1` → DEC-059 lock** boundary. See [DESIGN-BRIEF.md](DESIGN-BRIEF.md) for root cause and non-goals.

## Architecture / data flow

```
getUserMedia(constraints)        ← Slice A: request higher-res + continuous AF (REQ-053)
  → <video> native videoWidth/videoHeight
  → hidden capture canvas (already grabs at native size, unchanged)
  → detectCard() on MAX_DETECT_DIMENSION(640) downscale (UNCHANGED — no detect slowdown)
  → warp to canonical 745×1040 (UNCHANGED recipe.ts)
  → FrameSelector.push() over rolling window      ← Slice C: window 5→3 (tuning.ts)
      → scoreFrameQuality() on Region A           ← Slice C: FRAME_QUALITY_* recalibration
      → acceptable? best frame : abstain
  → identify() → resolveScanCandidatesRanked → ScanStabilizer (UNCHANGED gate, DEC-059)
  → ScanConvergence view-model                    ← Slice B: positive in-zone cue (REQ-054)
      → ScanCameraSurface indicator copy          ← Slice B: affirmative "hold steady"
```

**Key invariant:** only the fixed-output warp samples a larger source. Detection, the Region A recipe, `cardhashes.bin`, `identify.ts`, and the stabilizer lock gate are untouched. DEC-051/REQ-034 byte-exact pHash + DB-load parity is unaffected (no DB or recipe edit).

## Slice map

| Slice | Objective | DEC/REQ | Primary file | Depends on |
| --- | --- | --- | --- | --- |
| A | Higher-resolution capture request + graceful fallback | DEC-074 / REQ-053 | `ScanCameraSurface.tsx` | — |
| B | Positive in-zone "hold steady" cue while searching | DEC-074 / REQ-054 | `useScanCapture.ts`, `ScanCameraSurface.tsx` | — |
| C | Best-frame window 5→3 + frame-quality recalibration | DEC-062 (calibration) | `tuning.ts` | A |
| D | On-device validation, PRD promotion, ship gates | DEC-074 validation gate | — (PRD) | A, B, C |

A and B are parallel-ready. C is sequenced after A because its norms are recalibrated against higher-resolution frames. D is the validation/cleanup gate after all three land.

## Frozen — do not edit

`recipe.ts` (`cropRegionA`/`phashRegionPacked`), `identify.ts`, `cardhashes.bin`, `cardScanMap.json`, `stabilizer.ts` gate values (DEC-059 `lockDistance`/`marginMin`), `detector.ts` (DEC-072/073). No `AskAiRequest`/Zod/`GameContext`/provider changes. Scanning stays frontend-only with zero scan-time network calls.

## Verification checklist

- [ ] A: `getUserMedia` requests `width`/`height` `{ ideal: 1920/1080 }` + continuous `focusMode` (all `ideal`, never `exact`); camera still opens on a constraint-rejecting device. (`ScanCameraSurface.test.tsx`)
- [ ] B: `ScanConvergence` carries an additive positive-cue field set only when a frame is acceptable and not yet locked; affirmative copy renders while searching and never during locking/camera-error. (`useScanCapture` + `ScanCameraSurface.test.tsx`)
- [ ] C: `FRAME_SELECTOR_WINDOW_SIZE === 3`; `FRAME_QUALITY_*` norms updated; `frameQuality.test.ts` + `frameSelection.test.ts` green. (calibration only, no logic change)
- [ ] Frozen boundary untouched: `git diff --name-only` shows no edits to `recipe.ts`, `identify.ts`, `stabilizer.ts`, `detector.ts`, `cardhashes.bin`, `cardScanMap.json`.
- [ ] `npm run quality:check` green for touched areas.
- [ ] D: Fresh owner on-device pass — DB-registered card locks across a wider distance/light range, no new false auto-adds, exported frame native resolution > 640×480 on a supporting device.

## Test commands

```bash
# Focused (per slice)
npm --workspace apps/frontend run test -- ScanCameraSurface
npm --workspace apps/frontend run test -- frameQuality frameSelection

# Full gate (before ship)
npm run quality:check
```
