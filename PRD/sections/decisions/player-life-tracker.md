# Player life tracker decisions

The suite life/counter-tracker feature: a feature-portal destination that tracks
life and all player-level counters during a game and seeds MTG Assistant game
context on handoff. UI direction is driven by the reference photos committed
under `PRD/work/player-life-tracker/references/`.

### DEC-101
- Decision: The **player-life-tracker** is a first-class suite feature registered as a **feature-portal destination** (DEC-095, shipping no navigation chrome of its own) that provides a live in-game life/counter tracker for **2–8 players**. The main screen renders each player as a large life-tinted card with a giant life total **rotated to face that player's seat** (full table orientation), using a **default seat arrangement per player count** (grid) plus a **list layout mode**, and **edge `+`/`−` tap zones** to adjust life. Each player tracks the full set of player-level counters through a per-player counter panel: a **per-opponent commander-damage matrix** (a "me" cell marking the player's own seat plus one cell per opponent) and a **palette of named counters** — Monarch, Treasure, Initiative, Poison, Ascend, Rad, Day/night, C.Tax, K.O., Energy, Exp — plus **user-added generic named counters**. Tap increments named/custom counters; a hold/secondary action exposes decrement and set. Commander-damage cells use always-visible `−`/`+` bands. **Incrementing an opponent's commander damage always decrements that player's life** (not a Game Setup toggle); all other counter changes are manual. When a player's life reaches **≤ 0 a skull indicator overlays that player's card** as a pure visual death cue (cleared when life returns above 0; **no elimination, auto-KO, or rules simulation**). **Basic game setup** covers player count (2–8 via `−`/`+`), starting-life presets (**20 / 25 / 30 / 40** plus **Custom**, whose default value is **60**), and count-driven starting-life defaults matching In-Depth (**2 players → 20**, **3+ → 40**, applied when count changes unless the user already chose a different starting life for this game). Display names are edited in the tracker's Game Setup **Edit names** disclosure (tracker-local UI). In-Depth Question continues to use the shared `PlayerRosterEditor`. A plain **reset** returns counters to starting values with no winner-selection step. Switching from the tracker into MTG Assistant performs a **one-way seed** of the game-context roster (player count, display names, life, and counters) from current tracker state; the user may still edit before Decrypt, there is no sync back, and re-entering the tracker preserves live state.
- Status: confirmed
- Context: Players already rely on standalone life-counter apps to track life and player-level counters during a game; TheJudge had no in-game surface — life was only a static field on MTG Assistant game setup (REQ-015). The user supplied reference screenshots of a real life-tracker app to drive UI direction (the IDEA's hard gate). The reference app carries much more than v1 needs; scope was bounded with the user to the readable full-table life screen, the full counter palette + commander-damage matrix, a death cue, and basic game setup, with everything else deferred. Later refinement made commander-damage→life unconditional, aligned starting-life defaults with In-Depth (REQ-015 helper), kept Custom at a 60 default instead of a fixed-60 preset pill, replaced the player-count pill row with a `−`/`+` stepper while retaining the tracker's Edit names UI, and shipped Grid/List layout as a persisted preference (DEC-103). The value is high reuse of the feature-portal (DEC-095), palette (DEC-066/068), and CSS-motion (DEC-079) systems; tracker Game Setup presentation is allowed to diverge from In-Depth's shared roster chrome.
- Impact:
  - registers a **Player Life Tracker** destination in the feature-portal registry (DEC-095); selecting it is a frontend-only view switch with no reload and preserves in-session state
  - a full-table life screen renders one rotated, life-tinted card per player (2–8) with seat arrangement per count/layout mode and edge `+`/`−` life controls
  - a per-player counter panel tracks the per-opponent commander-damage matrix, the named-counter palette, and generic custom counters
  - commander-damage→life is always on; a life ≤ 0 skull is a visual-only death cue
  - basic game setup includes player count (`−`/`+` 2–8), starting-life presets (20/25/30/40 + Custom defaulting to 60), count-driven 20/40 defaults matching In-Depth, Edit names, Grid/List layout, and plain reset / New Game
  - one-way seed of MTG Assistant game context on handoff (REQ-085); counters ride the additive GameContext fields (DEC-102) and life uses the existing `lifeTotal`
  - chrome/frontend only aside from the additive counter contract (DEC-102); no new product-facing endpoint and no server-side tracker state
- Related requirements:
  - REQ-081
  - REQ-082
  - REQ-085
  - REQ-111
  - REQ-112
  - FLOW-013
  - DEC-095
  - DEC-102
  - DEC-103
  - DEC-132
- Notes:
  - **deferred (not cut):** per-player theming (color/background/contrast), saved player profiles ("Load"), reset-with-winner, game history, mana counter, dice & misc, and full auto-KO automation
  - **out of scope entirely:** Planechase / Archenemy / Bounty (internet deck fetches)
  - Grid/List layout mode is in scope and persisted (DEC-103); it is not deferred
  - not a rules engine, no board/zone tracking, no multi-device sync (DEC-013); does not replace the staged zone / Ask AI flow — only feeds player-facing context into it
  - reuses DEC-066/068 (palette), DEC-079/NFR-006 (CSS motion), NFR-001 (mobile-first); tracker Game Setup does not reuse `PlayerRosterEditor` (In-Depth still does)

### DEC-103
- Decision: player-life-tracker game state **persists to browser-local storage** so a live game survives a page reload / phone-lock, intentionally **diverging from the in-session-only suite navigation convention (DEC-089 / DEC-095) for this feature only**. Persisted state includes the roster (player count and display names), each player's life and all counters, the commander-damage matrix, the starting-life setting, game-wide `dayNightPhase` (DEC-132), and presentation preferences (layout mode, card style). State is restored on load and is cleared only by an explicit **New Game / reset** (presentation preferences may survive New Game). Persistence is **frontend-only and single-device** — no server-side store and no cross-device sync.
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
  - later refinement (DEC-132) dropped the opt-in `dayNightEnabled` flag; persisted state keeps game-wide `dayNightPhase` always, plus presentation preferences such as layout mode and card style

### DEC-132
- Decision: Player Life Tracker **day/night designation tracking is always on**. There is no Game Setup toggle and no persisted `dayNightEnabled` flag. A compact header control always shows the current game-wide designation (`day` / `night`) and flips it on tap. The designation is **manual only** — never auto-derived from turns or spells. The game-wide phase is **not** seeded into In-Depth / `GameContext` (no field or seed wiring today). This amends the prior opt-in day/night model recorded in the refinement brief.
- Status: confirmed
- Context: Users liked the day/night flip control but did not want to dig into Game Setup to enable it; prefer always-available tracking and a smaller Game Setup surface. Auto-derivation still requires turn/spell data the tracker does not have. Seeding into In-Depth was considered and explicitly deferred because the contract/wiring is absent.
- Impact:
  - remove the Game Setup day/night On/Off row and all `dayNightEnabled` state / persistence / New Game preference carry-over
  - header ☀/☾ control is always visible; tap flips `dayNightPhase`; Reset returns phase to day
  - old saves that still carry `dayNightEnabled` load; the field is ignored
  - no `GameContext`, seed, Ask AI, or prompt-assembly change
- Related requirements:
  - REQ-111
  - REQ-081
  - REQ-084
  - DEC-101
  - DEC-103
  - FLOW-013
- Notes:
  - distinct from the per-player named “Day/night” counter in the palette (REQ-082), which remains a separate optional counter

### DEC-136
- Decision: Two post-ship corrections to the life table (DEC-101). (1) **Life adjustment splits the whole player card in half** rather than reserving edge bands: every part of a card that is not one of its three inner controls (the life total, the commander-damage preview, the inline life input) adjusts life. Which half is `−` and which is `+` derives from that seat's own **rotation**, so `−` is always on that player's left and `+` on their right — mirrored for seats facing the top edge, split along the other axis for sideways seats. Layout mode and seat width no longer participate in that choice. The `−` / `+` glyphs stay pinned to their half's outer edge, so the card reads as it did with edge bands. (2) The life table **always fits one screen at every supported player count**: rows share the shell's height with no per-row or per-card minimum, and card contents size in container-query units so a shorter card scales rather than clipping.
- Status: confirmed
- Context: Live use found list mode's `−` / `+` misplaced — paired rows kept top/bottom bands while head/foot rows used left/right, and the head seat's 180° rotation put `−` on the player's right — and the 67px bands too small to hit reliably mid-game. The product owner proposed halving the card instead. Separately, at 5+ players the old floors (`min-h-60` per card plus `minmax(15rem, 1fr)` rows plus a `rows × 16rem` table minimum) summed past the viewport and pushed the bottom seats below the fold, which a live tabletop tracker cannot afford.
- Impact:
  - each card renders exactly two half-sized life zones, orientated by `SeatPlacement.rotation` alone
  - the rotated content box becomes non-interactive as a box (its three real controls stay interactive), so taps anywhere else on the card reach the half beneath — tapping the life total for a custom entry and tapping the commander-damage preview to open the counter panel both behave exactly as before
  - the table is capped by the viewport rather than floored by it; rows are `minmax(0, 1fr)` and cards carry no height minimum
  - life total, name pill, and inline life entry size in container-query units within clamped bounds, so 2-player and 8-player tables both compose without clipping
  - grid and list seat arrangements, rotations, tints, skull indicator, counters, commander-damage semantics, persistence, Game Setup, and In-Depth seeding are all unchanged
- Related requirements:
  - REQ-081
  - REQ-084
  - DEC-101
  - DEC-103
  - DEC-117
  - NFR-001
- Notes:
  - supersedes the edge-band tap-zone treatment in DEC-101 ("edge `+`/`−` tap zones") for player life cards only; commander-damage cells keep their own always-visible `−`/`+` bands
  - `PlayerLifeCard` no longer takes `layoutMode` / `isWideSeat`; rotation is the sole orientation input
  - non-goals: changing seat arrangements or rotations, hold-to-repeat life adjustment, per-card layout preferences
