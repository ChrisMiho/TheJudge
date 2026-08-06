# Slice G — In-Depth player-details alignment

## Status: done

## Goal

Fix the expanded secondary-player-details box's alignment relative to its owning
player row/card, on both phone and desktop viewports (REQ-106, DEC-128 —
containment itself already shipped and stays intact).

## Requirements

1. Reproduce and measure the alignment defect at 390×844 and 1440×900 before
   changing code (per `HANDOFF.md`'s working rules) — the prior pass fixed
   horizontal overflow (`min-w-0` shrink-safety) but product-owner review of PR
   #75 found the expanded panel itself misaligned relative to its player row,
   which is a distinct defect from overflow.
2. The expanded secondary-detail region (`renderPlayerExtras` output, rendered in
   `PlayerRosterEditor.tsx`'s `id={secondaryRegionId}` sibling div) must visually
   align to its owning player card's chrome — not floating, offset, or reading as
   detached from the row above it — at **both** viewports.
3. Preferred fix direction stays fluid widths / wrapping / `min-w-0` on flex/grid
   children (DEC-128 Notes), not shell-level `overflow-x-hidden`.
4. Containment already shipped in the first pass must not regress: no descendant
   of the roster panel gets `scrollWidth > clientWidth`, and no element extends
   past the panel's right border.
5. Disclosure semantics, player values, and submitted `gameContext` are unchanged
   (DEC-120, REQ-100) — this slice is presentation-only.
6. `sm+` composition may receive incidental shared alignment fixes but this is not
   a deliberate desktop roster redesign.

## Acceptance criteria

- [ ] At 390×844 with secondary details expanded, no descendant of the roster
      panel has `scrollWidth > clientWidth`, and no element extends past the
      panel's right border (regression check on the shipped fix)
- [ ] `documentElement.scrollWidth <= clientWidth` at 390×844 with details expanded
      (regression check)
- [ ] At 1440×900 with secondary details expanded, the expanded details region is
      horizontally contained **and** visually aligned to its owning player
      card/row — not offset or floating incorrectly (new: this is the defect this
      slice closes)
- [ ] At 390×844, the same alignment property holds — the expanded region reads as
      belonging to its player row, not detached
- [ ] Expanding and collapsing still toggles all players together; no mixed
      open/closed state (DEC-120)
- [ ] Player values and submitted `gameContext` are unchanged for unchanged inputs
      — existing `PlayerRosterEditor` and `MtgAssistantApp.player-counters` tests
      pass
- [ ] `sm+` roster composition is visually equivalent apart from the alignment fix
      and shared shrink/wrap safety

## Verification

```bash
npm --workspace apps/frontend run test -- PlayerRosterEditor MtgAssistantApp
npm run quality:check
```

Playwright MCP at 390×844 and 1440×900: In-Depth → expand player details → expand
secondary details → `browser_evaluate` for the secondary-details region's bounding
box relative to its player card's bounding box (left/right edge alignment), plus
`scrollWidth`/`clientWidth` regression checks, plus screenshots. Call
`browser_close` when finished.

## Files touched

- `apps/frontend/src/components/portal/MtgAssistantApp.tsx` (`renderPlayerExtras`)
- `apps/frontend/src/components/PlayerRosterEditor.tsx`
- `apps/frontend/src/components/PlayerRosterEditor.test.tsx`

## Prior pass (2026-08-05) — containment fixed, carried forward as regression bar

Root cause was the player row's `flex-1` name column lacking `min-w-0`, so the
name input's intrinsic width floored the row wider than its panel (322px in a
288px box). Adding `min-w-0` to the row, the name column, and the input resolved
all six overflow nodes and the two out-of-bounds disclosure controls; 20/20
roster tests passed. That fix must not regress while this slice adds the
alignment fix on top of it.
