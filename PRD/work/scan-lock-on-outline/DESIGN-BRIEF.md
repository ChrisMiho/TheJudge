# DESIGN-BRIEF: scan-lock-on-outline

## Problem

While scanning a card, nothing on the viewfinder tells the user when the camera
is close to a confident match, so they can't easily correct the angle to lock
the card in. The three-state text indicator (DEC-057) reports convergence in
words and the frame-quality "good — hold steady" cue (DEC-074) reports capture
quality, but neither points at the card on-screen — so the user hunts for the
lockable angle blind.

## Outcome

When live scan match confidence crosses into the existing `locking` convergence
state, draw an affirmative outline on the detected card in the viewfinder as a
positive "you're close — hold this angle" alignment cue, helping the user hold
the right angle and complete the match faster.

## Scope / decisions

- **Trigger — reuse the `locking` state (DEC-083).** The outline appears exactly
  when the stabilizer enters the existing `locking` state (a confident leader
  accumulating votes, DEC-057). Additive, pure read of signals that already
  exist — no new confidence threshold and no touch to match-acceptance logic.
- **Draws — clean affirmative outline only (DEC-083).** Just the detector's
  computed 4-corner card outline, styled as a positive/affirmative cue. No text
  metrics and no art-crop read region — those stay exclusive to the opt-in
  developer debug overlay (REQ-041/DEC-060), which remains default-off and
  behaviorally unchanged.
- **Presentation — static affirmative outline (DEC-083).** Steady
  affirmative-colored outline consistent with scanner UI theming (DEC-068),
  reduced-motion-safe by construction; any optional subtle emphasis stays within
  the NFR-006 CSS-only, `prefers-reduced-motion`-aware carve-out with no
  animation library.
- **Always-on during scan, no control (DEC-083).** No toggle, setting, or mode;
  the cue appears automatically on `locking` and clears on `searching`/lock
  completion. Adds no new scan-screen control and must not overlap the top-right
  scanned-cards review/remove hit area (DEC-065).
- **Reuses geometry, not the overlay.** Reuses the DEC-060 detector-corner
  geometry mechanism; it does not make the developer debug overlay a permanent
  feature. This cue is the always-on, user-facing, single-purpose subset
  (outline only), which is why it does not reopen DEC-057's removal of always-on
  raw status leaks.
- **Graceful degrade (DEC-060 precedent).** If the detector corners cannot be
  cheaply threaded to the camera surface while the debug overlay is off, the
  outline simply does not draw and the three-state text indicator still
  communicates `locking`; map-out confirms the corner wiring rather than the
  feature blocking on it.

## Non-goals (frozen boundaries)

- No change to the fingerprint/matching algorithm or its match-acceptance
  thresholds (the IDEA non-goal) — trigger off the existing `locking` state only.
- No change to the shared resize+DCT+hash recipe (`recipe.ts`), `cardhashes.bin`,
  the matching/orientation/distance logic (`identify.ts`), the stabilizer lock
  gate (`lockDistance`/`marginMin`, DEC-059), or the DEC-051/REQ-034 parity gates.
- Not exposing the full developer debug overlay as a permanent feature — it stays
  opt-in, default-off (DEC-060/REQ-041).
- No new scan mode, toggle, or setting.
- Frontend-only, zero scan-time network calls; no change to `AskAiRequest`, Zod
  schemas, `GameContext`, prompt assembly, the provider boundary, or any
  product-facing endpoint.

## PRD references

- **New product truth**
  - `DEC-083` — `PRD/sections/decisions/scanning.md` (+ router index line in
    `PRD/sections/decisions.md`)
  - `REQ-062` — `PRD/sections/functional-requirements.md`
- **Refined**
  - `FLOW-006` step 3 — `PRD/sections/user-flows.md` (locking outline cue)
  - `system-map.md` "Scan lock-in control layer" — planned note + Backed by
- **Reused / referenced**
  - `DEC-057` (three-state convergence indicator, `locking` trigger)
  - `DEC-060` / `REQ-041` (detector-corner geometry mechanism; opt-in debug overlay)
  - `DEC-059` (lock gate held), `DEC-065` (control-area no-overlap),
    `DEC-068` (scanner palette theming), `DEC-073` (static alignment reticle,
    distinct from this cue)
  - `NFR-006` (CSS-only, reduced-motion-aware motion), `NFR-010` (scan perf budget)

## Likely implementation surface (for map-out; not prescriptive)

- `apps/frontend/src/components/ScanCameraSurface.tsx` — draw the affirmative
  outline from detector corners, gated to the `locking` state
- `apps/frontend/src/hooks/useScanCapture.ts` — pair the current corners with the
  `locking` state for the surface (additive, pure)
- `apps/frontend/src/lib/scan/{stabilizer,detector}.ts` — read existing signals;
  additive/pure only if any new field is needed
- reuse the corner-drawing already built for `ScanDebugOverlay.tsx` rather than
  duplicating geometry rendering

## Open questions

None. The three product forks (trigger, what's drawn, presentation) are resolved
above; exact affirmative color and any subtle emphasis are outcome-validated
presentation calibration (DEC-052/DEC-068 precedent), not product open questions.
