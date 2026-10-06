status: active

# rules-test-harness

Rules test harness, run 1: six-layer-ready case format, offline gate (dropped cards, missed rules), on-demand budget-safe answer grader, owner review flow, about 400 cases (every real mechanic once plus about 120 hard interactions).

- Idea: [IDEA.md](IDEA.md)
- Intake (evidence, never authority): [intake/GRAPH-BRIEF.md](intake/GRAPH-BRIEF.md); [intake/jon-rulemancer/](intake/jon-rulemancer/) — three screenshots of Jon's Rulemancer app answering tester case Q2, added at the owner's direction 2026-10-06 (see `DESIGN-BRIEF.md` `### Tester case Q2`)
- Design brief: [DESIGN-BRIEF.md](DESIGN-BRIEF.md)
- Proposed product truth and owner questions: [GATE-QUESTIONS.md](GATE-QUESTIONS.md) — REQ-185–190, NFR-018 amended; REQ-222–225 new; Q-007, Q-008
- Scratch measurement scripts: [measure/](measure/)

## Slices

Mapped 2026-10-06 (graph node 5). Full plan: [GAMEPLAN.md](GAMEPLAN.md). One code PR into `main` carries all seven; each slice has a `slice-<letter>.criteria.json` beside it.

| Slice | Doc | Depends on | One-line scope |
| --- | --- | --- | --- |
| A | [slice-a-format-v2-loader.md](slice-a-format-v2-loader.md) | none | Format v2, shared loader, stale comparison, `buildCaseRequest`, migrate the 18 |
| B | [slice-b-offline-prompt-gate.md](slice-b-offline-prompt-gate.md) | A | Offline prompt gate, frozen vectors, re-freeze check |
| C | [slice-c-live-runner.md](slice-c-live-runner.md) | A | Live runner: `--changed`, per-case merge, per-tier headline, judge usage |
| D | [slice-d-owner-review-flow.md](slice-d-owner-review-flow.md) | A | Review render and apply commands |
| E | [slice-e-coverage-staleness.md](slice-e-coverage-staleness.md) | A, B, D | Coverage command and report, `coverage.json`, staleness report |
| F | [slice-f-mechanic-cases.md](slice-f-mechanic-cases.md) | A-E | 255 mechanic drafts; coverage gate wired into `quality:check` |
| G | [slice-g-hard-area-depth.md](slice-g-hard-area-depth.md) | A-F | 120 hard-area drafts incl. both tester cases; REQ-185 applied |

## Implementation map

PRD truth lands per slice by rule A21 (table in `GAMEPLAN.md`): B system-map entry; C REQ-186/187/190 + answer-quality entry; E REQ-189/222/224/225; F REQ-188/223, NFR-018, goals line, `## Eval harness`; G REQ-185. Q-007 and Q-008 accepted at the recommendation (255 mechanic cases; 0 extra tier-3).

Build progress (graph node 6, `build`, one commit per slice on `thejudge-auto/rules-test-harness-work`):

- A: done (format v2 loader, request builder, 18 migrated, README rewritten)
- B: done (offline prompt gate in `apps/backend/src/eval/rules-gate/`, frozen vectors, baseline at 16 hits, system-map entry as partial)
- C: done (live runner: selection, per-case merge, per-tier headline, judge usage; REQ-186/187/190 and the answer-quality system-map entry applied)
- D: done (review render and apply commands; an edit verdict lands in `needs-edit`, see the slice doc note)
- E: done (coverage command and gate as tested code, not yet in `quality:check`; `coverage.json`; staleness report; REQ-189/222/224/225 applied; optional `source.pool` field added for the coverage split)
- F: done (255 mechanic drafts, coverage gate wired into `quality:check` through `scripts/rules-coverage-gate.test.mjs`, ratchet baseline for 273 cases, REQ-188/223/NFR-018/goals line/Eval harness summary applied)

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/rules-test-harness/DESIGN-BRIEF.md`
- Findings: none
