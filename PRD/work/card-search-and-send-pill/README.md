status: active

# card-search-and-send-pill

Two player-facing defects from `PRD/ideasForLater/hardtofind/hardtosearch.md`: card search misses names with commas, and the send pill shows an empty half on Firefox. See `IDEA.md`; evidence in `intake/` and `evidence/measurements.md`.

Refined 2026-10-13: `DESIGN-BRIEF.md` (scope, decisions, assumptions) and `GATE-QUESTIONS.md` (amendments to REQ-002, REQ-212, REQ-206; no new stable ID; no blocker).

Quality-check PASS 2026-10-13. Owner accepted all three gate questions (docs PR #304, merged). Build half claimed on `thejudge-auto/card-search-and-send-pill-work`; re-graded PASS after gate resolution.

## Slices

| Slice | Doc | Goal | Depends on |
| --- | --- | --- | --- |
| A | `slice-a-card-search-punctuation.md` | Card search ignores punctuation and accents (REQ-002) | none |
| B | `slice-b-no-mic-send-pill.md` | No-mic send pill is one round arrow (REQ-212, REQ-206) | none |

Plan: `GAMEPLAN.md`. Each slice's `build` applies its share of the accepted `PRD/sections/` amendments with the code. No deliverable lands in `PRD/work/`.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/card-search-and-send-pill/DESIGN-BRIEF.md`
- Findings: none

Re-graded 2026-10-13 (graph node `gate-qc`, build half `graph-20261014-034941`, attempt 1) after gate resolution, with the finalized `GATE-QUESTIONS.md` (REQ-002, REQ-212, REQ-206 accepted), `evidence/measurements.md`, `IDEA.md` and `intake/`, against `PRD/sections/` on the branch (cut from `origin/main` `f84e22b1`):

- All five diff anchors still match `PRD/sections/functional-requirements.md` verbatim (REQ-002 line 19; REQ-206 ring criterion 5331 and Notes insertion after 5361; REQ-212 criteria 5534, 5539 and Notes after the slice K note).
- Cited REQ-001, REQ-065, REQ-167 content and the `system-map.md` Fuzzy autocomplete heading (line 260) are real; the Trade Balancer `Lives in` omission of `oracleSearch.ts` matches the brief's build-time amendment row.
- No new stable ID, DEC or screen-layout row; nothing guessed into scope.
- Two cosmetic, non-blocking notes: the REQ-002 gate text calls the list-length line the fourth new line of the diff (it is the fifth `+` line, the fourth added criterion); the `DESIGN-BRIEF.md` header still asks the owner to answer the gate questions.
