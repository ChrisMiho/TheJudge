# Handoff — life-tracker-seat-map (owner was viewing OLD code; fix is in unmerged PR #182)

**Read `GRAPH-RUN.md` (`## Open gate`, `## Node ledger`) and this file.**

## Where the run is

- Build half completed under the compact-horizontal re-scope (run
  `graph-20260902-121645`): gate-qc → plan → build → review (APPROVE). Code PR
  **#182** (`thejudge-auto/life-tracker-seat-map-work` → `main`) is open, parked
  at `land` (`STATUS.owner-action`). NOT merged, NOT deployed.
- The fix: the on-card commander-damage preview uses a new
  `buildCompactSeatMapCells` (rows = 2 always, columns = ceil(N/2), **"me" at a
  fixed corner**). Passed unit tests + slice-D live checks at 7/8 players on the
  Mac dev server.

## The owner reported "issue remains" — but was looking at OLD code

- Evidence: `intake/references/fullTableList.PNG` (6-player **iPhone**
  screenshot the owner supplied; earlier dropped as `IMG_0028.PNG`).
- **It is old code, provable from the image:** on it, "me" sits at a DIFFERENT
  position on each card (mid-left on Player 3, mid-right on Player 5, …) — i.e.
  each player's OWN seat, in a 3×2 tall block. That is the OLD arrangement-
  miniature. The fix puts "me" at a FIXED corner in a 2-row block on every card.
  So this screenshot is pre-fix.
- **Why:** PR #182 is unmerged/undeployed. The fix runs only on the Mac
  `localhost:5173` dev server. The owner reviewed on their **phone** (deployed/
  hosted app), which a Mac-localhost dev server can't serve. The fix was never
  actually on screen for them.

## Continue — pick the path

1. **See the fix before merging (recommended):** on the Mac, view it at
   `localhost:5173`, hard-refreshed. To run it:
   `git checkout origin/thejudge-auto/life-tracker-seat-map-work` (detached, PR
   head) → `npm run dev` → open `http://localhost:5173` → Cmd+Shift+R. Return with
   `git checkout thejudge-auto/life-tracker-seat-map-work`. (To view on the phone
   instead, either merge+deploy, or expose the dev server on the LAN with vite
   `--host` and hit the Mac's LAN IP.)
2. **If the Mac-localhost view looks right:** merge PR #182, deploy, then the
   phone shows it. Resume the graph with `/graph-implement PRD/work/life-tracker-seat-map/`
   after merge to run `close` (cleanup).
3. **If the Mac-localhost view is still wrong** (one thing NOT yet visually
   confirmed: the compact block on the full-width **head-seat** cards — top/bottom
   — at **6 players**; slice D checked 7/8 only): it is a new issue on active work
   → use `thejudge-amend`, not graph-close. Re-examine how `PlayerLifeCard` places
   the compact block on head seats.

## State left clean

- Launch checkout on branch `thejudge-auto/life-tracker-seat-map-work`
  (`STATUS.owner-action`, parked ledger present). Dev stack stopped, ports
  5173/3000 free.
- PR #182 open, NOT merged. Local branch has driver ledger commits not on origin
  (base frozen since the PR opened); reconcile at close.
- Target reference: `intake/references/fullTable.PNG`. Current (old-code) state:
  `intake/references/fullTableList.PNG`.
