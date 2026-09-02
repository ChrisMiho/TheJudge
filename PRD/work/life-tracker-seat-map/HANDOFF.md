# Handoff — life-tracker-seat-map (paused mid-build for design clarification)

**Status:** parked at `build` awaiting owner clarification. The build machinery is
fine; the open question is a **layout design detail** on the on-card
commander-damage grid. The owner is refreshing context and will clarify the intent.

**Read this, then `GRAPH-RUN.md` (`## Node ledger`, `## Open gate`). Everything
below is measured or cited, not assumed.**

---

## What the feature is (unchanged)

REQ-173 (accepted, merged docs PR #180): the little commander-damage grid on each
life-tracker card — and the matrix in the opened counter panel — becomes a
per-seat map ("me" at your seat, opponents in their directions), and must stay
contained inside the card at 2–8 players in both **grid** and **list** layout.

## Where the build got to

- Slices **A, B, C are implemented and green** in the worktree
  `.worktrees/implement-life-tracker-seat-map` (branch `implement-life-tracker-seat-map`):
  the `buildSeatMapCells` geometry helper (`apps/frontend/src/lib/lifeTracker/seatMap.ts`),
  the on-card preview render (`PlayerLifeCard.tsx`), and the panel matrix
  (`CounterPanel.tsx`). Typecheck, vitest (32/32), quality:check all passed on the
  staged tree. **Nothing committed to the shared branch, no code PR opened.**
- Slice **D (live 7/8-player containment verification) not finished.**
- REQ-173 not yet applied to `PRD/sections/` (that happens with the last slice).

## The design problem the owner caught (live)

The owner reported the commander-damage boxes render **vertically instead of
horizontally, going off screen.** I measured the running worktree build at
iPhone-portrait (430px). Findings — this narrows the bug:

| Layout | Count | On-card grid footprint | Contained? |
| --- | --- | --- | --- |
| **grid** | 7 | ~49w × 26h — **horizontal** | yes, fully |
| **grid** | 8 | ~49w × 26h — **horizontal** | yes, fully |
| **list** | 8 | ~12–25w × **60h — VERTICAL** | **no — overflows the card bottom by ~4px on players 2–8** |

**So grid mode is fine. The vertical/off-screen bug is specific to LIST mode.**
In list mode the mini-map inherits `listSeatArrangement`'s tall (rows-stacked)
shape, so the grid renders as a narrow vertical strip that runs past the card's
bottom edge.

## The owner's steering (honor this over my earlier proposal)

- The owner's words: **"i think you really just need to rotate the component, and
  then we can go back to fixing the order displayed."** I.e. the fix is small —
  rotate the commander-damage grid so it sits horizontally (especially in list
  mode), *then* separately correct which cell maps to which player.
- The owner said **the reference images are the target**:
  `intake/references/fullTable.PNG`, `player1.PNG`..`player6.PNG` (target
  layout), and `current-8p-mobile-overflow.png` (the old overflow to avoid). In
  the reference the grid is a **small, compact, horizontal block** beside the
  life number, "me" in the corner matching your seat.
- **I went off track**: I proposed abandoning the seat-map geometry for a full
  compact-grid redesign. The owner corrected that — grid mode already works; the
  real issue is the **list-mode orientation**. Do **not** re-architect the
  geometry helper wholesale. Scope the fix to the orientation (and then cell
  order), and re-verify live against the references.

## Suggested next steps (pending owner clarification)

1. Get the owner's clarification on exactly what "rotate the component" should
   produce (likely: list-mode grid becomes horizontal, matching grid mode).
2. Make that targeted change in `PlayerLifeCard.tsx` (and `CounterPanel.tsx` if
   it shares the issue). The grid is built at `gridTemplateColumns: repeat(layout.columns)`
   × `gridTemplateRows: repeat(layout.rows)` (PlayerLifeCard ~L254) from the
   active arrangement — list mode's `columns`/`rows` are the tall shape.
3. Verify live at 7 and 8 players in **both** grid and list at 430px (the DOM
   measurement recipe above works; or slice D's dev-server + screenshot flow).
4. Then address cell order/mapping.
5. Finish slice D, apply REQ-173 to `PRD/sections/`, open one code PR into `main`.

## Run / branch / infra state (for a clean resume)

- **Lock:** released (this pause). Run id `graph-20260902-093611`. STATUS moved to
  `owner-action`.
- **Branches:** build-half work + ledger on `thejudge-auto/life-tracker-seat-map-work`
  (pushed to origin at `896bec7`, carries GAMEPLAN/slices/criteria + the A3 fix).
  `main` is pristine. Slice A–C code lives only in the worktree branch
  `implement-life-tracker-seat-map` (not yet pushed).
- **Autonomous base:** `origin/main` (Model-B: docs base merged via #180; build
  opens one code PR `…-work → main`). See README `## Autonomous metadata`.
- **Boundary-hook fix PR #181 (MERGED):** `criterion-flip-without-evidence` is now
  remediable — this run's earlier blocker. `origin/main` was integrated into
  `-work`; the active hook is corrected.
- **Two enforcement-tooling bugs already fixed this run** (see `GRAPH-RUN.md`):
  the A3 criteria regex escape, and the `REMEDIABLE_RULES` fix (#181).
- **Worktree preserved** with slices A–C staged/committed; resume needs no
  re-coding of A–C, only the list-mode orientation fix + order + slice D.
- **Processes:** my verification dev server (5180) and browser are stopped and the
  port is released. Two unrelated servers (`localhost:5173` frontend, `:3000`
  backend) are from the **launch checkout**, not this run — left running.

## Resume

After the owner clarifies: `/graph-implement PRD/work/life-tracker-seat-map/`
re-enters at `build`. The gate to resolve is the design clarification recorded in
`GRAPH-RUN.md` `## Open gate`, not a tooling blocker.
