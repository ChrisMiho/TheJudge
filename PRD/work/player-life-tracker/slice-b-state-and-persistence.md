# Slice B — Tracker state model, seat arrangement, and browser-local persistence

## Status: planned

## Goal

Build the pure (non-React) tracker foundation: state types, immutable update
helpers, the per-count seat arrangement, the named-counter palette, and
browser-local persistence with cleanup — all unit-tested in isolation
(REQ-084 / DEC-103, foundation for REQ-081/082).

## Requirements

1. `lib/lifeTracker/types.ts` — `TrackerState = { playerCount, startingLife,
   commanderDamageToLife: boolean, players: TrackerPlayer[] }`. `TrackerPlayer`
   carries `label: PlayerLabel`, `displayName`, `life`, scalar counters
   (`poison`, `experience`, `energy`), a per-opponent commander-damage map keyed
   by `PlayerLabel`, the named palette counter values, and `customCounters:
   { name, amount }[]`.
2. `lib/lifeTracker/counters.ts` — a single authoritative
   `NAMED_COUNTER_PALETTE` (Monarch, Treasure, Initiative, Poison, Ascend, Rad,
   Day/night, C.Tax, K.O., Energy, Exp) reused by the panel (Slice D) and seed
   (Slice E). No duplicate palette definitions.
3. `lib/lifeTracker/seatArrangement.ts` — `seatArrangement(count: 2–8)` returns
   one slot per seat with a position descriptor and a rotation so each life total
   faces its seat: 2 = top/bottom facing; 3–4 = quadrants; 5–8 = side rows with
   per-side rotation (refine 5–8 against `references/IMG_9504.PNG`). Pure and
   fully unit-tested.
4. `lib/lifeTracker/state.ts` — immutable helpers: `createInitialState(count,
   startingLife)`, `adjustLife(state, label, delta)`, `setScalarCounter`,
   `adjustCommanderDamage(state, targetLabel, fromLabel, delta)` (also decrements
   `life` when `commanderDamageToLife` is on), `setNamedCounter`,
   `addCustomCounter`/`adjustCustomCounter`, `setPlayerCount`, `setStartingLife`,
   `resetGame` (life + all counters back to starting values).
5. `lib/lifeTracker/persistence.ts` — `STORAGE_KEY = "thejudge.lifeTracker.state"`,
   `loadTrackerState()` / `saveTrackerState(state)` wrapped in try/catch that
   never throws into the app (mirrors `lib/theme/themePrefs.ts`); `clearTrackerState()`
   for New Game / reset. Invalid/absent storage returns `null`.
6. `lib/lifeTracker/useLifeTracker.ts` — a hook binding `TrackerState` to
   persistence: hydrate from `loadTrackerState()` on mount (fallback to a default
   game), persist on change, and expose the update helpers + a `newGame`/`reset`
   that clears persistence.

## Acceptance criteria

- [ ] `createInitialState(4, 40)` yields 4 players each at life 40 with all
      counters zero and empty commander-damage/custom lists.
- [ ] `adjustLife` / counter helpers return new state without mutating input.
- [ ] With `commanderDamageToLife` true, `adjustCommanderDamage(target, from, +2)`
      reduces the target's life by 2; with it false, life is unchanged.
- [ ] `seatArrangement(n)` returns exactly `n` seats for every `n` in 2–8, each
      with a rotation value; snapshot-tested per count.
- [ ] `saveTrackerState` then `loadTrackerState` round-trips a full game
      (roster, life, all counters, commander-damage map, option, starting life).
- [ ] `clearTrackerState` (New Game / reset) removes the persisted key; a fresh
      `loadTrackerState` returns `null`.
- [ ] Persistence helpers never throw when `localStorage` is unavailable.

## Verification

```bash
npm --workspace apps/frontend run test -- src/lib/lifeTracker
npm run typecheck
```

## Files touched

- `apps/frontend/src/lib/lifeTracker/types.ts`
- `apps/frontend/src/lib/lifeTracker/counters.ts`
- `apps/frontend/src/lib/lifeTracker/seatArrangement.ts` (+ `.test.ts`)
- `apps/frontend/src/lib/lifeTracker/state.ts` (+ `.test.ts`)
- `apps/frontend/src/lib/lifeTracker/persistence.ts` (+ `.test.ts`)
- `apps/frontend/src/lib/lifeTracker/useLifeTracker.ts` (+ `.test.ts`)

## Notes

- Reuses the `PlayerLabel` type (`apps/frontend/src/types.ts`) and the
  ThemeControl browser-local persistence pattern (DEC-066 / DEC-103).
- Pure logic only; no React components and no DOM layout here.
- Diverges from the in-session-only suite convention (DEC-089/DEC-095) for this
  feature only (DEC-103).
