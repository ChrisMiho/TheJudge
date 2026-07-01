---
status: active
---

# scan-lock-on-outline

Draw an affirmative outline on the detected card in the scan viewfinder whenever the stabilizer enters the existing `locking` state, as a positive "you're close — hold this angle" alignment cue that helps the user lock onto the right angle faster.

See [IDEA.md](./IDEA.md) for problem, outcome, and non-goals, [DESIGN-BRIEF.md](./DESIGN-BRIEF.md) for scope/decisions, and [GAMEPLAN.md](./GAMEPLAN.md) for architecture and the corner-wiring feasibility confirmation.

## Resolved in refinement
- **Trigger:** reuse the existing `locking` convergence state (DEC-057) — no new threshold, no match-acceptance change (DEC-083).
- **What's drawn:** a clean affirmative card outline only, reusing the DEC-060 detector-corner geometry; not the full developer debug overlay (stays opt-in) and not its text metrics/read-region.
- **Presentation:** always-on during scan, no toggle/mode; static affirmative outline, reduced-motion-safe.

## Product truth
- `DEC-083`, `REQ-062` (new); `FLOW-006` step 3 + `system-map.md` "Scan lock-in control layer" refined.

## Slices

| Slice | Objective | Depends on |
| --- | --- | --- |
| [A](./slice-a-outline-renderer.md) | Shared affirmative card-outline renderer (`ScanCardOutline`); refactor `ScanDebugOverlay` to consume it, no behavior change | — |
| [B](./slice-b-locking-outline-wiring.md) | Always-on locking outline in `ScanCameraSurface`: cheap per-frame corner capture, `locking`-gated draw, clear on `searching`/lock-complete | A |

A is a pure presentational extraction (build stays green on its own). B wires the
feature and imports A's renderer → sequential (stated blocker). B is the final slice
and carries the PRD-promotion checklist + ship gates.

## Implementation map

| Concern | Location |
| --- | --- |
| Affirmative outline renderer (new, shared) | `apps/frontend/src/components/ScanCardOutline.tsx` |
| Debug overlay (refactor to consume renderer; read-region/metrics stay here) | `apps/frontend/src/components/ScanDebugOverlay.tsx` |
| Corner capture + `locking`-gated draw | `apps/frontend/src/components/ScanCameraSurface.tsx` |
| `locking` phase + convergence signal (read-only, unchanged) | `apps/frontend/src/hooks/useScanCapture.ts` |
| Detector corner surfacing (`onCorners`, unchanged) | `apps/frontend/src/lib/scan/detector.ts` |

## Feasibility

Corner wiring confirmed cheap: `detectCard`'s `onCorners` returns the quad already
computed for the warp (adds only `orientCardQuad`), and detection/warp run every frame
regardless of debug. The only added cost is a React re-render, gated to the `locking`
window. Graceful degrade preserved: no corners on a `locking` frame → no outline, text
indicator still shows `Locking on <name>`.
