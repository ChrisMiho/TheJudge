# Slice C — Counter panel joins the full-height overlay family

## Status: planned

## Goal

Give the per-player counter panel the same full-height surface treatment as the Menu tray and
history drawer, removing the dead scrim band above it, without touching counter behavior.

## Requirements

1. The counter panel's surface fills the available shell height instead of sizing to its content,
   and keeps its existing internal scrolling when content exceeds that height.
2. The overlay stops bottom-anchoring its surface. `CounterPanel.tsx:319` currently uses
   `fixed inset-0 flex items-end justify-center … sm:items-center`; `:326` sizes the surface with
   `max-h-[94dvh] w-full max-w-xl overflow-y-auto`.
3. Counter semantics are untouched: the commander-damage matrix, named-counter palette, custom
   counters, tap/hold interactions, the commander-damage→life convenience, and DEC-103 persistence
   all behave exactly as before.
4. Focus trap, Escape-to-close, and reduced-motion behavior carry forward.

## What the defect actually is

Measured live at 430 × 900 with 4 players: the panel renders `414 × 534` at `y=358`, leaving
**358px of dead scrim above it — 40% of the viewport**.

Note the panel already carries `overflow-y-auto` with a `max-h-[94dvh]` cap, and at 4 players
`scrollHeight === clientHeight`. **Nothing is currently cut off.** The `life-tracker-me-map-and-tray`
package described this tray as "height-locked and non-scrollable, cutting off most of the matrix";
that framing was measured and found inaccurate, and that package has been trimmed accordingly. The
real defect is dead space and inconsistency with the suite's other overlays — do not implement a
scrolling fix for a scrolling problem that does not exist.

DEC-134 is direct precedent: it retired exactly this shape for the history drawer, on exactly this
reasoning.

## Acceptance criteria

- [ ] The panel's surface height derives from the available shell/viewport height, not from its
      content
- [ ] No dead scrim band remains above the panel at 2, 4, and 6 players
- [ ] Content taller than the surface still scrolls internally and every opponent cell and control
      remains reachable
- [ ] Commander-damage, named-counter, and custom-counter behavior is unchanged
- [ ] Commander damage still decrements the target player's life
- [ ] Counter values still persist per DEC-103
- [ ] Focus trap and Escape-to-close still work

## Verification

```bash
npm --workspace apps/frontend run test -- CounterPanel
npm --workspace apps/frontend run test -- MtgAssistantApp.player-counters
npm --workspace apps/frontend run test -- PlayerLifeTrackerApp
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx`
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.test.tsx`

## Notes

Presentation only. No new counter types, and no change to DEC-102's additive `GameContext` counter
contract, DEC-103 persistence, or REQ-085's Assistant seed handoff.

The `"me"`-cell seat-map placement problem is **not** in this slice — it remains with
`life-tracker-me-map-and-tray`.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/chrome-hit-areas-and-mid-flight-exits/` ready to delete

## PRD promotion checklist (executed in cleanup, not here)

- [ ] `DEC-137`, `DEC-138`, `DEC-139` bodies and router lines already landed during refinement —
      verify they still match shipped reality
- [ ] `REQ-114` (new) and the `REQ-108` / `REQ-082` amendments match shipped behavior
- [ ] `FLOW-017`'s step 5a and edge cases match shipped behavior
- [ ] `DEC-126`'s stacked-arrangement amendment by `DEC-137` is reflected wherever DEC-126 is cited
- [ ] Flip the relevant `sections/system-map.md` entries to `shipped`
- [ ] Write the receipt at `PRD/instructions/receipts/chrome-hit-areas-and-mid-flight-exits-<YYYY-MM-DD>.md`
- [ ] Confirm `life-tracker-me-map-and-tray`'s trimmed scope is still accurate
