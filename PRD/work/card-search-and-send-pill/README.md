status: owner-action

# card-search-and-send-pill

Two player-facing defects from `PRD/ideasForLater/hardtofind/hardtosearch.md`: card search misses names with commas, and the send pill shows an empty half on Firefox. See `IDEA.md`; evidence in `intake/` and `evidence/measurements.md`.

Refined 2026-10-13: `DESIGN-BRIEF.md` (scope, decisions, assumptions) and `GATE-QUESTIONS.md` (amendments to REQ-002, REQ-212, REQ-206; no new stable ID; no blocker).

Quality-check PASS 2026-10-13. Next: the owner answers `GATE-QUESTIONS.md` in the docs PR, then merges it; `graph-implement` builds it.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/card-search-and-send-pill/DESIGN-BRIEF.md`
- Findings: none

Graded 2026-10-13 (graph node `gate-qc`, attempt 1) together with `GATE-QUESTIONS.md`, `evidence/measurements.md`, `IDEA.md` and `intake/`. Checked against current `PRD/sections/` and the code:

- Diff anchors match: REQ-002 (line 19), REQ-206 ring criterion (5331), REQ-212 criteria (5534, 5539) and Notes, all as quoted.
- Code claims hold: `normalize` in `lib/search.ts` has one other caller (`components/trade/oracleSearch.ts`); the list is capped at 3 and 8; In-depth details' Cards step passes `NO_MATCH_COPY` to its picker; Ask a Question's threshold is set by `minQueryLength` (REQ-167).
- Corpus check: after accent stripping, no card name holds a non-decomposing non-ASCII letter (no Æ or ß case), so the accent wording is complete.
- Amendment set is enumerated by quoted grep with a disposition per hit; no new stable ID, no DEC, no screen-layout row needed (no new screen).
- Open verdict slots on the three gate questions are expected at this stage and are not findings.
