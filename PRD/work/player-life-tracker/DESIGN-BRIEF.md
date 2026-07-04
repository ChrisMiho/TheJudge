# Player Life Tracker — Design Brief

## Summary

A first-class suite feature: a live in-game **life / counter tracker** for 2–8
players, peer to standalone MTG life-counter apps. It registers as a
**feature-portal destination** (DEC-095, ships no nav chrome of its own),
reuses the extracted MTG-Assistant player roster, and **one-way seeds** MTG
Assistant game context on handoff. UI direction is driven by the reference
screenshots committed under `references/` — layout was not invented from memory.

## Scope (v1)

1. **Full-table life screen** — each player is a large life-tinted card with a
   giant life total **rotated to face their seat**; default seat arrangement per
   player count; edge `+`/`−` zones adjust life; name pill.
2. **Counter panel per player** — a **per-opponent commander-damage matrix**
   ("me" cell + one cell per opponent) plus the full named-counter palette
   (Monarch, Treasure, Initiative, Poison, Ascend, Rad, Day/night, C.Tax, K.O.,
   Energy, Exp) and **user-added generic counters**. Tap to increment; hold for
   decrement / set.
3. **Commander-damage → life** — optional per-game setting where adding an
   opponent's commander damage also decrements that player's life. Otherwise all
   counters are manual.
4. **Death cue** — at life **≤ 0** a **skull** overlays that player's card;
   clears when life returns above 0. Visual only — no elimination, no auto-KO.
5. **Basic game setup** — player count (2–8) and starting-life preset
   (20/25/30/40/60/custom); plain **reset** to starting values (no winner modal).
6. **Browser-local persistence** — full tracker state survives reload/phone-lock;
   cleared on New Game / reset.
7. **One-way handoff** — switching into MTG Assistant seeds the game-setup roster
   (count, names, life, counters) from current tracker state; editable before
   Decrypt; no sync back; returning preserves live state.
8. **Additive contract extension** — optional per-player counter fields on
   `GameContext.players`, threaded through Zod + prompt assembly.

## Key decisions

- **DEC-101** — feature definition (portal destination, full-table life screen,
  counter palette + commander-damage matrix, commander-damage→life option, skull
  death cue, basic game setup, shared roster, one-way seed).
- **DEC-102** — additive optional per-player counter fields on `GamePlayerContext`
  (`poison`, `experience`, `energy`, `commanderDamage`, `counters`) with Zod +
  prompt-assembly changes; existing payloads stay valid; `{ answer }`/error
  contracts unchanged. Additive amendment to DEC-021/DEC-027 (pattern of
  DEC-037/DEC-043).
- **DEC-103** — browser-local persistence + cleanup; diverges from the
  in-session-only suite convention (DEC-089/DEC-095) for this feature only.

## Requirements & flows

- **REQ-081** — tracker surface and life screen
- **REQ-082** — counter tracking and commander-damage matrix
- **REQ-083** — GameContext per-player counter contract extension
- **REQ-084** — persistence and cleanup
- **REQ-085** — tracker → MTG Assistant seed
- **FLOW-013** — track a game and hand off to MTG Assistant

## Reuse

- feature-portal registry (DEC-095) for the destination and mode switch
- shared player roster (REQ-015 / DEC-027 / DEC-091)
- palette tokens (DEC-066 / DEC-068), layout density (DEC-075)
- CSS-only, reduced-motion-aware motion (DEC-079 / NFR-006), mobile-first (NFR-001)
- browser-local persistence pattern from ThemeControl (DEC-066)

## Non-goals

- not a rules engine, no board/zone tracking, no format/legality logic (DEC-013)
- no multi-device / cross-device sync; frontend-only, single-device
- does not replace the staged zone / Ask AI flow — only seeds player-facing context

## Deferred (not cut)

Per-player theming (color/background/contrast), saved player profiles ("Load"),
reset-with-winner, game history, mana counter, dice & misc, the settings
layout-arrangement toggle, and full auto-KO automation.

## Out of scope entirely

Planechase / Archenemy / Bounty (internet deck fetches).

## Reference assets

`references/IMG_9504`–`IMG_9512.PNG`: main tracker (9504), counter panel
(9505/9506), player-customization tab (9507, deferred), reset-with-winner (9508,
deferred), settings — Game Setup retained / Gameplay toggles dropped (9509), game
history (9510, deferred), mana counter (9511, deferred), dice & misc (9512,
deferred).

## Open design detail

Seat arrangements are defined for 2–8 to match the contract's player range (the
reference app tops out at 6). Arrangements: 2 = facing top/bottom, 3, 4 =
quadrants, 5–8 = side rows with per-side rotation. Refine during map-out if a
specific 5–8 layout is preferred.
