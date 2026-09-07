# Slice E — integrate-and-apply

## Status: planned

## Goal

Wire the gold set, run command, judge, and artifact into one working
`npm run eval:answer-quality`, prove it never enters a build gate, update the
worked-solutions README to describe both uses of the set, apply the four
`GATE-QUESTIONS.md` amendment blocks to `PRD/sections/`, and record the first
live run and human review as the baseline this instrument exists to produce.

## Requirements

1. `scripts/eval-answer-quality.mjs` (Slice B) calls the gold-case loader
   (Slice A), the answer-generation path through `preparePromptInput` with the
   cap override (Slice B), the deterministic assertions and judge (Slice C),
   and the artifact writer (Slice D) into one end-to-end command: for every
   model in the lineup, for every excerpt cap, for every gold case — answer,
   score alone, then (once every model has answered a case at a cap) rank
   blind — writing the committed scorecard and gitignored transcripts.
2. A regression-guard test asserts `eval:answer-quality` (and its underlying
   script) appears in none of `quality:check`, `test`, `test:eval`,
   `coverage:check`, `test:scripts`.
3. `apps/backend/src/eval/worked-solutions/README.md` is rewritten to
   describe both uses of the committed set: the existing retrieval check
   (`npm run eval:worked-solutions`) and the new answer-quality run
   (`npm run eval:answer-quality`), removing the now-false claim that a miss
   "is not a claim that the model's eventual answer was wrong ... which this
   track does not make."
4. Apply the remaining four `GATE-QUESTIONS.md` blocks to `PRD/sections/` by
   intent, re-derived against current truth (not a blind patch replay):
   - **NFR-018** → `PRD/sections/non-functional-requirements.md`
   - **REQ-146** → `PRD/sections/functional-requirements.md`
   - **SYSTEM-MAP-EVAL-HARNESS** → `PRD/sections/system-map.md`
     `## Eval harness` entry
   - **GOALS-ANSWER-QUALITY-NON-GOAL** → `PRD/sections/goals-and-non-goals.md`
5. `npm run quality:check` stays green.
6. The first live run is owner-confirmed
   (`npm run eval:answer-quality -- --confirm-live-calls`), crossing every
   lineup model with cap 5 and cap 10, judged by `gpt-5` (or the configured
   `ANSWER_QUALITY_JUDGE_MODEL`). It records actual token usage, wall-clock
   latency, and dollar cost — the recorded baseline, with no pass threshold.
7. A human reads the full per-case written record (prompt, answer, reference,
   assertions, judge scores, judge rationale) and records a dated conclusion.
   That conclusion, not any script's exit code, becomes durable project
   history (REQ-186, REQ-146's posture).
8. PRD promotion checklist (`doc-lifecycle.md`): durable truth is already
   applied by this slice and Slices A–D; nothing further to promote at
   cleanup beyond confirming presence and writing the receipt.

## Acceptance criteria

- [ ] E1. `npm run eval:answer-quality` with no flag prints a plan naming the
      lineup, both caps, the gold-set count, and the estimated cost, and
      exits 0 with no network call.
- [ ] E2. A test asserts `eval:answer-quality` and `eval-answer-quality.mjs`
      appear in none of `package.json`'s `quality:check`, `test`, `test:eval`,
      `coverage:check`, `test:scripts` script definitions.
- [ ] E3. `apps/backend/src/eval/worked-solutions/README.md` describes both
      the retrieval check and the answer-quality run, and no longer claims a
      retrieval miss says nothing about the eventual answer.
- [ ] E4. `PRD/sections/non-functional-requirements.md` NFR-018 matches the
      finalized `GATE-QUESTIONS.md` NFR-018 replacement text (title,
      description, constraints, dependencies, notes), re-derived against
      current truth.
- [ ] E5. `PRD/sections/functional-requirements.md` REQ-146 carries the
      finalized replacement (third constraint, dependencies, first note).
- [ ] E6. `PRD/sections/system-map.md` `## Eval harness` carries the amended
      summary line and the new `### Answer-quality baseline` sub-entry,
      status `planned` until this package's cleanup receipt flips it to
      `shipped` (`doc-lifecycle.md` system-map promotion gate).
- [ ] E7. `PRD/sections/goals-and-non-goals.md` carries the finalized
      replacement non-goal bullet.
- [ ] E8. `npm run quality:check` exits 0.
- [ ] E9. (manual) The first live run was executed with owner confirmation,
      crossing every lineup model with both excerpt caps, and its actual
      token usage, latency, and dollar cost were recorded in
      `apps/backend/src/eval/answer-quality/results.json` as the baseline —
      no pass/fail threshold applied.
- [ ] E10. (manual) A human read the full written record for at least one
      gold case per model and recorded a dated conclusion in this slice's
      evidence log.

## Verification

```bash
npm run test:scripts
npm --prefix apps/backend run test
npm run quality:check
npm run eval:answer-quality
```

## Files touched

- `scripts/eval-answer-quality.mjs` (wired end to end)
- `scripts/eval-answer-quality.test.mjs` (regression-guard assertion added)
- `apps/backend/src/eval/worked-solutions/README.md`
- `PRD/sections/non-functional-requirements.md` (NFR-018, amended)
- `PRD/sections/functional-requirements.md` (REQ-146, amended)
- `PRD/sections/system-map.md` (`## Eval harness`, amended)
- `PRD/sections/goals-and-non-goals.md` (amended)
- `apps/backend/src/eval/answer-quality/results.json` (first recorded run)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/ai-answer-quality-baseline/` ready to delete
