# Excess Player UI — DESIGN BRIEF

## Scope

Reduce visual overload in In-Depth Question's game-context step after Player Life Tracker counter fields made every expanded player card substantially denser. Keep the existing **Players in game** outer disclosure, player-count controls, and editable player data, but make display name + life total each player's compact baseline and place secondary fields behind synchronized nested arrows.

The approved visual direction is `mock-a-nested-player-accordion.png`. It is directional layout evidence only: generated text in the image is not product copy, and the canonical helper remains `Tap ▾ to set names and life totals — 2 players start at 20, 3+ at 40.`

## Approved interaction

- The existing section-wide **Players in game** disclosure remains collapsed by default.
- Opening it shows one compact card per active player; each card always exposes display name and life total.
- Every player card has its own secondary-details arrow, but the arrows control one shared state.
- Secondary details start collapsed. Activating any player's arrow expands Poison, Energy, Experience, Commander damage, and populated named counters for all active players; activating any arrow again collapses all players.
- Every arrow reflects the same expanded/collapsed state and communicates the all-player effect accessibly.
- Adding a player while expanded makes the new active card follow the shared expanded state. Removing a player leaves the shared state unchanged for remaining players.
- Closing the outer roster disclosure or leaving and later returning to In-Depth Question resets secondary details collapsed.
- Resetting presentation preserves the outer roster-disclosure state, player count, names, life totals, counter values, staged-flow step, and all other in-progress destination data.

## Decisions

- **DEC-120** (`decisions/ui-presentation.md`) — retain the outer roster disclosure; render name/life as the compact per-player baseline; use repeated per-player arrows backed by one synchronized secondary-details state that defaults/resets collapsed without changing player data; narrowly amend DEC-095's destination-state preservation guarantee for this presentation state only.

## Requirements & flow

- **REQ-100** — compact synchronized player-secondary disclosure, including touch sizing, shared accessibility state, add/remove behavior, reset boundaries, destination-return behavior, and value-preservation coverage.
- **FLOW-001** — Game setup now describes compact player cards and the synchronized all-player secondary-details interaction; the flow and submitted payload remain otherwise unchanged.

## Design direction (for map-out; not yet implementation)

- Reuse the existing `PlayerRosterEditor` and In-Depth Question player/counter inputs; restructure their presentation rather than creating another roster or counter model.
- Keep one authoritative secondary-details boolean for the active In-Depth Question roster. Per-player arrows read and toggle that same value; do not create per-player expansion state.
- Reset that boolean when the outer disclosure closes and on the destination's active → inactive transition, so returning through the feature portal lands compact even though destination components remain mounted.
- Keep values in their existing owners. Visibility changes must never rebuild, normalize, or clear player/counter data.
- Preserve automatic mobile-first responsiveness (DEC-117/REQ-096), ≥44px disclosure targets (REQ-069/NFR-001), existing accent/motion treatment, and semantic disclosure attributes.

## Alternatives considered

- **Selected: nested synchronized per-player arrows (Mock A).** Keeps the control next to each player while matching the product owner's expectation that secondary context is normally completed for the whole table.
- **Rejected: one global secondary-details bar (Mock B).** Behavior is clear, but the control is detached from the player card whose information it reveals.
- **Rejected: always-visible compact roster (Mock C).** Removes the existing outer disclosure and increases baseline game-context height.
- **Rejected: independent per-player expansion.** Allows mixed states that do not match the expected all-player data-entry task.

## Non-goals

No change to player count, display-name/life/counter values, validation, default life totals, active-player behavior, Player Life Tracker UI, tracker persistence or seeding, `GameContext`, request/response schemas, prompt assembly, backend behavior, counter inventory, feature-portal persistence, or any other game-context layout. No new guidance copy, UI dependency, device-specific component tree, or persisted disclosure preference.

## Reused, unchanged

- REQ-015 / FLOW-001 game-context capture and fixed `PlayerLabel` identity.
- DEC-091 / REQ-069 outer player-control ergonomics and ≥44px touch targets.
- DEC-092 / REQ-070 canonical helper copy.
- DEC-117 / REQ-096 automatic fluid responsive presentation.
- FLOW-010 destination switching and in-session value preservation; DEC-120 adds only a presentation-state reset when In-Depth Question is re-entered.

## Open questions

None.
