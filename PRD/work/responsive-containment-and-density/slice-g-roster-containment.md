# Slice G — In-Depth roster containment

## Status: done

## Goal

Keep expanded player cards and their secondary controls inside the "Players in game"
panel and the viewport at phone widths (REQ-106, DEC-128 — inherited from the
absorbed `mobile-player-details-overflow` package).

## Requirements

1. Expanded secondary-detail regions (Poison, Energy, Experience, Commander damage,
   named counters) and their player-card chrome stay within the panel's content width.
2. No document-level horizontal scroll is introduced at phone widths.
3. Preferred fix direction is fluid widths, wrapping, and `min-w-0` on flex/grid
   children rather than hiding overflow on the page shell (DEC-128 Notes).
4. `sm+` composition receives only incidental shared safety — no deliberate desktop
   roster redesign.
5. Disclosure semantics, player values, and submitted `gameContext` are unchanged
   (DEC-120, REQ-100).

## Acceptance criteria

- [ ] At 390×844 with secondary details expanded, no descendant of the roster panel
      has `scrollWidth > clientWidth` (baseline defect: row content 322px in a 288px
      box, 34px over; four other nodes 9–22px over)
- [ ] No element inside the panel extends past the panel's right border
      (baseline defect: disclosure ▾ controls 8px past)
- [ ] `documentElement.scrollWidth <= clientWidth` at 390×844 with details expanded
- [ ] Expanding and collapsing still toggles all players together; no mixed
      open/closed state (DEC-120)
- [ ] Player values and submitted `gameContext` are unchanged for unchanged inputs —
      existing `PlayerRosterEditor` and `MtgAssistantApp.player-counters` tests pass
- [ ] `sm+` roster composition is visually equivalent apart from shared shrink/wrap safety

## Verification

```bash
npm --workspace apps/frontend run test -- PlayerRosterEditor MtgAssistantApp
npm run quality:check
```

Playwright MCP at 390×844: In-Depth → expand player details → expand secondary
details → `browser_evaluate` for per-node `scrollWidth` vs `clientWidth`, panel-edge
intersection, and document scroll width, plus a screenshot. Spot-check 1440×900.

## Files touched

- `apps/frontend/src/components/portal/MtgAssistantApp.tsx` (`renderPlayerExtras`)
- `apps/frontend/src/components/PlayerRosterEditor.tsx`
- `apps/frontend/src/components/PlayerRosterEditor.test.tsx`

## Verified (2026-08-05)

Root cause was exactly the direction DEC-128's Notes predicted. The player row is a flex
container whose name column used `flex-1` **without `min-w-0`**; a flex child defaults to
`min-width: auto`, so the name input's intrinsic width acted as a floor and the row could
not shrink to its panel. Adding `min-w-0` to the row and the name column, plus `w-full
min-w-0` on the input, lets the row shrink as designed.

At 390×844 with secondary details expanded:

| Measure | Before | After |
| --- | --- | --- |
| Nodes with `scrollWidth > clientWidth` | 6 (row 322px in a 288px box, 34px over) | **0** |
| Elements past the panel's right border | 2 (disclosure ▾, 8px over) | **0** |
| `documentElement.scrollWidth > clientWidth` | false | false |

- Expand/collapse still toggles all players together; no mixed open/closed state.
- `PlayerRosterEditor` + `MtgAssistantApp` tests 20/20 pass — player values and submitted
  `gameContext` unchanged.
- Change is a shared shrink-safety rule, so `sm+` composition is visually equivalent
  (DEC-128 permits incidental shared safety only).
