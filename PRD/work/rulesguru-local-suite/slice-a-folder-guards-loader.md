# Slice A — Suite folder, ignore line, guards, loader external mode

## Status: planned

## Goal

The suite folder exists as one constant, git ignores it before any import code exists, and the shared loader can read suite cases without letting them into the corpus.

## Requirements

1. Applies the accepted `REQ-232` block (GATE-QUESTIONS.md): create the `### REQ-232` entry in `PRD/sections/functional-requirements.md` after `### REQ-231` with Title, Priority, Description, Constraints, Dependencies and Notes, and the criteria this slice implements: one gitignored folder, one loader two modes, never a gate, tested on synthetic data. Later slices add their own criteria to that entry.
2. Applies B2: `SUITE_DIR` is `output/rulesguru/`, defined once in `scripts/lib/rulesguru-suite.mjs`.
3. `.gitignore` gains `output/rulesguru/` with a comment, in this slice's first commit, before any import code.
4. `scripts/lib/rulesguru-suite.mjs` exports `SUITE_DIR`, an ignore guard (`git check-ignore -q`, injectable) that refuses and names the `.gitignore` line to add, a path check that a resolved target is inside or exactly `SUITE_DIR` (no symlink escape), and the shared filter and selection helpers (`--level`, `--complexity`, `--suite-tag`, `--include-unsupported`, excluded and stale dropped with counts, seeded sample).
5. `scripts/lib/gold-cases.mjs` and `.d.mts`: `loadGoldCases(casesDir, { external = false } = {})`. Default mode refuses `tier: "external"` with a message saying suite cases belong only in the suite folder. External mode accepts only `tier: "external"`, `source.authority` `external-unapproved`, `review.status` `draft`, requires the `suite` block, allows null `expected.outcome`, and checks duplicates among non-excluded cases only.
6. `scripts/answer-quality-no-gate.test.mjs`: `NEVER_IN_A_GATE` gains `eval:rulesguru`, `rulesguru-import`, `rulesguru-convert`, `rulesguru-purge` and `--suite`; the expected-scripts map gains the three commands (the package.json scripts land in slices B and C; the guard test is written so it passes before and after).
7. Guard test: no `*.test.mjs` under `scripts/` names `output/rulesguru` except the folder-guard test, and none passes the global `fetch` to the importer.

## Acceptance criteria

- [ ] `.gitignore` contains the `output/rulesguru/` line and `git check-ignore -q output/rulesguru/raw/probe.json` succeeds
- [ ] A committed test asserts that check-ignore matches a path inside `SUITE_DIR` and that `git ls-files output/rulesguru` is empty
- [ ] The ignore guard refuses (test with injected check-ignore reporting not ignored) and its message names the `.gitignore` line to add
- [ ] The path check refuses a target that is not exactly `SUITE_DIR` or inside it, including a symlink escape and a parent path
- [ ] Default-mode `loadGoldCases` refuses a `tier: "external"` case with the suite-folder message, and every existing corpus case still loads unchanged
- [ ] External-mode loader accepts a valid synthetic suite case with null outcome and refuses an `approved` case, a corpus tier, and a missing `suite` block; duplicates among excluded cases are ignored
- [ ] Filter and selection helpers are unit-tested on synthetic cases: or within a flag, and across flags, unsupported dropped by default, excluded and stale dropped with counts, seeded sample repeatable
- [ ] The no-gate guard lists the new command names and the suite-name guard test passes
- [ ] The `REQ-232` entry exists in `PRD/sections/functional-requirements.md` with the folder, loader, never-a-gate and synthetic-data criteria and no suite question text
- [ ] `npm run test:scripts` passes and `npm run typecheck` passes

## Verification

```bash
git check-ignore -q output/rulesguru/raw/probe.json
git ls-files output/rulesguru
node --test scripts/lib/rulesguru-suite.test.mjs scripts/lib/gold-cases.test.mjs scripts/answer-quality-no-gate.test.mjs
npm run test:scripts
npm run typecheck
```

## Files touched

- `.gitignore`
- `scripts/lib/rulesguru-suite.mjs`, `scripts/lib/rulesguru-suite.test.mjs`
- `scripts/lib/gold-cases.mjs`, `scripts/lib/gold-cases.d.mts`, `scripts/lib/gold-cases.test.mjs`
- `scripts/answer-quality-no-gate.test.mjs`
- `PRD/sections/functional-requirements.md` (REQ-232 entry)
