status: active

# ui-look-translation

Translate the approved direction-1 mockup into the app faithfully. See `IDEA.md`.

Request (verbatim intake, evidence not authority): `intake/GRAPH-BRIEF-2-look-translation.md`
Supersession note: the intake's "Base: `origin/main` after PR #239 merges" is superseded by the owner's decision to stack this run on PR #239's branch (`origin/thejudge-auto/ui-reimagining-build-work`); the intake's "DEC-092" helper-text rule is proposed for amendment where it now lives, REQ-070 (see `DESIGN-BRIEF.md`); the intake's item 3, "A6 — General rules topics" (line 162: "The first gate kept this panel on Ask a Question"), is superseded by the owner's REQ-079 gate verdict (2026-10-02, `edit`: retire) — the panel is removed from Ask a Question.

Design: `DESIGN-BRIEF.md`. Proposal for the define gate: `GATE-QUESTIONS.md` (14 blocks; answered by the owner on 2026-10-02 — 13 accept, 1 edit (REQ-079 retired) — and applied by gate-review).

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/ui-reimagining-build-work

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/ui-look-translation/DESIGN-BRIEF.md`
- Findings: none (attempt 3, 2026-10-02 — re-grade after the owner's 14 verdicts were applied: brief and REQ-079 retire block agree, retire diff complete and line-level against this checkout (92 removed lines matched, `screen-layout.md` zero hits), 13 accept blocks unchanged, per-slice criteria concrete, REQ-216 cited; trivial fix applied: brief owner paragraph counts four look rules, not five)

## Slices

Plan: `GAMEPLAN.md`. Criteria: `slice-<letter>.criteria.json`.

| Slice | Doc | Mockup page | Depends on | Gate blocks applied | Status |
| --- | --- | --- | --- | --- | --- |
| A Frame | `slice-a-frame.md` | `shared-chrome-menu.html` | none | NFR-006, REQ-207, REQ-216 | done |
| B Ask a Question | `slice-b-ask-a-question.md` | `quick-question.html` | A | FLOW-011, REQ-124, REQ-079 (retire), REQ-070, REQ-206, REQ-167 | done |
| C In-depth details | `slice-c-in-depth-details.md` | `in-depth-question.html` | A | REQ-209 | done |
| D Trade Balancer | `slice-d-trade-balancer.md` | `trade-balancer.html` | A | REQ-215 | done |
| E Card scanner | `slice-e-card-scanner.md` | `card-scan.html` | A | REQ-214 | done |
| F Life Tracker menus | `slice-f-life-tracker-menus.md` | `life-tracker-menus.html` | A | REQ-202, REQ-082 | planned |

## Implementation map

- Stylesheet layer: `apps/frontend/src/styles/{tokens,shell,flow,ambience}.css` (A); scene: `components/AmbientScene.tsx` (A); header and shared sheets (A).
- Compare script: `scripts/compare-screenshot-pair.mjs` and `.test.mjs` (A).
- Screens: Ask a Question (B), In-depth (C), Trade Balancer (D), scanner (E), Life Tracker menus (F).
- Captures and `DIFF-RESULTS.md`: `docs/design/ui-reimagining/build-screenshots/translation/<screen>/` (outside `PRD/work/`).
