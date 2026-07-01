# Slice B — Always-on locking outline in ScanCameraSurface

## Status: planned

## Goal

Draw the affirmative card outline (Slice A `ScanCardOutline`) on the detected card in
the viewfinder whenever `convergence.phase === "locking"`, reading the detector's
already-computed corners with the debug overlay **off**, and clear it on `searching`
and on lock-complete/auto-add. No new control, no toggle, no match-logic change.

**Depends on Slice A** (renders through `ScanCardOutline`).

## Requirements

1. In `ScanCameraSurface.scanCurrentFrame`, always request the detector corners via
   `detectCard`'s `onCorners` (not gated on `debugEnabledRef`) and store the oriented
   quad + native frame dims into refs. This adds only one `orientCardQuad` per detected
   frame (`detector.ts:882,888`) — no extra detection cost, NFR-010 safe. The existing
   debug-only diagnostic construction and `setDebugCorners`/`setDebugFrame`/diagnostic
   state remain gated behind `debugEnabledRef` and behaviorally unchanged.
2. Add a `lockOutline` state (`{ corners, frameWidth, frameHeight } | null`). Read the
   incoming `convergence.phase` via a ref. Push the captured corners into `lockOutline`
   **only while phase is `locking`**; set it to `null` once when phase leaves `locking`.
   With the overlay off and phase `searching`, this causes **zero** added re-render vs.
   today (no per-frame state set while not locking).
3. Render `ScanCardOutline` with the `affirmative` variant from `lockOutline`, inside
   the existing `pointer-events-none` viewfinder layer, positioned so it does **not**
   overlap or intercept the top-right scanned-cards review/remove hit area (DEC-065)
   or the left-column status/mute/debug controls. Draw only when `lockOutline` is set.
4. The outline draws the card outline **only** — not the art-crop read region and not
   any text metrics (those stay exclusive to the opt-in debug overlay, REQ-062/DEC-060).
5. Clear on lock completion: when the hook auto-adds and resets (`convergence` returns
   to `searching`/initial), the `locking`-gated logic in req 2 already clears the
   outline. Verify no stale outline persists after auto-add or after `closeScan`.
6. Graceful degrade: if a `locking` frame has no captured corners (e.g. detector
   returned no quad that frame), draw nothing; the `Locking on <name>` text indicator
   still communicates state (DEC-060 degrade precedent).

## Acceptance criteria

- [ ] With the debug overlay **off**, the affirmative outline renders while
      `convergence.phase === "locking"` with corners present, and does **not** render
      while `searching`.
- [ ] The outline clears when phase leaves `locking` — both on drop back to `searching`
      and on lock-complete/auto-add reset — and after `closeScan` (no stale outline).
- [ ] No read region and no text metrics are drawn by the cue; the debug overlay stays
      default-off and its behavior/tests are unchanged.
- [ ] No new scan-screen control, toggle, setting, or mode is added; the cue does not
      overlap or intercept the top-right review/remove hit area (DEC-065).
- [ ] Corners are surfaced additively/purely: no change to detection/warp behavior, the
      stabilizer distance/confidence/margin logic, or the lock gate
      (`lockDistance`/`marginMin`, DEC-059).
- [ ] Degrade: a `locking` state with absent corners draws no outline and does not throw;
      the text indicator still shows `Locking on <name>`.
- [ ] Reduced-motion-safe (no animation library; any emphasis CSS-only under NFR-006).
- [ ] `ScanCameraSurface.test.tsx` extended (not replaced) to cover locking-draw,
      searching-no-draw, clear-on-reset, and outline-only (no read region) behavior.

## Verification

```bash
npm --workspace apps/frontend run test -- src/components/ScanCameraSurface
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/ScanCameraSurface.tsx`
- `apps/frontend/src/components/ScanCameraSurface.test.tsx`
- (import only) `apps/frontend/src/components/ScanCardOutline.tsx` from Slice A

## PRD promotion checklist (execute in thejudge-cleanup)

- [ ] `sections/system-map.md` "Scan lock-in control layer" — flip the DEC-083/REQ-062
      locking-outline note from **Planned** to **shipped** (ship gate: code wired **and**
      receipt written). Existing `Backed by` already lists REQ-062/DEC-083.
- [ ] Confirm `DEC-083` (`sections/decisions/scanning.md`), its router line in
      `sections/decisions.md`, `REQ-062` (`sections/functional-requirements.md`), and
      `FLOW-006` step 3 (`sections/user-flows.md`) match shipped reality; adjust only if
      the implementation diverged.
- [ ] Write receipt `PRD/instructions/receipts/scan-lock-on-outline-<YYYY-MM-DD>.md`.
- [ ] Delete `PRD/work/scan-lock-on-outline/`.

## Ship gates

- [ ] Slice A + B acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged (frontend-only; no `AskAiRequest`/schema/prompt/provider change)
- [ ] Frozen scan boundaries untouched (`recipe.ts`, `identify.ts`, `cardhashes.bin`, lock gate, parity gates)
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/scan-lock-on-outline/` ready to delete
```
