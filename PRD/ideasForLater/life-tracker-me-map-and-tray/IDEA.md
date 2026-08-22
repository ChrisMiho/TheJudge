# life-tracker-me-map-and-tray

On the Player Life Tracker, each card’s commander-damage preview puts the `"me"` cell in roster order inside a centered mini-grid, so the boxes cluster toward the middle of the table, overlap in mental space, and fail to read as a shared seat map. Reference `player-life-tracker-refinement/references/IMG_9504.PNG` shows the intended 4-player pattern: each player’s `"me"` sits in a seat-consistent corner toward the shared table center so the four mini-maps align. At 5+ players the geometry is harder, but no two players’ `"me"` cells may occupy overlapping spatial positions.

The counter panel's tray shape is **no longer in this package's scope.** It moved to
[`chrome-hit-areas-and-mid-flight-exits`](../chrome-hit-areas-and-mid-flight-exits/) during that
package's refinement, which owns it as `DEC-139` (the panel joins the full-height overlay family
established by DEC-133/DEC-134). Two packages must not ship contradictory tray treatments.

For the record, this package's original framing of that problem — "height-locked and
non-scrollable, cutting off most of the matrix" — was measured and found inaccurate: the panel
carries `overflow-y-auto` with a `max-h-[94dvh]` cap, and at 4 players `scrollHeight ===
clientHeight`, so nothing is cut off. The real defect is 358px of dead scrim above the panel at
430 × 900 (40% of the viewport) and inconsistency with the suite's other overlays. `DEC-139`
addresses it on those grounds.

Outcome: IMG_9504-aligned `"me"` placement for 4 players and a non-overlapping placement rule for
higher counts.

Non-goals: no new counter types or mechanics; no change to persistence (DEC-103), the additive `GameContext` counter contract (DEC-102), or the Assistant seed handoff (REQ-085); no auto-KO, multi-device sync, or reopening deferred theming / history / mana / dice scope from the life-tracker refinement package.
