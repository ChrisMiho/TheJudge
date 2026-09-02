# Handoff — life-tracker-seat-map (PR #182 fix is WRONG on "me" placement; rework, do not merge)

**Read `GRAPH-RUN.md` (`## Open gate`, `## Node ledger`) and this file.**

## The corrected requirement (owner, 2026-09-02 — supersedes the compact-corner detour)

The on-card commander-damage mini-grid must be a **per-seat map**: **"me" sits at
each player's OWN seat — a DIFFERENT position on every card — and in the CORRECT
spot** matching where that player actually sits, with opponents in their real
directions. This is shown in BOTH reference images:
`intake/references/fullTable.PNG` (grid) and `intake/references/fullTableList.PNG`.
It must ALSO stay compact and contained on the card (the original bug was it going
tall / overflowing, worst in list mode and on the full-width head-seat cards).

## What went wrong

- The owner's real ask, from the start, was the seat map (me at own seat,
  opponents in their directions) — just fixed so it stays contained instead of
  going vertical/off-screen, and with the positions correct ("fix the order
  displayed").
- The driver's `AskUserQuestion` ("compact & horizontal") showed a preview with
  **"me" pinned to a fixed top-left corner**. The owner picked it for the SHAPE
  (horizontal, not tall) but did not intend to drop per-seat placement. The build
  then implemented `buildCompactSeatMapCells` with **"me" at a fixed corner on
  every card** (slice-B criterion B4 literally: "me at a fixed corner") — which is
  NOT what the owner wants.
- Net: **PR #182 puts "me" in the same corner on every card. Do NOT merge it.**
  The earlier arrangement-miniature design (me at own seat) was actually closer to
  the intent; it just needed containment fixed, not the seat placement removed.

## The rework (next session)

This is a new issue on active work → use **`thejudge-amend`**, not graph-close.

1. Restore per-seat "me" placement: each card's map places "me" at that player's
   own seat coordinate and each opponent at their seat (the arrangement-miniature
   behavior), NOT a fixed corner. Get the positions CORRECT (the "order displayed"
   nuance) — verify against `fullTable.PNG` / the `player1..6.PNG` references.
2. Keep it CONTAINED: the map + name pill must fit inside the card at 2–8 in both
   grid and list layout without going tall/off-screen (the original bug). The
   target `fullTable.PNG` shows this is achievable (compact ~3×2 blocks with me at
   own seat) — the challenge is doing the same in list mode and on the full-width
   head-seat cards.
3. Re-verify LIVE on the Mac (`localhost:5173`, hard-refreshed) at 6 AND 8 players,
   grid AND list — check both the per-seat "me" positions and containment.

## State

- Launch checkout on branch `thejudge-auto/life-tracker-seat-map-work`
  (`STATUS.owner-action`, parked ledger). Dev stack stopped, ports free.
- PR #182 open, **do NOT merge** (wrong "me" placement). It can be reused as the
  branch to push the corrected on-card map onto, or closed and redone.
- Target reference: `intake/references/fullTable.PNG` and `fullTableList.PNG` (both
  show me-at-own-seat). Do NOT treat fixed-corner as correct.
