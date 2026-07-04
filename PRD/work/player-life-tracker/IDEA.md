# player-life-tracker

Players already use dedicated life-counter apps to track life totals and player-level counters (commander damage, poison, experience, and other counter types) during a game. TheJudge has no equivalent in-game surface — life is only a static field on MTG Assistant game-context setup.

Outcome: ship that same easy, readable life/counter-tracker functionality as a first-class suite feature. Reuse the main-flow player-setup pre-screen and players UI (extract/share as needed). When the user enters MTG Assistant, tracker state auto-populates game context. Persistence and cleanup rules cover session boundaries and related edge cases.

Non-goals: not inventing a novel category — match the established life-tracker job-to-be-done. Not a rules engine or full board/zone tracker; not multi-device sync; does not replace the staged zone / Ask AI flow — only feeds player-facing context into it.

## Refinement reminder (required)

UI should be driven by real examples of existing life-tracker apps. If `PRD/work/player-life-tracker/` has no reference photos/screenshots when `thejudge-refinement` runs, the agent must prompt the user for them before locking UI direction in the DESIGN-BRIEF (do not invent layout from memory alone).
