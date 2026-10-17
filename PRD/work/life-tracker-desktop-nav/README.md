status: refined

# life-tracker-desktop-nav

On desktop, align the Life Tracker's top navigation bar with the bar on the rest of the app. The phone layout stays unchanged.

See `IDEA.md` for the verbatim request, open questions, and prior runs.

- Design: `DESIGN-BRIEF.md` — from 768px up the Life Tracker shows the shared banner header, with Day/Night and Game Setup in its right-hand slot; below 768px nothing changes. The ☰ goes in whichever header the stylesheet shows (Design item 3).
- Proposal: `GATE-QUESTIONS.md` — new REQ-248, amendments to REQ-207 and REQ-067; no blocker questions.
- Evidence: `evidence/measurements.md` (live, 2026-10-16, including the Menu docking probe across 768px).

Next: `/thejudge-quality-check PRD/work/life-tracker-desktop-nav/`

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/life-tracker-desktop-nav

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/life-tracker-desktop-nav/DESIGN-BRIEF.md`
- Findings: 1 blocking — the brief assumes the ☰ Menu button docks into whichever header is visible, but `FeaturePortalMenu.tsx:182-184` picks the first registered slot not inside a `hidden` element, so a header hidden by a CSS media query still counts as visible; with two tracker slots mounted the ☰ can stay in the hidden header across a 768px resize, breaking REQ-248's one-visible-☰ and resize criteria and clashing with REQ-096 (CSS only, no JS viewport detection). Refinement must choose and record a mechanism that fits REQ-096 and fix the brief's Design item 3, assumption 7, the touched-files list and the REQ-248 constraint wording. 3 advisory — disposition table misses grep hits (`functional-requirements.md:5679`, `:1921`, `:2003`, `:2021`; `user-flows.md:229`, `:301`, `:409`; `system-map.md:221`); REQ-067 and REQ-202 say every destination with no phone exception pointer; REQ-248 tests item should name the resize-across-768 live check attached to the PR. Full report: `QUALITY-CHECK.md`.
