status: active

# scan-camera-desktop-sizing-regression

The mobile scan layout change in `666ac18` swapped `ScanCameraSurface`'s video sizing from a fixed `aspect-[3/4]` to a `100dvh`-based height clamp (`h-[clamp(20rem,calc(100dvh-17rem),42rem)] !max-h-none`) with no desktop breakpoint, so desktop now inherits mobile-tuned viewport-height sizing instead of the previous proportion-stable layout. A desktop screenshot confirms the capture panel is now oversized/distorted.

A second, related regression surfaced during review: the DEC-090 mute toggle (moved into the alignment guide's top-left corner) is still visually clipped by the top-left status/convergence indicator box when it grows to two lines while searching. Fixed via DEC-093/REQ-071 — drop the generic "Searching for a card…" label, showing only the active hint/nudge/cue.

See `IDEA.md` for the original idea, `DESIGN-BRIEF.md` for the refined scope, and `GAMEPLAN.md` for architecture, data flow, and the verification checklist.

- Decisions: DEC-090 (original layout, regression source), DEC-093 (searching-label removal)
- Requirements: REQ-068 (desktop-fallback clause), REQ-071 (searching-label removal)

## Slices

| Slice | Objective | Depends on | Wave | Requirements |
| --- | --- | --- | --- | --- |
| [A](slice-a-desktop-video-sizing.md) | Desktop video sizing fallback | — | 1 | REQ-068 |
| [B](slice-b-searching-label-overlap.md) | Remove redundant searching-state label to clear mute-toggle overlap | — | 1 | REQ-071, DEC-093 |

A and B are both parallel-ready (no logical cross-deps) but land in the same two files (`ScanCameraSurface.tsx` and its test file) — implement one PR at a time to avoid a diff clash. Slice B carries the PRD promotion checklist and ship gates for both slices.

## Implementation map

| Concern | Location |
| --- | --- |
| Video sizing (mobile clamp / desktop fallback) | `apps/frontend/src/components/ScanCameraSurface.tsx` (`<video>` className) |
| Searching-state indicator copy | `apps/frontend/src/components/ScanCameraSurface.tsx` (`indicatorText`, `CONDITION_HINT_COPY`, `DETECTOR_NUDGE_COPY`) |

## Source

- `IDEA.md` — original idea capture, including the exact diff and file location (`apps/frontend/src/components/ScanCameraSurface.tsx`)
- `DESIGN-BRIEF.md` — refined scope covering both the desktop sizing fix and the overlap fix
- `TheJudge2.png` (repo root, not committed under this folder) — screenshot that surfaced the overlap regression
