status: refined

# rules-test-harness

Rules test harness, run 1: six-layer-ready case format, offline gate (dropped cards, missed rules), on-demand budget-safe answer grader, owner review flow, about 400 cases (every real mechanic once plus about 120 hard interactions).

- Idea: [IDEA.md](IDEA.md)
- Intake (evidence, never authority): [intake/GRAPH-BRIEF.md](intake/GRAPH-BRIEF.md)
- Design brief: [DESIGN-BRIEF.md](DESIGN-BRIEF.md)
- Proposed product truth and owner questions: [GATE-QUESTIONS.md](GATE-QUESTIONS.md) — REQ-185–190, NFR-018 amended; REQ-222–225 new; Q-007, Q-008
- Scratch measurement scripts: [measure/](measure/)

Next: `thejudge-quality-check`.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/rules-test-harness

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/rules-test-harness/DESIGN-BRIEF.md`
- Findings (attempt 3; all eight attempt-2 findings confirmed resolved, attempt-1 fixes did not regress):
  1. (Minor) The 18 migrated cases contradict the no-agent-approves rule: REQ-185's migrated-cases criterion, its plain-terms text and A1 say the 18 migrate as `approved`, while REQ-185's new constraint (`GATE-QUESTIONS.md:89`) says no case is approved by an agent and only the owner's verdict (REQ-224) moves a case to `approved`, and REQ-224's criterion (`GATE-QUESTIONS.md:527`) says no agent sets `approved`; A19 leans on the same absolute. The slice A migration is an agent setting `approved` on 18 cases. Add a carve-out to the REQ-185 constraint and REQ-224's criterion (for example: except the 18 first-ship cases, approved by the owner's accept of REQ-185).
  2. (Minor) The awaiting-re-freeze state has no owning slice or test: REQ-222's frozen-vector criterion (applied in E) says a case whose query text no longer matches its vector is reported as needing a re-freeze, is not scored by the ratchet, and is listed by the staleness report, and the gate summary prints an awaiting-re-freeze count; slice B names only the vector build command and the missing-vector failure, and slice E's done-when checks only clean-on-unchanged-data. Under A21 this must be true in code when REQ-222 applies at E. Name the owner (for example B stores a query-text hash per vector, detects the mismatch and skips ratchet scoring; E's staleness command reads that state) and add a fixture test.
- Advisory (not findings): slice A's field migration (`workedSolution` → `expected.answer`, `expectedSupplementalRuleIds` → `expected.decidingRuleIds`) requires updating `scripts/eval-answer-quality.mjs` (reads both at lines 408, 426, 431, 433, 464, 480), which slice A only implies; REQ-187 does not say whether a stale approved case's old record counts in the headline; the testers-inside-the-15 reading of the intake is disclosed and defensible.
