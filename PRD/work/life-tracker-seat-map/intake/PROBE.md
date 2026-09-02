# Probe — life-tracker-seat-map

- Date: 2026-09-02
- Question: The reference life-tracker shows each card's commander-damage
  mini-grid as a seat map — "me" at the player's own seat, opponents where they
  physically sit, no two "me" cells overlapping. Our app doesn't. What is the
  actual gap, and what does fixing it (up to 8 players) take?
- Mode: brief
- What ran: inline reads of the life-tracker feature spec + code
  (`seatArrangement.ts`, `PlayerLifeCard.tsx`, `CounterPanel.tsx`), decode of the
  6 owner reference screenshots, and live browser measurement (Playwright MCP) at
  4 / 6 / 8 players — DOM cell order + on-screen bounding boxes.
- Evidence: this folder. `references/` holds the owner reference shots
  (`fullTable.PNG`, `player1..6.PNG`) and the measured before-state
  (`current-4p`… no; `current-default.png` = 4p, `current-6p.png`,
  `current-panel-6p-p1.png`, `current-8p.png`, `current-8p-mobile-overflow.png`).
- Landed: `GRAPH-BRIEF.md` in this folder. Hand off with the command at its foot.
