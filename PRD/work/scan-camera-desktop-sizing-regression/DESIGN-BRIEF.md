---
name: scan-camera-desktop-sizing-regression
status: refined
---

# scan-camera-desktop-sizing-regression — Design Brief

## Scope

Two related, independently fixable regressions in `ScanCameraSurface`, both introduced by commit `666ac18`:

1. **Desktop video sizing** (original idea): the mobile-tuned `h-[clamp(20rem,calc(100dvh-17rem),42rem)] !max-h-none` height clamp has no desktop breakpoint, so desktop inherits mobile viewport-height-driven sizing instead of the prior proportion-stable `aspect-[3/4]` layout, producing an oversized/distorted desktop capture panel.
2. **Top-left overlay overlap** (found via post-fix review screenshot, `TheJudge2.png`): the DEC-090 mute toggle, placed in the alignment guide's top-left corner, is still visually clipped by the top-left status/convergence indicator box when that box grows to its two-line searching state (`"Searching for a card…"` + a hint/nudge line).

## Decisions

- Sizing: the video sizing should be breakpoint-scoped — mobile keeps the `666ac18` viewport-height clamp (its original intent), desktop falls back to the prior proportion-stable `aspect-[3/4]` approach (or equivalent) above a desktop width threshold. This is not new scope: **REQ-068** already specifies this exact desktop behavior via its existing acceptance criteria — "the layout degrades gracefully on short viewports and desktop: where there is no excess vertical space the frame falls back toward its prior sizing and nothing clips or scrolls unexpectedly" — plus the "bounded by a max/min" and no-clip/no-scroll clauses on the tall-phone growth criterion. Commit `666ac18` shipped the mobile clamp without honoring this desktop-fallback clause, so this half of the work is a regression fix against REQ-068's own acceptance criteria (no new DEC/REQ number needed) and must be implemented directly against REQ-068's acceptance-criteria wording at map-out, not invented fresh.
- Overlap: **DEC-093** (refines DEC-090) — drop the generic `"Searching for a card…"` label entirely while searching. The indicator box shows only the active hint (DEC-062), detector nudge (DEC-073), or the positive in-zone cue (DEC-074/REQ-054) — or nothing, if none apply. `locking` and `camera-error` copy are unchanged. This is realized as **REQ-071** (refines REQ-068).

## Non-goals

- Not revisiting the mobile ergonomics intent of `666ac18`/DEC-090 itself.
- Not touching card detection/identification logic, the fingerprint recipe, or the stabilizer/lock gate.
- Not repositioning the mute toggle, the alignment guide, or the status box — the overlap fix is copy-only. If dropping the label doesn't fully clear the overlap at some device width, a follow-up positioning fix is explicitly out of scope here (recorded in DEC-093's Notes).
- Not addressing the game-context control changes from `666ac18` (DEC-091 already covers those) unless a similar regression surfaces.

## References

- `PRD/sections/decisions/scanning.md` — DEC-090 (original layout), DEC-093 (this session's overlap fix)
- `PRD/sections/functional-requirements.md` — REQ-068 (original layout), REQ-071 (this session's overlap fix)
- `apps/frontend/src/components/ScanCameraSurface.tsx` — `indicatorText`/`CONDITION_HINT_COPY`/`DETECTOR_NUDGE_COPY` (overlap fix), video `className` sizing (sizing fix)
