---
status: active
---

# scan-lock-acquisition-tuning

Follow-up refinement package for scanner acquisition after the stabilizer tuning trial.

## Seed observation

Owner retest: scanning remained hard to acquire, but when the card did identify, lock/auto-add happened quickly.

## Recent tuning delta captured

- `apps/frontend/src/lib/scan/tuning.ts`
  - `SCAN_STABILIZER_CONFIG.windowSize`: `6 -> 13`
  - `SCAN_STABILIZER_CONFIG.minVotes`: `4 -> 3`
  - `lockDistance` stayed `78`
  - `marginMin` stayed `14`
- `apps/frontend/src/lib/scan/stabilizer.test.ts`
  - Added coverage for three confident votes retained across the longer scanner window.
- `apps/frontend/src/hooks/useScanCapture.test.ts`
  - Replaced hardcoded six-frame lock loops with `SCAN_STABILIZER_CONFIG.minVotes`.

## Refinement focus

- Determine whether the remaining hard-to-scan behavior is caused by camera focus, detector downscale/quad quality, frame selector choosing the wrong warp, frame-quality gates/cues, or identity confidence before stabilizer voting.
- Prefer adding targeted diagnostics or a reversible acquisition experiment before loosening the final lock precision gates further.
- Preserve zero scan-time network calls and the existing frozen matching boundary unless refinement proves a larger escalation is required.

## Candidate next questions

- Should the next slice start with diagnostic instrumentation/export so each live frame reports detector corners, quality, best identity distance, runner-up margin, and vote/no-vote reason?
- Should frame selection be temporarily simplified to current-frame-only to test whether best-frame windowing is selecting bad warps?
- Should detector resolution become adaptive only after a low-confidence 640px pass instead of always increasing detector cost?

## Refinement result

- New **DEC-077** (`PRD/sections/decisions/scanning.md`): scanner acquisition tuning is diagnostic-first, with one scanner behavior path validated under a hard Mac-webcam baseline and an ideal stand-assisted controlled setup.
- New **REQ-057** (`PRD/sections/functional-requirements.md`): add acquisition diagnostics from capture through vote/no-vote reason, plus the validation matrix.
- `FLOW-006` now records the validation matrix as QA/diagnostic behavior, not a user-facing mode.
- `system-map.md` now includes planned **Scan acquisition diagnostics**.

## Slices (map-out 2026-06-26)

See [GAMEPLAN.md](GAMEPLAN.md) for architecture, data flow, frozen boundaries, and verification checklist.

| Slice | Objective | DEC/REQ | Depends on | Status |
| --- | --- | --- | --- | --- |
| [A](slice-a-diagnostic-contract.md) | Acquisition diagnostic contract + pure vote-reason helpers | DEC-077 / REQ-057 | - | done |
| [B](slice-b-capture-detector-diagnostics.md) | Camera/capture and detector diagnostics in surface/export | DEC-077 / REQ-057 | A | done |
| [C](slice-c-selector-identity-vote-diagnostics.md) | Selector, identity, and stabilizer vote/no-vote diagnostics | DEC-077 / REQ-057 | A | done |
| [D](slice-d-reversible-acquisition-experiments.md) | Evidence-gated reversible acquisition experiments | DEC-077 / REQ-057 | B, C | planned |
| [E](slice-e-validation-prd-promotion.md) | Validation matrix evidence, PRD promotion checklist, ship gates | DEC-077 / REQ-057 | B, C, D | planned |

B and C are parallel-ready after A. D is sequenced after diagnostics exist. E is the validation and cleanup handoff.

## Implementation map

| Concern | File |
| --- | --- |
| Diagnostic types/reason helpers | `apps/frontend/src/lib/scan/acquisitionDiagnostics.ts` |
| Camera native frame + track settings | `apps/frontend/src/components/ScanCameraSurface.tsx` |
| Detector success/failure + corners/geometry | `apps/frontend/src/components/ScanCameraSurface.tsx`, `apps/frontend/src/lib/scan/detector.ts` |
| Debug overlay/export | `apps/frontend/src/components/ScanDebugOverlay.tsx`, `apps/frontend/src/components/ScanCameraSurface.tsx` |
| Frame selector provenance | `apps/frontend/src/lib/scan/frameSelection.ts` |
| Identity + vote/no-vote diagnostics | `apps/frontend/src/hooks/useScanCapture.ts`, `apps/frontend/src/lib/scan/stabilizer.ts` if read-only state detail is needed |
| Reversible tuning experiments | `apps/frontend/src/lib/scan/tuning.ts`, `ScanCameraSurface.tsx`, `frameSelection.ts`, `detector.ts` |
| Validation evidence | `PRD/work/scan-lock-acquisition-tuning/evidence-YYYY-MM-DD.md` |
| Frozen - do not edit | `recipe.ts`, `identify.ts`, `cardhashes.bin`, scan map artifacts, backend/API/prompt/provider files |

## Next step

Run `thejudge-implement` starting with slice A.
