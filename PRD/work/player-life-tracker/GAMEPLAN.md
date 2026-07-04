# Player Life Tracker — Gameplan

Implementation architecture for the suite life/counter tracker (DEC-101 / DEC-102
/ DEC-103; REQ-081–085; FLOW-013). UI direction is fixed by the reference photos
under `references/` — do not invent layout from memory.

## Architecture

A new feature-portal destination (`player-life-tracker`) plus an additive
GameContext contract extension. All product logic is frontend-only except the
additive Zod/prompt fields on the backend.

```
apps/frontend/src/
  lib/lifeTracker/                 ← pure logic + persistence (no React)
    types.ts                       TrackerState, TrackerPlayer, counter shapes
    counters.ts                    NAMED_COUNTER_PALETTE + counter→contract mapping
    seatArrangement.ts             seatArrangement(count) → per-seat slot + rotation
    state.ts                       createInitialState / adjustLife / setCounter /
                                   commander-damage helpers / resetGame
    persistence.ts                 STORAGE_KEY, load/saveTrackerState (ThemeControl pattern)
    seed.ts                        trackerStateToRosterSeed() (tracker → roster/counters)
    useLifeTracker.ts              state hook bound to persistence
  components/portal/life-tracker/
    PlayerLifeTrackerApp.tsx       destination root: header + setup + table
    GameSetupPanel.tsx             player count (2–8), starting-life preset, reset
    PlayerLifeCard.tsx             rotated life-tinted card, edge +/− zones, name pill, skull
    CounterPanel.tsx               commander-damage matrix + named palette + custom counters
  lib/portal/seedContext.tsx       one-way tracker→Assistant seed handoff
  components/portal/destinationRegistry.tsx   ← register destination (Slice C)
  App.tsx                          ← seed wiring on tracker→assistant transition (Slice E)
  components/portal/MtgAssistantApp.tsx        ← consume seed, carry counters (Slice E)

apps/backend/src/
  validation/askAiRequest.ts       ← gamePlayerSchema gains optional counter fields (Slice A)
  prompt/context.ts                ← buildPromptContext passes counters through (Slice A)
  prompt/promptFormatting.ts       ← formatGameContext emits per-player counter line (Slice A)
  eval/fixtures/*                  ← goldens updated for the intentional prompt change (Slice A)
apps/frontend/src/types.ts         ← GamePlayerContext gains optional counter fields (Slice A)
```

## Data flow

1. **Contract (Slice A).** `GamePlayerContext` gains optional `poison`,
   `experience`, `energy`, `commanderDamage` (`{ from: PlayerLabel, amount }[]`),
   and `counters` (`{ name, amount }[]`) on FE (`types.ts`) and BE
   (`gamePlayerSchema`, whose inferred type feeds `PromptContext`). Every field is
   optional and omitted when unset/zero. Prompt assembly emits one extra counter
   line per player that has any populated counter; players with none are
   unchanged. Existing `{ label, lifeTotal, displayName? }` payloads stay valid.

2. **Tracker state (Slice B).** `TrackerState` = `{ playerCount, startingLife,
   commanderDamageToLife, players: TrackerPlayer[] }`. `TrackerPlayer` = life +
   scalar counters + a per-opponent commander-damage map keyed by `PlayerLabel` +
   named palette counters + custom counters. Pure helpers mutate immutably.
   `persistence.ts` writes the whole state to `localStorage`
   (`thejudge.lifeTracker.state`) and restores on load, mirroring
   `themePrefs.ts`' try/catch guard. `seatArrangement(count)` returns, for each
   seat (2–8), a slot position and a rotation so each life total faces its seat.

3. **Life screen (Slice C).** `PlayerLifeTrackerApp` owns `useLifeTracker`,
   renders `<PortalSlot />` in its header (so the portal menu button mounts
   inline, matching `StagedStepHeader`), a `GameSetupPanel`, and one
   `PlayerLifeCard` per active player laid out per `seatArrangement`. Edge `+`/`−`
   tap zones call `adjustLife`; a skull overlays at life ≤ 0 and clears above 0.

4. **Counters (Slice D).** Tapping a card's counter area opens `CounterPanel` for
   that player: a commander-damage matrix (a `me` cell for the player's own seat +
   one cell per opponent), the named palette (Monarch, Treasure, Initiative,
   Poison, Ascend, Rad, Day/night, C.Tax, K.O., Energy, Exp), and user-added
   generic counters. Tap increments; hold exposes decrement/set. With
   `commanderDamageToLife` on, incrementing an opponent's commander damage also
   decrements that player's life; all other counters are always manual.

5. **Seed (Slice E).** On a portal transition **into `mtg-assistant` whose
   previous destination was `player-life-tracker`**, `App.tsx` reads the current
   tracker snapshot via `loadTrackerState()`, maps it with
   `trackerStateToRosterSeed()`, and exposes it through `seedContext`.
   `MtgAssistantApp` consumes the pending seed once (player count, display names,
   life, and counters), then clears it. The seed is one-way — Assistant edits
   never write back — and returning to the tracker preserves live state
   (persistence is independent of the seed).

## Slices

| Slice | Objective | Depends on |
| --- | --- | --- |
| A | GameContext per-player counter contract (REQ-083 / DEC-102) | — |
| B | Tracker state model, seat arrangement, browser-local persistence (REQ-084 / DEC-103) | — |
| C | Tracker destination + full-table life screen (REQ-081) | B |
| D | Counter panel + commander-damage matrix (REQ-082) | B, C |
| E | Tracker → MTG Assistant one-way seed + PRD promotion (REQ-085 / FLOW-013) | A, B, C, D |

A and B are independent foundations and can be built in parallel; C then D are
sequential on the UI; E lands last because it seeds counters produced by D and
rides the Slice A contract.

## Cross-cutting constraints

- Presentation/tracking only — no rules engine, legality, board/zone tracking, or
  elimination (DEC-013). The commander-damage→life option is the only automation.
- Reuse before creating: the named-counter palette, seat map, and counter→contract
  mapping each have a single authoritative definition imported where needed
  (`technical-design-rules.md`). Do not duplicate the palette across panel and seed.
- Mobile-first (NFR-001); decorative motion stays CSS-only and
  `prefers-reduced-motion`-aware (DEC-079 / NFR-006) — no animation library.
- Player count is constrained to 2–8 so any seeded roster conforms to the
  GameContext contract.
- Do not change `AskAiRequest`, Zod schemas, or prompt assembly beyond the
  DEC-102 additive fields; success `{ answer }` / error shapes are unchanged.

## Verification checklist

- [ ] `npm run typecheck` — clean across FE + BE
- [ ] `npm --workspace apps/frontend run test` — tracker lib + component suites green
- [ ] `npm --workspace apps/backend run test` — schema + prompt suites green
- [ ] `npm --workspace apps/backend run test:eval` — goldens reflect only the intentional counter-line change
- [ ] `npm run lint` — clean
- [ ] Existing `{ label, lifeTotal, displayName? }` payloads still validate (no counter fields required)
- [ ] Reload/phone-lock restores an in-progress tracker game; New Game / reset clears it
- [ ] Seeding tracker → MTG Assistant pre-fills count/names/life/counters, stays editable, and does not write back
