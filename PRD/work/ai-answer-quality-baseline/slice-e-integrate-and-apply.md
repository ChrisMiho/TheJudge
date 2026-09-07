# Slice E — integrate-and-apply

## Status: blocked

### Handoff
- Done: E1–E8 all true and verified (the plan/estimate, the regression
  guard, the worked-solutions README, all four `PRD/sections/` amendments,
  `npm run quality:check` green). Wiring is complete and committed.
- Next: the owner runs the first live pass and reads the record. Exact
  steps are in `## Owner steps for E9 and E10` below.
- Stopped because: E9 (the first live run) and E10 (the human read-through)
  are the two criteria this build node cannot earn — they require a paid
  provider call and a human's own reading, neither of which this node is
  authorized to do.

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

- [x] E1. `npm run eval:answer-quality` with no flag prints a plan naming the
      lineup, both caps, the gold-set count, and the estimated cost, and
      exits 0 with no network call.
- [x] E2. A test asserts `eval:answer-quality` and `eval-answer-quality.mjs`
      appear in none of `package.json`'s `quality:check`, `test`, `test:eval`,
      `coverage:check`, `test:scripts` script definitions.
- [x] E3. `apps/backend/src/eval/worked-solutions/README.md` describes both
      the retrieval check and the answer-quality run, and no longer claims a
      retrieval miss says nothing about the eventual answer.
- [x] E4. `PRD/sections/non-functional-requirements.md` NFR-018 matches the
      finalized `GATE-QUESTIONS.md` NFR-018 replacement text (title,
      description, constraints, dependencies, notes), re-derived against
      current truth.
- [x] E5. `PRD/sections/functional-requirements.md` REQ-146 carries the
      finalized replacement (third constraint, dependencies, first note).
- [x] E6. `PRD/sections/system-map.md` `## Eval harness` carries the amended
      summary line and the new `### Answer-quality baseline` sub-entry,
      status `planned` until this package's cleanup receipt flips it to
      `shipped` (`doc-lifecycle.md` system-map promotion gate).
- [x] E7. `PRD/sections/goals-and-non-goals.md` carries the finalized
      replacement non-goal bullet.
- [x] E8. `npm run quality:check` exits 0.
- [ ] E9. (manual) The first live run was executed with owner confirmation,
      crossing every lineup model with both excerpt caps, and its actual
      token usage, latency, and dollar cost were recorded in
      `apps/backend/src/eval/answer-quality/results.json` as the baseline —
      no pass/fail threshold applied.
- [ ] E10. (manual) A human read the full written record for at least one
      gold case per model and recorded a dated conclusion in this slice's
      evidence log.

## Owner steps for E9 and E10

**What you get:** the model bake-off is fully wired and gated green. Two
steps are yours — the run itself costs real money and the read-through
needs a person — then this package is ready to ship.

1. **Make sure a live OpenAI key is configured** for `ASK_AI_PROVIDER=openai`
   (e.g. `.secrets/openai-dev.env`, the same file `npm run
   openai:verify-credentials` reads) with access to `gpt-4.1-mini`,
   `gpt-4.1`, `gpt-5-mini`, `gpt-5-nano`, and the judge `gpt-5` (or set
   `ANSWER_QUALITY_JUDGE_MODEL` to a judge your key can reach). The command
   checks access up front and fails naming any model it can't reach, before
   spending anything.
2. **Run the live bake-off:**
   ```bash
   npm run eval:answer-quality -- --confirm-live-calls
   ```
   This crosses all four lineup models with both excerpt caps (5 and 10)
   over the 18 gold cases: 144 answer calls, 144 lone judge calls, 36 blind
   side-by-side ranking calls — 324 calls total, made sequentially. The
   dry-run estimate at build time was **≈$2.56** (a character-count
   estimate; the run records its own real token usage and dollar cost —
   there is no pass/fail threshold on the number).
3. **What it writes:**
   - `apps/backend/src/eval/answer-quality/results.json` — the committed
     scorecard (small, numbers and metadata only). Review this diff; it
     replaces the placeholder this build committed.
   - `output/answer-quality/*.json` — one full transcript per case per
     model per cap (prompt, answer, reference, assertions, axis scores,
     judge rationale), plus one `*--ranking.json` per case per cap (the
     blind ranking and its rationale). This folder is gitignored —
     developer-local, never committed.
4. **Read the record (E10):** open at least one transcript per lineup
   model under `output/answer-quality/` (four files, or more) and read the
   question, the answer, the published reference, the axis scores, and the
   judge's rationale. Skim a `*--ranking.json` too, to see how the models
   compared head to head on that question.
5. **Record your conclusion.** Add one dated line to this slice's
   `## Owner steps` section (or directly above this list) naming what you
   read and what you concluded — this dated line, not any script's exit
   code, is what becomes durable project history (REQ-186, matching
   REQ-146's posture).
6. **Flip the two criteria.** Edit
   `PRD/work/ai-answer-quality-baseline/slice-e.criteria.json`: set `E9`'s
   `"value"` to `true` (the live run happened and `results.json` now holds
   real data) and `E10`'s `"value"` to `true` (you read the record and wrote
   the dated conclusion above). Then this slice, and the package, are ready
   for `thejudge-cleanup` / the graph's `close` step.

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
