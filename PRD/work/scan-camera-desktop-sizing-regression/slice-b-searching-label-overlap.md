# Slice B — Remove redundant searching-state label to clear mute-toggle overlap

## Status: planned

## Dependencies

None. Parallel-ready with Slice A — see Slice A's Dependencies note on shared-file sequencing.

## Goal

Stop the top-left status/convergence indicator from rendering the generic `"Searching for a card…"` label while searching, so the box shrinks to its single-hint-line height and no longer clips the DEC-090 mute toggle in the alignment guide's top-left corner (DEC-093, REQ-071).

## Requirements

1. In `apps/frontend/src/components/ScanCameraSurface.tsx`, change the `indicatorText` computation (~lines 420-425): the `isSearching` branch must not fall through to `"Searching for a card…"`. Instead, while searching, `indicatorText` is the already-computed `searchingNudge` (hint or detector nudge) if present, else `inZoneCue` if present, else no text.
2. The render (~line 466, `<span>{indicatorText}</span>`) must become conditional so that when there is no searching text, no empty/placeholder `<span>` renders — the box shows no text content in that state (REQ-071 acceptance criterion).
3. `locking` (`Locking on <name>` + progress bar/vote count) and `camera-error` (`Camera unavailable`) branches, copy, and rendering are byte-for-byte unchanged.
4. `CONDITION_HINT_COPY`, `DETECTOR_NUDGE_COPY`, and the `"Good — hold steady"` in-zone cue keep their existing text, wording, and priority (nudge/hint over in-zone cue) — DEC-062/DEC-073/DEC-074 untouched.
5. No repositioning of the mute toggle, alignment guide, or status box — this is copy-only (non-goal per `DESIGN-BRIEF.md`).

## Acceptance criteria

- [ ] While `isSearching` with no hint/nudge/cue active, the indicator box renders no text content (no `"Searching for a card…"`, no empty placeholder line).
- [ ] While `isSearching` with a condition hint, detector nudge, or in-zone cue active, that line renders alone at the top of the box — no generic label above it.
- [ ] `locking` state still renders `Locking on <name>` plus the existing progress bar/vote count, unchanged.
- [ ] `camera-error` state still renders `Camera unavailable`, unchanged.
- [ ] Every existing test assertion for the literal `"Searching for a card…"` string is removed or updated (across the `convergence indicator`, `condition hints`, `detector nudge`, and `positive in-zone cue` describe blocks in `ScanCameraSurface.test.tsx`), and a new test asserts the string never renders while searching with no hint/nudge/cue active.

## Verification

```bash
npm --workspace apps/frontend run test -- src/components/ScanCameraSurface.test.tsx
npm run quality:check
```

Manual: on a narrow/phone-width viewport, open the scan screen while searching with no active hint (or force one via debug), and confirm the indicator box no longer covers the mute toggle in the top-left corner of the alignment guide.

## Files touched

- `apps/frontend/src/components/ScanCameraSurface.tsx`
- `apps/frontend/src/components/ScanCameraSurface.test.tsx`

## Ship gates

- [ ] Slice A and Slice B acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged (frontend-only, no `AskAiRequest`/Zod/`GameContext`/prompt/provider/endpoint change)
- [ ] No secrets committed
- [ ] Durable outcomes promoted: update the "Responsive scan-layout closeout" entry in `PRD/sections/system-map.md` (~line 319, under "Scan UX in zone picker") to also cover the desktop-fallback sizing and the REQ-071/DEC-093 label removal; `PRD/work/scan-camera-desktop-sizing-regression/` ready to delete
