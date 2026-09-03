# Player Life Tracker — current-state feature spec

- Status: current-state feature spec — precedence #1 and Read-First #1 for what
  this feature does today. Decision bodies are retired: `PRD/sections/decisions.md`
  is now precedence #2, a historical index that resolves a cited `DEC` ID to a
  one-line summary, no longer an override. The cited `REQ`/`FLOW` remain the
  granular backing; keep this file correct in step with them as behavior changes,
  editing in place — never by recording a new decision.
- Backed by: DEC-101, DEC-102, DEC-103, DEC-132, DEC-136, DEC-139, DEC-170,
  REQ-081, REQ-082, REQ-083, REQ-084, REQ-085, REQ-111, REQ-112, REQ-173,
  FLOW-013, NFR-001, NFR-006

## What it is

A feature-portal destination that lets 2–8 players track life and every
player-level counter live during a tabletop game, then hand that state off
to MTG Assistant with one tap. Each player gets a large, seat-rotated life
card; a per-player counter panel holds commander damage and the rest of the
counter palette; a header control tracks game-wide day/night; and the whole
game survives a phone lock or reload because it saves itself as you play.

## How it works

### Life table

- Built: the main screen renders one card per player (2–8), each showing a
  large life total rotated to face that player's own seat, in a default seat
  arrangement per player count with a grid mode and a list mode.
- Built: life adjustment splits each card into two half-card zones covering the
  whole card except its three interactive controls (life total, commander-damage
  preview, inline life input). In **list mode** the split follows the seat's own
  rotation — `−` always on the player's left, `+` always on their right from that
  player's point of view. In **grid mode** it is a fixed on-screen left/right —
  `−` on the left half, `+` on the right — the same for every card, because four
  cards facing in from all sides made a per-seat top/bottom split awkward; the
  `−`/`+` glyphs reflow to the card's outer edges and read screen-upright.
  (DEC-136, DEC-170)
- Built: the life table always fits one screen at every supported player
  count — rows share the shell's height with no per-row or per-card minimum,
  and card contents scale in container-query units rather than clipping.
  (DEC-136)
- Built: a player whose life reaches ≤ 0 shows a skull overlay on their card
  as a visual-only death cue; it clears when life returns above 0. No
  elimination, auto-KO, or rules simulation follows from it.
- Built: cards are life-tinted.

### Counter panel and commander-damage matrix

- Built: tapping a player's counter area opens that player's counter panel.
  It tracks a per-opponent commander-damage matrix (a "me" cell marks the
  player's own seat plus one cell per opponent), the named-counter palette —
  Monarch, Treasure, Initiative, Poison, Ascend, Rad, Day/night, C.Tax, K.O.,
  Energy, Exp — and user-added generic named counters.
- Built: tap increments a named or custom counter; a hold/secondary action
  exposes decrement and set.
- Built: each opponent commander-damage cell exposes always-visible `−`/`+`
  bands (no hold menu). Incrementing an opponent's commander damage always
  decrements that player's life — this is always on, not a Game Setup
  toggle; every other counter change is manual.
- Built: the panel's surface fills the available shell height rather than
  sizing to its content, joining the suite's Menu-tray/history-drawer
  full-height overlay family, and scrolls internally when its content
  exceeds that height. No dead scrim band remains above it at any player
  count. (DEC-139)
- Built: counter values persist with the game (see Persistence, below).

### Day/night header control

- Built: a compact header control always shows the current game-wide
  designation (`day` / `night`); tapping it flips the designation. There is
  no Game Setup toggle and no enable/disable setting — tracking is always
  on. (DEC-132)
- Built: the designation is manual only, never auto-derived from turns or
  spells. It is not seeded into In-Depth / `GameContext`.
- Built: this is distinct from the per-player named "Day/night" counter in
  the counter palette, which remains a separate, independent per-player
  value.

### Game Setup

- Built: player count is set via a `−`/`+` stepper, 2–8.
- Built: starting life is set from presets 20/25/30/40, or Custom, which
  defaults to 60 when opened or applied without a different typed value.
  Starting life seeds every player.
- Built: changing player count applies the In-Depth-matching starting-life
  default (2 players → 20, 3+ players → 40) unless the user has already
  chosen a different starting life for this game.
- Built: display names are edited from Game Setup's Edit names disclosure,
  a tracker-local UI. In-Depth continues to use the shared
  `PlayerRosterEditor` — the tracker does not mount it.

### Reset / New Game

- Built: a plain reset returns every player's life and counters to the
  current starting values, with no winner-selection step. Reset also
  returns the day/night designation to day.
- Built: New Game clears persisted game values back to starting values;
  presentation preferences (layout mode, card style) may survive New Game.

### Persistence

- Built: tracker game state — the roster (player count, display names),
  each player's life and all counters, the commander-damage matrix, the
  starting-life setting, the game-wide day/night designation, and
  presentation preferences (layout mode, card style) — saves to browser-local
  storage and restores on load, so a reload or phone-lock does not lose an
  in-progress game. (DEC-103)
- Built: an old save carrying a removed field (such as a former
  `dayNightEnabled` flag) still loads; the unknown field is ignored rather
  than discarding the save.
- Built: persistence is frontend-only and single-device — no server-side
  store and no cross-device sync.

### One-way MTG Assistant seed

- Built: switching from the tracker into MTG Assistant pre-fills the
  game-setup roster — player count, display names, life totals, and
  counters — from current tracker state. The user may still edit any seeded
  value before Decrypt.
- Built: the seed is one-way (tracker → Assistant); edits made in Assistant
  do not write back to the tracker, and returning to the tracker preserves
  its own live state.
- Built: the tracker's player count is constrained to 2–8, so seeded values
  always conform to the game-context contract. The game-wide day/night
  designation is not part of the seed.
- Built: counters ride the additive, optional `GameContext` per-player
  fields (`poison`, `experience`, `energy`, `commanderDamage`, `counters`);
  life uses the existing `lifeTotal` field. `POST /api/ask-ai` success and
  error response shapes are unchanged and no new endpoint exists. (DEC-102)

## Measured bounds

- Commander-damage cell `−`/`+` bands: ≈53px thick (REQ-112) — the cells
  still exist, so this bound survives.
- The life table always fits one screen at every supported player count,
  with no per-row or per-card minimum (DEC-136; `screen-layout.md`).
- The counter panel is full-height with no dead scrim band at any player
  count (DEC-139).
- Player count: 2–8. Starting life: 20/25/30/40 presets, Custom defaulting
  to 60. Count-driven starting-life defaults: 2 players → 20, 3+ players →
  40 (DEC-101, REQ-081).

## Rejected alternatives and deferred scope

- **Edge `−`/`+` tap zones for life adjustment, ≈67px thick (REQ-112,
  original DEC-101 shape) — closed door.** DEC-136 replaced edge bands with
  whole-card half-zones oriented by seat rotation; this bound no longer
  attaches to any surface in the tracker and does not appear in **Measured
  bounds** above.
- **Content-sized bottom-sheet counter panel (original DEC-101 shape) —
  closed door.** DEC-139 replaced it with the full-height overlay family
  described in **How it works**, above.
- **Layout mode / seat width as an input to life-zone orientation — closed
  door.** DEC-136 made seat rotation the sole orientation input for life
  adjustment zones.
- **Opt-in, toggleable day/night tracking (`dayNightEnabled`) — closed
  door.** DEC-132 made day/night tracking always-on with no Game Setup
  toggle and no persisted enable flag.
- **Deferred, not cut:** per-player theming (color/background/contrast),
  saved player profiles ("Load"), reset-with-winner, game history, mana
  counter, dice & misc, and full auto-KO automation.
- **Out of scope entirely:** Planechase / Archenemy / Bounty (internet deck
  fetches).

## Where it lives

Frontend components and tracker-local state/logic live under
`apps/frontend/src/components/portal/life-tracker/` and
`apps/frontend/src/lib/lifeTracker/`; the additive `GameContext` counter
contract touches `apps/frontend/src/types.ts` and
`apps/backend/src/{validation/askAiRequest.ts,prompt/context.ts,prompt/promptFormatting.ts}`.
See `PRD/sections/system-map.md`'s `## Player Life Tracker` entry for the
full file list and subsystem detail.
