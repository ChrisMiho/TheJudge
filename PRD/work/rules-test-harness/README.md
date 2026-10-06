status: owner-action

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
- Findings (attempt 4, the fourth FAIL — parked at owner-action under the three-loop cap; both attempt-3 findings and both advisories confirmed resolved, no regression):
  1. (Minor) A re-approved stale case has no defined way back into the headline: A22, the REQ-187 headline bullet (`GATE-QUESTIONS.md:186`) and REQ-225 (`:581`) say a stale case counts again from its next graded record after re-approval, but the default `--changed` selector (REQ-188, `GATE-QUESTIONS.md:222`; brief `Live runner` Selection) picks a case only when its prompt hash differs from its last record or it was never graded. A tier-1 reference answer is rule text, so a rules refresh can change the answer while the prompt stays identical (deciding rule a miss, or its changed text does not reach the prompt); such a case is re-approved, never re-graded under `--changed`, and sits in no headline bucket. REQ-187's latest-record-of-approved-non-stale formula would also count the old record at once, contradicting next-graded-record. The per-case record already stores the reference-answer hash. Fix: add that hash to the `--changed` trigger in REQ-188 and the live-runner bullet; state in A22 / REQ-187 / REQ-225 whether a re-approved case counts from re-approval or only from a fresh record; add a slice C headline test.
  2. (Minor, citation) `DESIGN-BRIEF.md:125` cites M14 for the committed index carrying no rules date; there is no M14 row — M13 (and A11) carry it. Cite M13.
- Advisory (not findings): `review.reviewedOn` for the 18 migrated cases is unspecified (the loader requires it; the owner's accept date is unknown at build time); slice C's done-when names no tests for the unknown-rule-id assertion, judge-usage recording, the `shortAnswer` no-prose guard, or dropping non-approved cases from `results.json`; `test:scripts` runs `node --test` without tsx, so a gate test importing `preparePromptInput` (TypeScript) must live in the backend vitest suite or use tsx (A3 leaves this to the build).
