# Sweep finding — player-life-tracker

- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/PRD/sections/decisions/player-life-tracker.md
- Scored against: 7 current-state specs under PRD/sections/<feature>/README.md
- Items: 5

## DEC-101 — absorbed
Every clause of the core tracker decision (feature-portal destination, 2–8 rotated life-tinted cards, grid/list layout, counter panel with commander-damage matrix and named/custom counters, always-on commander-damage→life, ≤0 skull as visual-only, Game Setup with `−`/`+` player count, 20/25/30/40+Custom(60) starting life, count-driven 2→20/3+→40 defaults, tracker-local Edit names vs. In-Depth's `PlayerRosterEditor`, plain reset, one-way MTG Assistant seed) is present in `life-tracker/README.md`; the one clause it superseded in place (edge `+`/`−` tap zones) is correctly carried as a closed door citing DEC-136, and the seed/counter-contract details cross-check against `in-depth/README.md`'s additive `GameContext` fields.

## DEC-103 — absorbed
Browser-local persistence, its scope (roster, life, counters, commander-damage matrix, starting life, day/night phase, layout/card-style presentation prefs), restore-on-load, New-Game-only clearing (with presentation prefs surviving), and frontend-only/single-device framing are all stated in `life-tracker/README.md`'s Persistence section, matching the decision's Impact list verbatim in substance.

## DEC-132 — absorbed
The always-on day/night model — no Game Setup toggle, no persisted `dayNightEnabled`, header control always visible and tap-to-flip, manual-only (never auto-derived), not seeded into In-Depth/`GameContext`, and distinct from the palette's named "Day/night" counter — is fully stated in `life-tracker/README.md`'s "Day/night header control" section, and the closed door is listed under "Rejected alternatives."

## DEC-136 — absorbed
Both post-ship corrections are captured: life-adjustment split into two rotation-oriented halves (glyphs pinned to each half's outer edge, only the three inner controls staying separately interactive) is in the "Life table" section's second bullet, and the always-fits-one-screen table sizing (no per-row/per-card minimum, container-query content scaling) is the third bullet. The superseded edge-band shape is listed under "Rejected alternatives" citing DEC-136.

## DEC-139 — absorbed
The counter panel joining the full-height overlay family (fills shell height instead of content-sizing, internal scroll, no dead scrim band) is stated in the "Counter panel and commander-damage matrix" section and echoed in `shared-chrome/README.md`'s shared overlay-close-control bullet, which explicitly names "Life Tracker's counter and game-setup panels" as part of that family — consistent cross-spec absorption.
