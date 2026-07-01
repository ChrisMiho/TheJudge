# GAMEPLAN: scan-lock-on-outline

Implements **DEC-083 / REQ-062**. Source of truth: [DESIGN-BRIEF.md](./DESIGN-BRIEF.md).

## Problem recap

While scanning, nothing on the viewfinder points at the card when the camera is
close to a confident match. The three-state text indicator (DEC-057) reports
`searching`/`locking`/`locked` in words and the frame-quality "good — hold steady"
cue (DEC-074) reports capture quality, but neither draws on the card, so the user
hunts for the lockable angle blind.

## Approach

Draw an affirmative 4-corner outline on the detected card in the viewfinder **only
while the stabilizer is in the existing `locking` state**. Pure read of signals that
already exist:

- The `locking` state is already exposed to the surface as `convergence.phase`
  (`useScanCapture` → `ScanCameraSurfaceProps.convergence`).
- The detector already computes the card's 4-corner quad every frame for the warp;
  `detectCard`'s optional `onCorners(corners)` callback returns the exact
  canonical-oriented full-res quad the warp consumes and costs only one extra
  `orientCardQuad` on corners already in hand (`detector.ts:882,888`).

No new confidence threshold, no match-acceptance change, no toggle. The outline is
the always-on, user-facing, **outline-only** subset of the DEC-060 debug geometry —
the debug overlay's art-crop read region and text metrics stay exclusive to that
opt-in, default-off overlay.

## Feasibility — corner wiring confirmed (the brief's one open item)

`ScanCameraSurface.scanCurrentFrame` today only passes `onCorners` and only sets
corner/frame state **when the debug overlay is enabled** (`ScanCameraSurface.tsx:254-286`).
The DEC-083 cue must draw with the overlay **off**. Confirmed cheap and feasible:

- `detectCardCorners` + `warpPerspective` already run every frame regardless of
  debug; `onCorners` adds only `orientCardQuad(corners)` (a 4-point reorder). So
  surfacing the quad is effectively free — no extra detection cost, NFR-010 safe.
- The only real per-frame cost is the **React state update** that triggers the SVG
  render. We gate that to the locking window: capture corners into a ref every frame
  (cheap, no render), and push corner *state* (which re-renders the outline) only
  while `convergence.phase === "locking"`; clear once on the transition out. With the
  overlay off and phase `searching`, there is zero added re-render vs. today.
- The `locking` phase is computed by the hook after `identify()` runs on the same
  frame whose corners we captured, so pairing the latest captured corners with the
  incoming `locking` phase is correct within the auto-scan cadence (~4fps). A static
  outline tolerates the at-most-one-frame settle.
- **Graceful degrade (kept):** if for any reason corners are absent for a `locking`
  frame, the outline simply does not draw and the text indicator still shows
  `Locking on <name>` — the feature degrades, never blocks (DEC-060 precedent).

## Data flow

```
detectCard(frame, { …, onCorners })         // B: always capture the oriented quad → cornersRef (cheap)
  → useScanCapture: stabilizer.push(...)      // (unchanged) computes convergence.phase
      → convergence.phase === "locking"       // existing signal, passed to the surface as a prop
          → ScanCameraSurface                 // B: push cornersRef → lockOutline state ONLY while locking
              → ScanCardOutline (SVG polygon) // A: affirmative outline-only renderer, reduced-motion-safe
  → phase leaves "locking" (searching / lock auto-adds → reset) // B: clear the outline
```

## Reuse

- **Outline rendering** is extracted from `ScanDebugOverlay` into a small shared
  presentational component `ScanCardOutline` (viewBox + `preserveAspectRatio` +
  `mapToQuad`-free single polygon). The debug overlay is refactored to consume it for
  its detected-card polygon with **no behavior change** (same sky stroke, still draws
  its read-region + metrics). The lock cue consumes the same component with an
  affirmative (emerald) variant — this is the "reuse the corner drawing rather than
  duplicating geometry" requirement in the brief.
- **Affirmative color** follows the existing scanner-theming precedent: the searching
  "Good — hold steady" in-zone cue already uses `emerald` (`ScanCameraSurface.tsx:389,435`).
  Exact shade is outcome-validated presentation calibration (DEC-052/DEC-068), not a
  product question.

## Frozen boundaries (must not change)

`recipe.ts`, `cardhashes.bin`, `identify.ts`, the stabilizer lock gate
(`lockDistance`/`marginMin`, DEC-059), the DEC-051/REQ-034 parity gates, the detector's
detection/warp behavior, `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly,
the provider boundary, and any product-facing endpoint. Zero scan-time network calls.
The opt-in debug overlay (DEC-060/REQ-041) stays default-off and behaviorally unchanged.

## Slices

| Slice | Objective | Depends on |
| --- | --- | --- |
| A | Shared affirmative card-outline renderer (`ScanCardOutline`); refactor `ScanDebugOverlay` to consume it with no behavior change | — |
| B | Always-on locking outline in `ScanCameraSurface`: cheap per-frame corner capture, `locking`-gated draw via the Slice A renderer, clear on `searching`/lock-complete | A |

A is a pure presentational extraction and leaves the build green on its own. B wires
the feature and imports A's renderer (stated blocker → sequential). B is the final
slice and carries the PRD-promotion checklist + ship gates.

## Verification checklist

- [ ] `ScanCardOutline` renders the affirmative polygon from a 4-corner quad + frame
      dims; renders nothing when corners are absent/incomplete (degrade).
- [ ] `ScanDebugOverlay` behavior unchanged: overlay off by default, still draws its
      sky outline + pink read region + metrics when enabled (existing test green).
- [ ] With the overlay **off**, the outline draws while `convergence.phase === "locking"`
      and does not draw while `searching`; it clears when phase leaves `locking`
      (searching return and lock/auto-add reset).
- [ ] The cue draws the outline only — no read region, no text metrics — outside the
      top-right scanned-cards review/remove hit area (DEC-065).
- [ ] No new scan-screen control; no toggle/setting/mode.
- [ ] Reduced-motion-safe: no animation library; any emphasis is CSS-only under the
      NFR-006 `prefers-reduced-motion` carve-out.
- [ ] Frozen boundaries untouched: no diff to `recipe.ts`, `identify.ts`,
      `cardhashes.bin`, the stabilizer lock gate, or the provider/prompt path.
- [ ] `npm run quality:check` green for touched areas.
```
