status: refined

# Design Brief — Life-adjust `−` always sits nearest each player

## What the player gets

On the Player Life Tracker, each player's `−` (lose life) button sits on the
edge of their card nearest them — the table edge they sit at — and `+` (gain
life) sits on the far edge. So every player taps *toward themselves* to drop
life, and nobody reaches across their own card or across the table to subtract.
This holds in both layouts (grid and list), for every seat, at every player
count 2–8.

Two things are broken today and this fixes both:

- **List, middle players.** List stacks players in rows: a head seat (top), a
  foot seat (bottom), and middle **pair rows** of two players side by side.
  Today every upright card puts `−` on the screen-left, so the **left** player
  of a pair gets `−` near them but the **right** player gets `−` on the far side
  and reaches across. The head and foot seats already read correctly and stay
  untouched.
- **Grid, every seat.** Grid pins `−` to the screen-left for every card
  regardless of seat, so most players reach across. `−` moves to each seat's
  near edge instead.

The default layout stays **grid** — this changes only where `−`/`+` land within
a card, not which layout a new game opens in.

## Design direction

One rule, applied in the card's life-adjust split: **`−` on the seat's near
edge, `+` on the far edge.** The split is keyed to where the player sits (their
table edge), not to a fixed screen side.

- **List**: keep the head/foot seats exactly as they are; mirror the split
  inside each middle pair row so the right-of-pair player's `−` moves to their
  own (right) near edge.
- **Grid**: replace the fixed screen left/right split with the per-seat near-edge
  split — `−` on the bottom edge for a bottom seat, the top edge for a top seat,
  the left edge for a left-column seat, the right edge for a right-column seat.

### How this sits with DEC-136 / DEC-170 (reconciliation — owner decision 2026-10-04)

- **DEC-136** originally split each card by the seat's own rotation — a per-seat
  split in both layouts.
- **DEC-170** later made **grid** a fixed on-screen left/right split (`−` left
  for every card), "replacing the per-seat top/bottom split that four
  inward-facing cards made awkward." It left list on the per-seat rule.

This change **reverts DEC-170's grid reasoning**: grid returns to a per-seat
split, now stated as `−`-nearest-the-player. The owner made this call on
2026-10-04 to make "tap toward yourself to lose life" hold everywhere. DEC-170 is
amended in place to describe grid's new per-seat near-edge split; DEC-136's
per-seat principle stands and is now expressed as the near-edge rule for both
layouts.

Known risk, surfaced and accepted: the per-seat split is the exact thing DEC-170
called "awkward" for grid's four inward-facing cards. The owner will eyeball the
built grid live and can bounce it. (Verify-UI-live: the browser is the judge.)

### Production change (implementation note — applied at build, not product truth)

The life-adjust split is decided in
`apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx` by the
`halves` object (which edge each button pins to), today via
`lifeHalvesForRotation(rotation)` for list and a fixed
`{ decrease: "left", increase: "right" }` for grid (PlayerLifeCard.tsx ~172-175).

- The split must be keyed to each seat's **table edge / column side**, not
  rotation alone — a left-of-pair vs right-of-pair list seat share rotation `0°`
  but need opposite splits. The seat arrangement
  (`apps/frontend/src/lib/lifeTracker/seatArrangement.ts`) is the source of each
  seat's position; map-out resolves whether the needed edge/side is already on
  the placement or must be surfaced from it.
- **Grid**: drop the fixed `{ left, right }` branch; compute `−` on the seat's
  near edge from its placement (bottom/top for 2–3p upright/upside-down seats;
  left/right for 4–8p side-column seats).
- **List**: keep head/foot output unchanged; for middle pair rows, mirror the
  right-column seat so `−` lands on its near (right) edge.
- Update the `PlayerLifeCard` / seat tests that assert the old fixed grid split
  or the un-mirrored middle-pair split; run the full frontend suite and fix any
  default-derived assertion. The one-screen fit rule still holds at 2–8
  (`screen-layout.md`).

No change to: which layout is the default (grid stays), the seat arrangements
themselves, the Game Setup Layout toggle, or the one-way MTG Assistant seed.

## Product truth this needs (proposed in GATE-QUESTIONS.md)

The `−`/`+` orientation is user-visible and currently governed by DEC-136/DEC-170
rather than a requirement. Proposed as a redefined **REQ-217** (the orientation
rule), with DEC-170 amended in place, and the feature spec and system map amended
to enact it. See `GATE-QUESTIONS.md`.

## Material assumptions (each is evidence weighed at the define gate)

| # | Assumption | Evidence | Ladder basis |
| --- | --- | --- | --- |
| A1 | The fix is the near-edge `−`/`+` split in both layouts, not a default-layout flip. | Owner decision across conversation on 2026-10-04 (supersedes the 2026-10-03 intake's "open in list by default"). | Request as stated. |
| A2 | The default layout stays grid. | Owner statement 2026-10-04: "a fresh game, with no cached data, should be in grid by default." Code: `state.ts:17` `DEFAULT_LAYOUT_MODE = "grid"` (unchanged). | Preserve user-visible behavior; request as stated. |
| A3 | List's head and foot seats already read correctly and are not touched; only middle pair rows change. | Owner statement 2026-10-04: "the end players are fine, it's the middle players that need the fix." | Request as stated. |
| A4 | Grid's fix reverts DEC-170's fixed-screen split back to a per-seat near-edge split. | Owner statement 2026-10-04: "grid needs a fix" + the near-edge rule. DEC-170 text: grid uses fixed screen left/right. | Overturns an active decision by explicit owner call; amend in place. |
| A5 | The split must be keyed to each seat's table edge, since left/right pair seats share rotation `0°`. | Verified: `PlayerLifeCard.tsx` computes list halves from rotation alone; both pair seats are `0°` (seatArrangement list rows). | Established code pattern. |
| A6 | Layout persistence is unchanged and already behaves as the owner wants (a chosen layout carries into the next game). | Verified: `useLifeTracker.ts` `newGame` carries `layoutMode` forward; `persistence.ts` re-persists on first mutation. Owner did not ask to change persistence. | Out of scope; preserve behavior. |

## Non-goals

- Changing which layout a new game opens in (grid stays the default).
- Changing the seat arrangements, the Game Setup Layout toggle, or the one-way
  MTG Assistant seed.
- Changing layout persistence (a chosen layout already carries forward; the
  narrow reload-after-New-Game edge is noted but not in scope).

## Open edge noted, not in scope

New Game clears the saved state and only re-saves on the first life tap, so a
page reload performed in that gap falls back to grid. The owner did not flag this;
recorded here so it isn't mistaken for the orientation fix.

## Citations (paths only — not opened per the intake-is-evidence rule)

- `PRD/work/probe-life-tracker-seat-oriented-default/` (PROBE.md + GRAPH-BRIEF.md)
- Prior receipts named in `IDEA.md`:
  `PRD/instructions/receipts/life-tracker-seat-map-2026-09-03.md`,
  `life-tracker-spec-2026-08-25.md`, `player-life-tracker-2026-08-03.md`,
  `player-life-tracker-refinement-2026-08-05.md`.

## Decision blockers

None. Direction is owner-decided across the 2026-10-04 conversation and approved;
the define gate / docs PR #247 surfaces the proposed product truth for a final
accept.
