status: refining

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
- Findings (attempt 5; both attempt-4 findings and all three advisories confirmed resolved, no regression):
  1. (Minor) The shared loader cannot be imported by backend vitest tests as A3 describes. A3 (`DESIGN-BRIEF.md:463`), slices B–E, and REQ-185's `format version 2` criterion (`GATE-QUESTIONS.md:73`) say backend vitest tests under `apps/backend/src/eval/` read cases through `scripts/lib/gold-cases.mjs` (never a second copy), and that slice A's `buildCaseRequest` in `scripts/lib/prompt-fidelity.mjs` builds the gate's requests — but `apps/backend/tsconfig.json` has `rootDir: src`, strict, no `allowJs`, and `npm run typecheck` is `tsc --noEmit`; a `.ts` file importing `scripts/lib/gold-cases.mjs` fails with TS7016 (measured in a scratch tsconfig with the same options). Repo precedent goes the other way: `apps/backend/src/prompt/preparation.test.ts:12-18` duplicates the six case ids rather than import across the workspace boundary; no backend `.ts` imports a `scripts/*.mjs`. Related: REQ-185 and A15 say `gameState` is validated under the In-Depth `gameContext` schema and the `.mjs` loader asserts it all, but that schema is TypeScript and the loader runs under `node --test` without tsx; no gate test parses every real case's `gameState` with the schema, and no REQ-222 criterion or slice B done-when says so. Fix: state in A3 and slice A how backend tests import the `.mjs` with one copy (for example a sibling `.d.mts` declaration, or a variable-path dynamic import); say the loader checks the structural rules (no `owner` on a stack item, no `caster` off the stack) and a backend vitest test (slice B) parses every non-null `gameState` with the In-Depth schema; word the REQ-185 criterion to match; add typecheck-green to slice A's and B's done-when.
- Advisory (not a finding): the 18 existing `results.json` records carry no prompt hash or reference-answer hash, so the brief's line 203 claim that the token case's new prompt hash differs from any earlier graded record is not literally true. Slice C should state that a record without the hashes counts as ungraded in the headline and is selected by `--changed`; the first routine run then re-grades those 18 cases (about $0.40) as well as the token case.
