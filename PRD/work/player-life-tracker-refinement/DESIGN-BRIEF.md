# DESIGN-BRIEF: player-life-tracker-refinement

Status: proceeding under explicit user authorization to implement without an interactive approval round (overnight, unattended session — see `README.md` status note). This brief still records the required screenshot-vs-shipped diff and the resulting scope so it can be reviewed after the fact.

## Diff: shipped implementation vs. in-scope reference screenshots

Checked live against a running `npm run dev` build (`localhost:5173`, 4-player game) on 2026-08-03.

### Main tracker layout (`IMG_9504.PNG`)
- **Reference**: the life table is the entire screen. No app header, no visible settings/roster chrome. A thin control bar sits between the two halves (undo, turn counter, history, player-color dots, dice) — those controls map to deferred scope (turn timer/history: `IMG_9510`; dice & misc: `IMG_9512`) and are **not** being added here.
- **Shipped**: `TheJudge` brand block + `Player Life Tracker` heading, then a full `GameSetupPanel` (starting-life presets, commander-damage toggle, custom-life form, Reset/New Game) and the roster editor row, all always visible above the table — the table doesn't dominate the screen the way the reference's does.
- **Fix**: keep the header (an existing accessibility contract — `heading` "Player Life Tracker" is asserted by tests — so it stays, just visually slimmer) but move `GameSetupPanel` + the roster section behind a single collapsed-by-default disclosure (mirrors the existing `PlayerRosterEditor` expand/collapse pattern already in this codebase), so the table is the dominant view by default, closing the largest structural gap without introducing new routing/navigation.

### Life cards (`IMG_9504.PNG`)
- **Reference**: light pastel gradient cards, bold near-black life numbers, light rounded name pill, +/- glyphs as thin bands at the card's top and bottom edges.
- **Shipped**: near-black/zinc cards, white numbers, low contrast; **the life number visually overlaps the rotated name pill and the "Counters" button** at default card height (a real readability bug, independent of the reference match — confirmed live in the browser, not just from source); +/- tap zones are on the left/right vertical thirds, not top/bottom.
- **Fix**: light pastel gradient background (state-tinted: healthy/critical/dead, via the existing `--accent` tokens so the user's chosen theme palette still applies) with dark text; move the "Counters" affordance into the same rotated flex content block as the name pill and life number (instead of an independently fixed-position button) so nothing collides at any rotation; move +/- tap zones to top/bottom bands.
- **Scoped out**: the reference's compact 2×2 "mini commander-damage preview" tile embedded on the card face. It only has a clean 2×2 shape for exactly 4 players — 2/3/5–8-player games would need a different, undesigned layout, and the existing "Counters" button already exposes the same data. Left as a follow-up idea rather than shipping a half-designed variant. Per-seat "different pastel per player" is also not replicated — in the reference it most likely reflects either per-card randomness or the deferred winner/reset-with-winner state (`IMG_9508`, `Player 4` shown desaturated with a trophy badge), not a deliberate design system worth reverse-engineering.

### Counter panel (`IMG_9505.PNG` / `IMG_9506.PNG`)
- **Reference**: light modal, vertical Player/Counters tab bar on the right edge, icon-forward tiles for each named counter.
- **Shipped**: dark zinc modal, horizontal top tab bar, text-only tiles.
- **Fix**: flip to a light card matching the tracker's new palette; add a small icon glyph per named counter tile (Monarch/Treasure/Poison/etc.) alongside the existing text label (label text and all `aria-label`s unchanged, so this is additive only).
- **Scoped out**: converting the tab bar to a vertical right-side layout — real value, but lower priority than the color/contrast/icon fixes and a separate structural change; left as a follow-up.

### Settings (`IMG_9509.PNG`)
- **Reference**: dedicated dark full-screen "Settings" page: Players as a 2–6 pill row, a Layout selector (grid vs. list), Starting-life pill row, then a "Gameplay" section of iOS-style toggle rows (Planechase/Archenemy/Bounty/Auto-KO/Commander-damage-life-loss/Turn timer/Game history).
- **Shipped**: `GameSetupPanel` embedded inline as one card; starting-life presets already closely match the reference's pill style. Player-count uses a +/- stepper (in the shared `PlayerRosterEditor`, reused by MTG Assistant — not tracker-specific).
- **Fix**: restyle `GameSetupPanel`'s existing rows (starting-life pills, commander-damage-to-life control) to the reference's iOS list-row look, and move it behind the new collapsed-by-default disclosure described above.
- **Scoped out**: a Layout selector (grid vs. list) — the tracker only implements one layout algorithm (`seatArrangement`); building a second layout mode is new functionality, not a styling refinement. Restyling the player-count stepper into 2–6 pills — that control lives in the shared `PlayerRosterEditor`, also used by MTG Assistant, and changing its visual language would leak into that unrelated screen. The Gameplay toggle rows (Planechase/Archenemy/Bounty/Turn timer/Game history/full Auto-KO) — these map to features that are either explicitly deferred (`README.md`: game history, mana counter, full auto-KO) or were never implemented at all for this feature; adding UI for capabilities that don't exist would be scope creep, not refinement.

## Non-goals reaffirmed
No change to `GameContext` counter contract (DEC-102), seed handoff (REQ-085), or persistence behavior (DEC-103). No new counters/mechanics. Nothing here reopens per-player theming, saved profiles, game history, mana counter, dice & misc, or full auto-KO.

## Addendum: commander-damage/counters follow-up pass (2026-08-03, second overnight session)

The first pass above shipped the main-layout and life-card fixes; user follow-up review (live on the shipped build) called out that the counter/commander-damage menus specifically still didn't resemble `IMG_9505.PNG`/`IMG_9506.PNG`. This addendum reverses two items the original brief scoped out, at explicit user request, and stays inside the same non-goals (no `GameContext`/persistence/seed contract changes, no new counter mechanics):

- **On-card commander-damage entry point** (`IMG_9504.PNG`'s small grid of boxes at the corner of each life card, previously scoped out above as "no clean layout for non-4-player counts"): implemented as a read-only preview grid (one "me" tile + one tile per opponent, showing each opponent's current commander-damage value) that replaces the old text-only "Counters" button. Column count is `ceil(sqrt(seatCount))` so it degrades to a clean near-square grid at any supported player count (2-8), not just 4 — verified live at 4 and 6 players with no collision against the life number/name pill. The whole grid is one button (`aria-label="Open counters for {name}"`, unchanged) that opens the same counter panel; it doesn't add its own increment/decrement behavior on the card face.
- **Named-counter tile treatment** (`IMG_9505.PNG`/`IMG_9506.PNG`): named/custom counter tiles are now icon-forward and ghosted (grayscale icon, muted label/value) at zero, becoming colored/highlighted once incremented — matching the reference's "Poison" activated-tile look. The commander-damage matrix tiles keep the original value-forward look (pastel accent tiles, always-visible number), which already matched the reference.
- **Not touched**: the horizontal top tab bar (Player/Counters) stays horizontal — converting it to the reference's vertical right-edge tab bar remains its own follow-up (unchanged from the original scope-out above); no reference screenshot of the "Counters" tab's alternate content exists to confirm a redesign there beyond the icon/ghosting pass already done.
