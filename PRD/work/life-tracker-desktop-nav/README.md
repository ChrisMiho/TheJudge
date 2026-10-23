status: owner-action

# life-tracker-desktop-nav

On desktop, align the Life Tracker's top navigation bar with the bar on the rest of the app. The phone layout stays unchanged.

See `IDEA.md` for the verbatim request, open questions, and prior runs.

- Design: `DESIGN-BRIEF.md` — from 768px up the Life Tracker shows the shared banner header, with Day/Night and Game Setup in its right-hand slot; below 768px nothing changes. The ☰ goes in whichever header the stylesheet shows (Design item 3).
- Proposal: `GATE-QUESTIONS.md` — new REQ-248, amendments to REQ-207 and REQ-067; no blocker questions.
- Evidence: `evidence/measurements.md` (live, 2026-10-16, including the Menu docking probe across 768px).

Next: answer `PRD/work/life-tracker-desktop-nav/GATE-QUESTIONS.md`, then merge the docs PR to build (`graph-implement` picks it up).

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/life-tracker-desktop-nav

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/life-tracker-desktop-nav/DESIGN-BRIEF.md`
- Findings: none blocking. Advisory only — the mock-strip rule may need a `PageShell.tsx` change (the brief says possibly), so build should confirm it early. Full report: `QUALITY-CHECK.md` (attempt 2; attempt 1 FAIL findings all resolved).
