# life-tracker-me-map-and-tray

On the Player Life Tracker, each card’s commander-damage preview puts the `"me"` cell in roster order inside a centered mini-grid, so the boxes cluster toward the middle of the table, overlap in mental space, and fail to read as a shared seat map. Reference `player-life-tracker-refinement/references/IMG_9504.PNG` shows the intended 4-player pattern: each player’s `"me"` sits in a seat-consistent corner toward the shared table center so the four mini-maps align. At 5+ players the geometry is harder, but no two players’ `"me"` cells may occupy overlapping spatial positions.

Separately, opening commander damage / counters on mobile leaves the bottom tray height-locked and non-scrollable, cutting off most of the matrix. The sheet should grow upward and scroll so every opponent cell and control is reachable.

Outcome: IMG_9504-aligned `"me"` placement for 4 players, a non-overlapping placement rule for higher counts, and a mobile tray that expands and scrolls to expose full content.

Non-goals: no new counter types or mechanics; no change to persistence (DEC-103), the additive `GameContext` counter contract (DEC-102), or the Assistant seed handoff (REQ-085); no auto-KO, multi-device sync, or reopening deferred theming / history / mana / dice scope from the life-tracker refinement package.
