# player-life-tracker-refinement

The Player Life Tracker shipped (`system-map.md` → **Player Life Tracker**): full-table life screen, counter panel + commander-damage matrix, skull death cue, game setup, browser-local persistence, and the one-way seed into MTG Assistant are all live and covered by tests (see `PRD/instructions/receipts/player-life-tracker-2026-08-03.md`). The framework and product scope are done — this is not a rebuild.

The gap: `DESIGN-BRIEF.md` for the original package said UI direction would be driven by the reference screenshots in `references/` (`IMG_9504`–`IMG_9512.PNG`), but the shipped implementation is an accepted functional match and a visual deviation from those references. Layout, spacing, card/counter styling, and other presentation details don't read the same as the photos.

Outcome: refine the shipped tracker's presentation (life cards, seat layout, counter panel/matrix, game setup, palette/styling) to visually match the reference screenshots more closely, without changing the underlying contracts, persistence, seed behavior, or non-goals already locked in for this feature (not a rules engine, no board/zone tracking, no elimination/auto-KO, no multi-device sync).

Non-goals: no new counters/mechanics beyond the existing named-counter palette; no change to the additive `GameContext` counter contract (DEC-102) or the seed handoff (REQ-085); no change to persistence behavior (DEC-103); not reopening deferred scope from the original brief (per-player theming, saved profiles, game history, mana counter, dice & misc, full auto-KO).

## Reference assets

`references/IMG_9504`–`IMG_9512.PNG` — carried over unchanged from the shipped `player-life-tracker` package. See the original mapping in the deleted `DESIGN-BRIEF.md` (preserved in git history / the cleanup receipt): 9504 = main tracker layout, 9505/9506 = counter panel/matrix, 9507 = player-customization tab (deferred), 9508 = reset-with-winner (deferred), 9509 = settings/game-setup, 9510 = game history (deferred), 9511 = mana counter (deferred), 9512 = dice & misc (deferred).

## Refinement reminder (required)

Before locking any new UI direction in a `DESIGN-BRIEF.md`, diff the shipped implementation against each in-scope reference screenshot and call out specifically what doesn't match (layout, spacing, color, typography, card shape, etc.) — don't just restate the original brief's descriptions from memory.
