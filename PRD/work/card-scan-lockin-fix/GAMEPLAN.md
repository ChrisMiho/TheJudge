# Gameplan — card-scan lock-in fix

> **STATUS (2026-06-21): code complete, `npm run quality:check` green (frontend 269/269,
> backend 218/218, lint + typecheck pass). Awaiting reporter's real-device validation.**
> All three slices landed. NOTE: Codex was tried first for Slice 1 but hung (~57 min, no
> output); it was killed and all slices were implemented directly instead. Residual minor
> item (not fixed, low harm): a stale "possible matches" hint list can linger when the card
> leaves frame mid-search, since the camera's non-forced no-card path doesn't clear it; it is
> overwritten on the next detection and hidden once locked.


Fixes the "never hones in" defect from `ANALYSIS.md`. Frontend-only, no backend/engine-math
change. Tunable constants are grouped so device calibration is a one-file edit.

## Design overview

Introduce a control layer between `CardIdentifier.identify()` and the picker UI:

1. **Confidence gate** — stop surfacing near-random matches.
2. **Temporal stabilizer** — vote top-1 identity across a rolling window and emit a
   `searching | locked` state.
3. **Lock-in UX** — on lock, pause auto-scan and present ONE confident card for one-tap
   accept; "Rescan" resumes. Re-scan loop preserved (DEC-052).
4. **Detection downscale** (supporting) — detect corners on a downscaled frame, warp from
   full-res, to raise effective FPS (more votes) and steady the quad.

All thresholds live in one `scan/tuning.ts` so the manual validation gate can calibrate
without touching logic.

## Slice 1 — Temporal stabilizer (pure, TDD)

**New:** `apps/frontend/src/lib/scan/stabilizer.ts` + `stabilizer.test.ts`

Pure, framework-free. Operates on engine output (`Candidate[]` = `{card_id, distance}`)
so it is trivially unit-testable with synthetic sequences (no camera, no decode).

```ts
type StabilizerConfig = {
  windowSize: number;      // frames retained (default 6)
  minVotes: number;        // top-1 agreement needed to lock (default 4)
  lockDistance: number;    // best.distance must be ≤ this to count a vote (default 78)
  marginMin: number;       // best must beat next DISTINCT card by ≥ this (default 10)
};
type StabilizerState =
  | { phase: "searching"; topCardId: string | null; votes: number }
  | { phase: "locked"; cardId: string; bestDistance: number };

class ScanStabilizer {
  push(candidates: Candidate[]): StabilizerState
  reset(): void
}
```

Rules:
- A frame casts a vote for `candidates[0].card_id` ONLY if `best.distance ≤ lockDistance`
  AND `(secondDistinct.distance - best.distance) ≥ marginMin`. Otherwise it votes for
  "none" (still consumes a window slot, so noise dilutes rather than accumulates).
- Maintain the last `windowSize` votes. If any single `card_id` holds `≥ minVotes` of the
  window, emit `locked` for that id (best distance = min over its winning frames).
- Once locked, stay locked until `reset()` (the hook drives reset on accept / rescan).

**Tests (write first):** consistent good frames lock after `minVotes`; pure-noise
sequence never locks; alternating two cards never reaches `minVotes`; a weak-but-correct
stream (distance just over `lockDistance`) does NOT lock; margin failure (two cards within
`marginMin`) does NOT lock; `reset()` clears state.

## Slice 2 — Wire into capture hook + confidence gate + lock UX

**Edit:** `useScanCapture.ts`, `ScanCameraSurface.tsx`, `ZoneCardPicker.tsx`
**New:** `apps/frontend/src/lib/scan/tuning.ts`

`tuning.ts` exports the stabilizer config plus:
- `SURFACE_DISTANCE` (default ~85) — gate below which a frame's candidates may be shown as
  the live "searching" hint list (trimmed to top 3). Above it, surface nothing.

`useScanCapture`:
- Hold a `ScanStabilizer` in a ref; `push()` each identify result's `result.candidates`.
- New state: `lockedCandidate: CardMetadataItem | null`, `scanPhase: "searching" | "locked"`.
- On `locked`: resolve the locked `card_id` → `CardMetadataItem`, set `lockedCandidate`,
  set `scanPhase = "locked"` (this drives pausing the camera).
- While searching: only `setResolvedCandidates(...)` when `best.distance ≤ SURFACE_DISTANCE`,
  trimmed to top 3 (live hint, not the source of truth); clear it on weak/no-card frames so
  stale names don't linger (fixes ANALYSIS §3 lingering list).
- Remove the degenerate `resolved.length === 1` auto-accept.
- `acceptCandidate` / `closeScan` / a new `rescan()` all call `stabilizer.reset()` and clear
  `lockedCandidate` / `scanPhase`.

`ScanCameraSurface`:
- Add `paused?: boolean` prop; when paused, the rAF tick does not call `scanCurrentFrame`
  (auto-scan halts on lock, killing the churn). Manual Capture button still works.

`ZoneCardPicker`:
- When `scanPhase === "locked"`: render a single prominent "Locked: <name>" card with
  **Add** (accept) and **Rescan** buttons; hide the ranked list.
- While searching: keep the existing ranked list but it is now confidence-gated + top-3,
  shown as a subdued "possible matches" hint.

## Slice 3 — Detection downscale (supporting, perf/stability)

**Edit:** `detector.ts`

- Add `maxDetectDimension` (default 640) to `detectCard`. Detect corners on a downscaled
  copy of the frame, scale the returned corners back to full-res, then `warpPerspective`
  from the FULL-res frame (preserves hash quality; recipe.ts still owns final resize).
- Keep the existing full-res path behind the same default so geometry tests are unaffected
  (downscale is a no-op when frame ≤ maxDetectDimension).

This raises effective FPS so the stabilizer gets more votes per second and the quad is
steadier. Pure plumbing around existing math; no threshold or engine change.

## Out of scope
- Engine/DCT/warp math, `cardhashes.bin` rebuild, `_card_back` reference (tracked in the
  parent `cardomancer-card-detection-summary` folder), backend/API/prompt — all untouched.

## Verification
```bash
npm --workspace apps/frontend run test -- src/lib/scan/stabilizer
npm --workspace apps/frontend run test -- src/hooks/useScanCapture
npm run quality:check
# Manual (reporter validates): hold a card → list settles → single "Locked: <name>" →
# Add or Rescan. Wrong cards no longer flood; lock is stable.
```

## Calibration note
`minVotes`, `lockDistance`, `marginMin`, `SURFACE_DISTANCE`, `windowSize`,
`maxDetectDimension` are first-pass estimates. They are the knobs to tune during the
reporter's device validation; all isolated in `tuning.ts` / stabilizer defaults.
