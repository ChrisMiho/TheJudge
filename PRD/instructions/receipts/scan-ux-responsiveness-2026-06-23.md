# Cleanup receipt — scan-ux-responsiveness

- **Date:** 2026-06-23
- **Slug:** `scan-ux-responsiveness`
- **Status:** shipped
- **Verification:** `npm run quality:check` green (Slice E run, 2026-06-23) — frontend 294/294, backend 218/218; typecheck + lint + format:check + coverage all pass (EXIT=0). No-change boundary diff-reviewed: no `apps/backend`/Zod-schema/`GameContext`/prompt/provider/route files touched; detector/stabilizer edits additive only (no hash/distance math changed).

## Summary

Refines the shipped card scanner into a hands-free experience: a high-confidence lock **auto-adds**
the card and resumes scanning (no Accept tap, no candidate-list pick), a live
`searching`/`locking on: <name>`/`locked` indicator shows convergence, each add fires a CSS-only
thumbs-up popup, and a wrong auto-add is removable in one tap from a top-right review bubble
(Round 1, slices A–D). Round-1 device validation produced **zero wrong auto-adds but the strict gate
was too hard to lock**, which triggered DEC-059. Round 2 (Wave R2-1) **loosened the lock gate** toward
ease-of-lock (slice F, `tuning.ts` only) and added an opt-in **scanner debug overlay** (slice G,
DEC-060 / REQ-041). Slice E (Wave R2-2) re-validated on a **webcam** (2026-06-23): the looser gate is
observably easier to lock and the overlay renders correctly.

**Product decision (user, 2026-06-23):** ship this package **as-is** with the first-pass loosened
constants (`windowSize 6 / minVotes 4 / lockDistance 78 / marginMin 14`) as the validated baseline —
one-tap removal (DEC-058) is the safety net — and carry **finer tuning + on-device (mobile/intended)
validation into a new dedicated tuning story** (see Deferred below).

## Actions taken

- [x] Verified all slice acceptance criteria (A–G) against the codebase; ran the ship checklist
- [x] Confirmed `quality:check` green for touched areas (Slice E run); no secrets; public contract unchanged
- [x] Promoted durable outcomes to `sections/system-map.md` (catalog truth); DEC-056–060 / REQ-040 / REQ-041 / FLOW-006 already authored in the catalog during refinement
- [x] Wrote this receipt
- [x] Applied the system-map promotion gate — folded the "Planned refinement" notes into the shipped summaries for **Scan lock-in control layer** and **Scan UX in zone picker**, and added a new **Scanner debug overlay** entry (Status: shipped)
- [x] Deleted `PRD/work/scan-ux-responsiveness/`

## Durable outcomes promoted

System-map (`PRD/sections/system-map.md`) — shipped reality flipped per the gate (catalog-only signal; `DEC`/`REQ` `Status:` fields unchanged):

- **Scan lock-in control layer** — summary now reflects hands-free auto-add, the additive/pure progress signal (leader id + votes + `bestDistance`/`runnerUpDistance`/`margin`), and the DEC-059 ease-of-lock rebalance with the shipped baseline constants (`6 / 4 / 78 / 14`, `marginMin` guard retained). Backed-by extended to REQ-040, DEC-056/057/059.
- **Scan UX in zone picker** — summary now reflects hands-free auto-add (no Accept tap / no list-pick), the `searching`/`locking`/`locked` indicator, the CSS-only thumbs-up popup, the top-right review bubble with one-tap removal, and non-blocking duplicate/limit notices. Backed-by extended to REQ-040, DEC-056/057/058; `ScanReviewBubble.tsx` + `index.css` added to locations.
- **Scanner debug overlay** (new entry) — opt-in, default-off, resets on open; detected-card outline (from `detectCard` `corners`) + art-crop read region + text metrics; read-only; degrades to text if geometry unavailable. Backed by REQ-041, DEC-060.

(DEC-056, DEC-057, DEC-058, DEC-059, DEC-060, REQ-040, REQ-041, and FLOW-006 were authored in the
catalog during refinement; this cleanup did not re-edit them beyond the system-map promotion.)

## Files created

- `PRD/instructions/receipts/scan-ux-responsiveness-2026-06-23.md` (this receipt)

Product code (shipped during the work package, untracked at cleanup time):
- `apps/frontend/src/components/ScanDebugOverlay.tsx` (+ `ScanDebugOverlay.test.tsx`) — opt-in overlay (slice G)
- `apps/frontend/src/components/ScanReviewBubble.tsx` — top-right scanned-cards review bubble (slice D)
- `apps/frontend/src/components/ScanCameraSurface.test.tsx`, `apps/frontend/src/components/ZoneCardPicker.test.tsx` — added coverage

## Files updated

Durable PRD docs (this cleanup):
- `PRD/sections/system-map.md` — Scan lock-in control layer + Scan UX in zone picker summaries promoted to shipped reality; new Scanner debug overlay entry added

Product code (shipped during the work package):
- `apps/frontend/src/lib/scan/stabilizer.ts` (+ `stabilizer.test.ts`) — additive pure progress signal + `bestDistance`/`runnerUpDistance`/`margin` (slices A, G)
- `apps/frontend/src/lib/scan/tuning.ts` — lock gate loosened to `6 / 4 / 78 / 14` (slices A, F; finalized as-is in E)
- `apps/frontend/src/lib/scan/detector.ts` — full-res `corners` surfaced additively for the overlay (slice G)
- `apps/frontend/src/hooks/useScanCapture.ts` (+ `useScanCapture.test.ts`) — auto-add on lock + non-blocking notices + convergence/debug view-model (slices B, G)
- `apps/frontend/src/components/ScanCameraSurface.tsx` — convergence indicator + debug toggle (slices C, G)
- `apps/frontend/src/components/ZoneCardPicker.tsx` — single leader hint, raw-status removal, review bubble wiring (slices C, D)
- `apps/frontend/src/components/ZoneCollectionStep.tsx` — auto-add + review-bubble threading (slices B, D)
- `apps/frontend/src/index.css` — CSS-only thumbs-up popup keyframes (slice C)
- `apps/frontend/src/App.zoneFlow.test.tsx` — updated flow assertions for auto-add

## Files deleted

- `PRD/work/scan-ux-responsiveness/` (`README.md`, `IDEA.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`, `slice-a..g-*.md`)

## Deferred (tracked, not blockers — carried to a new dedicated tuning story)

- **Finer tuning** of the loosened lock gate beyond the first-pass `6 / 4 / 78 / 14` baseline.
- **On-device (mobile / intended-condition) validation** — Slice E was validated on a webcam (adverse-ish
  path) only; phone-with-card-presented validation and NFR-010 device metrics were not separately recorded.
- **Audio "ding" confirmation + mute toggle** — already split out to `PRD/work/scan-audio-confirmation/`.
