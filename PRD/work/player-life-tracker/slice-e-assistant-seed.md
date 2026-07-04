# Slice E — Tracker → MTG Assistant one-way seed + PRD promotion

## Status: planned

## Goal

Seed the MTG Assistant game-setup roster from current tracker state as a one-way
handoff (player count, display names, life, counters), keep it editable before
Decrypt, and never write back (REQ-085 / FLOW-013).

## Requirements

1. `lib/lifeTracker/seed.ts` — `trackerStateToRosterSeed(state)` mapping a
   `TrackerState` to a roster seed: player count, per-player display names, life
   (→ `lifeTotal`), and counters mapped to the Slice A contract fields
   (`poison`/`energy`/`experience` scalars, per-opponent `commanderDamage`, and
   the remaining named + custom counters → `counters[]`). Reuses
   `NAMED_COUNTER_PALETTE` — no second mapping table.
2. `lib/portal/seedContext.tsx` — a React context exposing a pending roster seed
   plus `provideSeed(seed)` / `consumeSeed()` (one-shot). Default no-op provider
   so `MtgAssistantApp` tests run in isolation.
3. `App.tsx` — track the previous `activeDestinationId`. On a transition **into
   `mtg-assistant` whose previous destination was `player-life-tracker`**, read
   the current tracker snapshot via `loadTrackerState()`; if a game exists, call
   `provideSeed(trackerStateToRosterSeed(snapshot))`. No seed fires on unrelated
   switches, so Assistant edits are never clobbered.
4. `components/portal/MtgAssistantApp.tsx` — consume a pending seed once (effect):
   set `activePlayerCount`, `displayNamesByPlayer`, `lifeTotalsByPlayer`, and the
   new per-player counter state from the seed, then `consumeSeed()`. Counters
   surface in the existing expandable player-details block as editable values;
   `buildPlayers()` includes the (edited) counter fields so they ride the DEC-102
   contract into `POST /api/ask-ai`. Life/names/count remain fully editable via
   the existing controls.
5. One-way: editing seeded values in Assistant does not write back to the tracker;
   returning to the tracker preserves its live state (tracker persistence is
   independent of the seed).
6. Player count is constrained to 2–8 end to end, so a seeded roster always
   conforms to the GameContext contract; counters left at zero/unset are omitted
   from the payload (Slice A normalization).

## Acceptance criteria

- [ ] Tracking a 4-player game, then selecting MTG Assistant from the portal,
      pre-fills game setup to 4 players with the tracker's names and life totals.
- [ ] A tracker player with `poison: 3` and `commanderDamage from Player 2: 5`
      seeds those values into that player's Assistant counter fields; the Decrypt
      payload carries `poison: 3` and the commander-damage entry.
- [ ] Editing a seeded value in Assistant (e.g. life 40 → 38) sends the edited
      value and does **not** change tracker state on return.
- [ ] Switching mtg-assistant → trade-balancer → mtg-assistant does **not**
      re-seed (only tracker → assistant does).
- [ ] A counter left at 0/unset in the tracker is omitted from the seeded payload.
- [ ] Returning to the tracker shows the unchanged live game.

## Verification

```bash
npm --workspace apps/frontend run test -- src/lib/lifeTracker/seed
npm --workspace apps/frontend run test -- src/components/portal/MtgAssistantApp
npm --workspace apps/frontend run test -- src/App
npm run quality:check
```

## Files touched

- `apps/frontend/src/lib/lifeTracker/seed.ts` (+ test)
- `apps/frontend/src/lib/portal/seedContext.tsx` (+ test)
- `apps/frontend/src/App.tsx` (+ `App.*.test.tsx` seed-transition case)
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx` (seed consume + counter roster state)

## PRD promotion checklist (executed in thejudge-cleanup)

- [ ] Flip `sections/system-map.md` player-life-tracker entry to `shipped`
      (product code wired in **and** receipt written).
- [ ] Confirm DEC-101 / DEC-102 / DEC-103 bodies match shipped reality; leave
      `Status: confirmed` (lifecycle field, not the shipped signal).
- [ ] Confirm REQ-081–085 and FLOW-013 acceptance criteria reflect shipped
      behavior; adjust wording only if implementation diverged.
- [ ] Write receipt at
      `PRD/instructions/receipts/player-life-tracker-<YYYY-MM-DD>.md`
      (date, actions, files created/updated/deleted, verification, notes).
- [ ] Delete `PRD/work/player-life-tracker/` entirely.
- [ ] Update `PRD/README.md` only if navigation / read-order changed.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged except the DEC-102 additive counter fields
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/player-life-tracker/` ready to delete

## Notes

- Seeded counters ride the additive GameContext fields (REQ-083 / Slice A); life
  uses the existing `lifeTotal`. Handoff is frontend-only; no backend/contract
  change beyond DEC-102.
- Reuse before creating: single `trackerStateToRosterSeed` mapping; do not
  duplicate the counter→contract logic already implied by Slice A.
