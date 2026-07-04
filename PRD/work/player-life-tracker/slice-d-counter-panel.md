# Slice D — Counter panel and commander-damage matrix

## Status: planned

## Goal

Add the per-player counter panel: a per-opponent commander-damage matrix, the
named-counter palette, user-added generic counters, tap-to-increment /
hold-for-decrement-or-set, and the optional commander-damage→life setting
(REQ-082).

## Requirements

1. `components/portal/life-tracker/CounterPanel.tsx` — a modal opened from a
   player's card counter area (trigger provided in Slice C). Match
   `references/IMG_9505.PNG` / `IMG_9506.PNG`: a `Player` / `Counters` tab split,
   the commander-damage matrix on the player tab, and the named palette on the
   counters tab.
2. Commander-damage matrix: a `me` cell marking the player's own seat plus one
   cell per opponent (per-source, keyed by `PlayerLabel`). Tapping an opponent
   cell increments that opponent's commander damage against this player via
   `adjustCommanderDamage`.
3. Named palette from `NAMED_COUNTER_PALETTE` (Slice B): Monarch, Treasure,
   Initiative, Poison, Ascend, Rad, Day/night, C.Tax, K.O., Energy, Exp — each
   independently increment/decrementable. Poison / Energy / Exp map to the scalar
   `poison` / `energy` / `experience` counters; the rest are named counters.
4. User can add a generic named custom counter (`addCustomCounter`), which then
   increments/decrements like the palette entries.
5. Interaction: tap increments; a hold / secondary action exposes decrement and
   set (via the Slice B helpers). No value goes below 0.
6. Optional per-game setting: when `commanderDamageToLife` is on, incrementing an
   opponent's commander damage also decrements that player's life (Slice B
   already couples this in `adjustCommanderDamage`); when off, they are
   independent. The toggle lives in game setup (see `references/IMG_9509.PNG`
   "Commander damage life loss"); all other counters are always manual.
7. All counter values persist with the game via the Slice B persistence
   (DEC-103). No rules resolution beyond the explicit commander-damage→life
   option (DEC-013).

## Acceptance criteria

- [ ] Tapping a player's counter area opens their counter panel.
- [ ] The matrix shows a `me` cell for the player's own seat and one cell per
      other player; tapping an opponent cell raises that opponent's commander
      damage against this player.
- [ ] Each palette counter increments on tap and decrements via the hold/secondary
      action; none goes below 0.
- [ ] Adding a generic custom counter creates an independently adjustable counter.
- [ ] With commander-damage→life ON, incrementing an opponent's commander damage
      lowers the player's life; with it OFF, life is unchanged.
- [ ] Reload restores all panel counter values (persistence round-trip).

## Verification

```bash
npm --workspace apps/frontend run test -- src/components/portal/life-tracker/CounterPanel
npm --workspace apps/frontend run test -- src/lib/lifeTracker
npm run typecheck
```

## Files touched

- `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx` (+ test)
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx` (wire panel open)
- `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx` (commander-damage→life toggle)

## Notes

- UI direction fixed by `references/IMG_9505.PNG` / `IMG_9506.PNG`. Do not invent.
- Reuses `NAMED_COUNTER_PALETTE` and the Slice B state helpers — no duplicate
  palette or duplicated counter logic (`technical-design-rules.md`).
- Counters are captured values only (DEC-013); the panel triggers no legality or
  board-state simulation.
