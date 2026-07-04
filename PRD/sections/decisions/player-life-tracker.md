# Player life tracker decisions

The suite life/counter-tracker feature: a feature-portal destination that tracks
life and all player-level counters during a game and seeds MTG Assistant game
context on handoff. UI direction is driven by the reference photos committed
under `PRD/work/player-life-tracker/references/`.

### DEC-101
- Decision: The **player-life-tracker** is a first-class suite feature registered as a **feature-portal destination** (DEC-095, shipping no navigation chrome of its own) that provides a live in-game life/counter tracker for **2–8 players**. The main screen renders each player as a large life-tinted card with a giant life total **rotated to face that player's seat** (full table orientation), using a **default seat arrangement per player count** and **edge `+`/`−` tap zones** to adjust life. Each player tracks the full set of player-level counters through a per-player counter panel: a **per-opponent commander-damage matrix** (a "me" cell marking the player's own seat plus one cell per opponent) and a **palette of named counters** — Monarch, Treasure, Initiative, Poison, Ascend, Rad, Day/night, C.Tax, K.O., Energy, Exp — plus **user-added generic named counters**. Tap increments; a hold/secondary action exposes decrement and set. An optional **per-game setting makes incrementing an opponent's commander damage also decrement that player's life**; all other counter changes are manual. When a player's life reaches **≤ 0 a skull indicator overlays that player's card** as a pure visual death cue (cleared when life returns above 0; **no elimination, auto-KO, or rules simulation**). **Basic game setup** covers player count (2–8) and starting-life presets (20/25/30/40/60/custom); a plain **reset** returns counters to starting values with no winner-selection step. The tracker **reuses the extracted player roster** shared with the MTG Assistant game-setup step. Switching from the tracker into MTG Assistant performs a **one-way seed** of the game-context roster (player count, display names, life, and counters) from current tracker state; the user may still edit before Decrypt, there is no sync back, and re-entering the tracker preserves live state.
- Status: confirmed
- Context: Players already rely on standalone life-counter apps to track life and player-level counters during a game; TheJudge had no in-game surface — life was only a static field on MTG Assistant game setup (REQ-015). The user supplied reference screenshots of a real life-tracker app to drive UI direction (the IDEA's hard gate). The reference app carries much more than v1 needs; scope was bounded with the user to the readable full-table life screen, the full counter palette + commander-damage matrix, a death cue, and basic game setup, with everything else deferred. The value is high reuse: the feature-portal (DEC-095) already owns suite navigation, the game-setup roster already models players/display names/life (REQ-015/DEC-027/DEC-091), and the palette (DEC-066/068), density (DEC-075), and CSS-motion (DEC-079) systems already exist.
- Impact:
  - registers a **Player Life Tracker** destination in the feature-portal registry (DEC-095); selecting it is a frontend-only view switch with no reload and preserves in-session state
  - a full-table life screen renders one rotated, life-tinted card per player (2–8) with a default seat arrangement per count and edge `+`/`−` life controls
  - a per-player counter panel tracks the per-opponent commander-damage matrix, the named-counter palette, and generic custom counters
  - an optional per-game commander-damage→life setting is the only convenience automation; a life ≤ 0 skull is a visual-only death cue
  - basic game setup (player count 2–8, starting-life preset) and a plain reset are included; the player roster is the shared component used by MTG Assistant game setup
  - one-way seed of MTG Assistant game context on handoff (REQ-085); counters ride the additive GameContext fields (DEC-102) and life uses the existing `lifeTotal`
  - chrome/frontend only aside from the additive counter contract (DEC-102); no new product-facing endpoint and no server-side tracker state
- Related requirements:
  - REQ-081
  - REQ-082
  - REQ-085
  - FLOW-013
  - DEC-095
  - DEC-102
  - DEC-103
- Notes:
  - **deferred (not cut):** per-player theming (color/background/contrast), saved player profiles ("Load"), reset-with-winner, game history, mana counter, dice & misc, the settings layout-arrangement toggle, and full auto-KO automation
  - **out of scope entirely:** Planechase / Archenemy / Bounty (internet deck fetches)
  - not a rules engine, no board/zone tracking, no multi-device sync (DEC-013); does not replace the staged zone / Ask AI flow — only feeds player-facing context into it
  - reuses DEC-066/068 (palette), DEC-075 (density), DEC-079/NFR-006 (CSS motion), NFR-001 (mobile-first)

### DEC-103
- Decision: player-life-tracker game state **persists to browser-local storage** so a live game survives a page reload / phone-lock, intentionally **diverging from the in-session-only suite navigation convention (DEC-089 / DEC-095) for this feature only**. Persisted state includes the roster (player count and display names), each player's life and all counters, the commander-damage matrix, the commander-damage→life option, and the starting-life setting. State is restored on load and is cleared only by an explicit **New Game / reset**. Persistence is **frontend-only and single-device** — no server-side store and no cross-device sync.
- Status: confirmed
- Context: A life tracker used through a real game (roughly an hour, with the phone locking and waking repeatedly) must not lose life totals to a refresh or lock; the suite's frontend-only, no-persistence-across-reload convention would make the tracker unusable for its core job. `ThemeControl` (DEC-066) already establishes a browser-local persistence pattern in the app, so this reuses an existing approach rather than introducing new infrastructure.
- Impact:
  - tracker state is written to a browser-local storage key and restored on mount
  - an explicit New Game / reset clears persisted state and returns to starting values
  - the MTG Assistant handoff (REQ-085) seeds from current in-memory tracker state; persistence is for the tracker itself, not the seed
  - no backend, no server-side session store, no cross-device sync
- Related requirements:
  - REQ-084
  - REQ-081
  - DEC-101
- Notes:
  - diverges from DEC-089 / DEC-095 for this feature only; other suite modes remain in-session-only
