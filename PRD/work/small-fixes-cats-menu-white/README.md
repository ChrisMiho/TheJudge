status: ship-ready

# small-fixes-cats-menu-white

Four small fixes: cats Easter egg, bigger desktop menu button, White as the default colour, no menu scrollbar. See `IDEA.md`. Owner request: `intake/owner-request.md` (evidence only).

- Design brief: `DESIGN-BRIEF.md`
- Proposed product truth (owner answers): `GATE-QUESTIONS.md` — REQ-203, REQ-207, REQ-099, REQ-044, FLOW-007, REQ-113
- Live measurements: `evidence/measurements.md` (screenshots in `.playwright-mcp/`, local only)

## Slices

Plan: `GAMEPLAN.md`. All three are independent; C runs last for the whole-package check.

| Slice | Doc | Criteria | Goal | Depends on |
| --- | --- | --- | --- | --- |
| A | `slice-a-cats-everywhere.md` | `slice-a.criteria.json` | Cats Easter egg on every in-scope screen (REQ-203) | none |
| B | `slice-b-menu-button-and-tray.md` | `slice-b.criteria.json` | Glowing wider desktop ☰; no sideways menu scrollbar (REQ-207, REQ-113) | none |
| C | `slice-c-white-default.md` | `slice-c.criteria.json` | White default colour (REQ-099, REQ-044, FLOW-007); final slice with ship gates | none |

Each slice applies its share of the accepted `PRD/sections/` amendments by intent, with the code, in the same PR.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/small-fixes-cats-menu-white/DESIGN-BRIEF.md`
- Findings: none (build-half re-grade, run `graph-20261014-234321`, 2026-10-14, after gate resolution with six accepts). The owner's REQ-207 revision made during the park (45px bars, soft glow, phone size unchanged, no box) is graded and consistent across the brief, the slot and the evidence; every `GATE-QUESTIONS.md` diff anchor matches today's `PRD/sections/`. Full report: `QUALITY-CHECK.md`.
