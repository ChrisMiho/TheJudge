# Slice B evidence

## B1 grep dispositions

Command: `grep -rnE "left-0|right-0|top-0|bottom-0|Decrease life" apps/frontend/src`

| Hit | Disposition |
| --- | --- |
| `App.player-life-tracker-flow.test.tsx:114` Decrease life Player 1 (accessible-name click) | Keep. Asserts no edge; the name lookup is unchanged. |
| `FeaturePortalMenu.tsx:346` `fixed left-0 top-0` | Keep. Unrelated menu positioning. |
| `PlayerLifeCard.test.tsx:85,110,250,324` Decrease name lookups | Keep. Name lookups only. |
| `PlayerLifeCard.test.tsx:267-268,284-285` list foot/head halves | Keep. Head and foot are unchanged by REQ-217. |
| `PlayerLifeCard.test.tsx:302-303,318-319` grid top/bottom seats | Updated in slice A. Per-seat near-edge assertions. |
| `PlayerLifeCard.test.tsx:327-330` per-side table | Updated in slice A. Grid near-edge per side. |
| `PlayerLifeCard.test.tsx:369-370` list right-of-pair mirror | Added in slice A. |
| `PlayerLifeTrackerApp.test.tsx:198-200` list Players 3/1/2 | Keep, comment rewritten. Head right, foot left, left-of-pair left still hold. |
| `PlayerLifeTrackerApp.test.tsx:201` (new) Player 4 right-of-pair | Added: `−` right-0 asserts the mirror. |
| `PlayerLifeTrackerApp.test.tsx:235,249` Decrease name clicks | Keep. Name lookups only. |
| `PlayerLifeCard.tsx:74-87` half class maps | Source, not a test. Slice A. |
| `PlayerLifeCard.tsx:208` aria-label | Source. Unchanged. |

No test asserts the old fixed grid split or the un-mirrored pair split.
`App.player-life-tracker-flow.test.tsx` needed no edit (it clicks by name only).

## Defect found and fixed during the live check

The half button base class carried `items-center`, which beat `items-start` / `items-end`
in the stylesheet. Top and bottom halves therefore centred their glyph in the half instead of
pinning it to the edge, so on 2-3 player grid the `−` landed on the commander preview and the
`+` on the name pill. Fix: `items-center` moved from the shared base onto the left/right
classes in both class maps (`PlayerLifeCard.tsx`). Re-measured after the fix: no glyph overlap
with any card content in grid or list at 2/3/4/6/8 on both viewports, except the phone note below.

## Observations

2026-10-04 B4 — Grid 2/3/4/6/8 at 390x844 and 1280x800 measured live: every seat's `−` sits on its near edge (bottom/top seats for 2-3p, outer left/right for 4-8p), `+` on the far edge. Phone table fits (scrollHeight 844 = viewport). Desktop table bottom is 792 of 800 (fits); the page shell adds 16px of page scroll (816) that is identical at every count and layout and is outside the table, so it is not caused by this change. Captures: `.playwright-mcp/grid-<n>p-<w>x<h>.png`.
2026-10-04 B4 — Grid gutter check, 2-3p upright seats: before the fix the ± sat mid-half and collided with the commander preview and name pill; after the fix they pin to the card edge with no overlap at 2p/3p on both viewports. Phone 6p/8p: the inner-edge `+` just touches the rotated name pill's edge at 390 wide (bounding boxes meet, glyph readable); same geometry as before for the left column, now also on the right column. Noted for the owner, not changed.
2026-10-04 B5 — List 2/3/4/6/8 at both viewports: head `−` right and foot `−` left (unchanged), left-of-pair `−` left, right-of-pair `−` right, so each middle-pair player's `−` is on their own outer side. Fits the same as grid; no glyph overlap.
2026-10-04 B6 — Live on the 4p grid at 390x844, tapping the `−` glyph: Player 3 went 40 to 39 with Player 1 unchanged; Player 1 went 40 to 39; `+` on Player 3 returned it to 40. Inner controls still take their own taps: "Set life for Player 1" opens the inline input and "Open counters for Player 1" opens the counter dialog, neither changes life.
2026-10-04 B7 — Cleanup: browser closed (`browser_close`), owned dev server (vite on port 5391, background task) stopped, `lsof -iTCP:5391` shows nothing listening, captures under `PRD/work/life-tracker-seat-oriented-default/.playwright-mcp/` (20 grid/list screenshots plus an inner-controls capture, plus Playwright snapshot logs).
