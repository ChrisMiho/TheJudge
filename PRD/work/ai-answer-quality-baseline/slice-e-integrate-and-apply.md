# Slice E — integrate-and-apply

## Status: blocked

### Handoff
- Done: E1–E8 all true and verified (the plan/estimate, the regression
  guard, the worked-solutions README, all four `PRD/sections/` amendments,
  `npm run quality:check` green). Wiring is complete and committed.
- Done 2026-09-07 (E9): the first live run, cleared by the owner in session
  and executed by the driver — see `## First live run` below.
- Done 2026-09-07, later (instrument corrected, run 3): the first two runs
  asked tier-2 cases without their card and never embedded the question, so
  both ranked lexically under a `local` label. Fixed in
  `scripts/eval-answer-quality.mjs` and re-run; `results.json` now holds run
  3 (`embeddingProvider: local`, semantic for all 18 cases, `gitCommit:
  b3f860f`). See `## Third live run — instrument corrected`.
- Next: the owner reads the record (E10) from run 3's transcripts under
  `output/answer-quality/`. Exact steps are in `## Owner steps for E9 and
  E10` below; only steps 4–6 remain.
- Stopped because: E10 (the human read-through) is the one criterion this
  build cannot earn — it requires a person's own reading.

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

1. **Make sure a live OpenAI key is in `.secrets/openai-dev.env`** (the
   same file `npm run openai:verify-credentials` reads; the command loads it
   itself, from a linked worktree's main checkout too, so nothing is exported
   by hand — `scripts/lib/local-openai-env.mjs`) with access to
   `gpt-4.1-mini`, `gpt-4.1`, `gpt-5-mini`, `gpt-5-nano`, and the judge
   `gpt-5` (or set `ANSWER_QUALITY_JUDGE_MODEL` to a judge your key can
   reach). `--confirm-live-calls` is the consent that selects the `openai`
   provider when `ASK_AI_PROVIDER` is unset; an explicit `mock` still refuses.
   The command checks access up front and fails naming any model it can't
   reach, before spending anything.
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

## First live run

2026-09-07, cleared by the owner in session ("i added plenty of credits to the
account, we are cleared for testing") and executed by the graph driver from the
build worktree. Two runs were made; the second is the committed baseline.

- **Run 1, `EMBEDDING_PROVIDER` unset (mock embedder), 06:47 UTC** — 324
  calls, $0.67 actual. Kept for comparison under
  `output/answer-quality/mock-embeddings-2026-09-07/` (gitignored), with its
  scorecard as `results.mock-embeddings.json` there. Not the baseline: the
  deployed app runs the local embedder (REQ-184), and the eval script does
  not set `EMBEDDING_PROVIDER` itself, so this run held retrieval fixed to the
  wrong provider. The committed artifact records the provider (REQ-188), which
  is exactly what made the mismatch visible.
- **Run 2, `EMBEDDING_PROVIDER=local`, 08:03 UTC — the baseline** — 324
  calls, $0.69 actual (estimate was $2.56; gpt-5's reasoning output was far
  smaller than the character-count guess), no undetermined answers, judge
  never matched an answer model. Fully-correct counts of 18, cap 5 / cap 10:
  gpt-4.1-mini 16 / 15, gpt-4.1 14 / 17, gpt-5-mini 15 / 16, gpt-5-nano 14 /
  15. Mean answer latency: gpt-4.1 3.7–3.9 s, gpt-4.1-mini 5.8–6.1 s,
  gpt-5-mini 19–20 s, gpt-5-nano 30–31 s (max 59 s). Mean blind rank (1 is
  best): gpt-5-mini 1.6–2.2, gpt-4.1 2.3–2.6, gpt-4.1-mini 2.5–2.8, gpt-5-nano
  2.9–3.0.
- **Deployed model, confirmed from the Lambda's environment the same night:
  `OPENAI_MODEL=gpt-4.1`** (`scripts/aws-deploy.sh` sets it), not the code
  default `gpt-4.1-mini` the brief calls the baseline. Read the gpt-4.1 rows as
  today's product.
- **Retrieval observations from the transcripts.** The gold rule reached the
  prompt in 64 of 72 rule-backed answer prompts at each cap; the two cases it
  never reached at either cap were `combat-damage-assignment-order-multiple-blockers`
  (510.1c) and `sensei-top-leaves-battlefield-ability-on-stack` (113.7a).
  On the combat case every model except gpt-4.1 at cap 10 answered from the
  pre-2024 damage-assignment-order rule, confidently — memorized rules winning
  when the current one is not attached. Tier-2 ruling cases were all answered
  correctly by every model at both caps except one gpt-5-nano miss.
- **Found the same night, not by the run:** production had been on lexical
  fallback since the 2026-09-06 deploy (the package kept the linux/x64
  onnxruntime binding on an arm64 Lambda); fix in PR #204.
- **Corrected later the same day (see the next section):** the claim that
  run 2 measured the retrieval players get after #204 was wrong. The script
  passed no query embedding to `preparePromptInput`, so runs 1 and 2 both
  ranked lexically whatever `EMBEDDING_PROVIDER` said, and it attached no
  card, so the three tier-2 prompts carried no oracle text and no ruling.
  Runs 1 and 2 are the same instrument twice; their transcripts stay under
  `output/answer-quality/mock-embeddings-2026-09-07/` and
  `output/answer-quality/local-label-lexical-2026-09-07/` (gitignored, with
  each scorecard beside them) as a record of what a bare, lexical prompt
  produces.
- The two E9/E10 owner steps became: E9 earned by this record; E10 remains
  the owner's read-through (steps 4–6 above).

## Third live run — instrument corrected

2026-09-07, 09:48 UTC, from the build worktree at `b3f860f` plus the
uncommitted fix, under the owner's standing clearance for this package's
paid runs. 324 calls, $0.63 actual (413k input / 270k output tokens), no
undetermined answers, judge `gpt-5` never in the lineup.

**What changed in the instrument** (`scripts/eval-answer-quality.mjs`):

- A tier-2 case is asked with its cited card attached by oracle id
  (`buildCaseRequest`), and `preparePromptInput` receives the committed
  card-detail and card-rulings indexes, so the prompt carries the card's
  oracle text and rulings exactly as a player's lookup does. Verified
  offline before the run: all three tier-2 prompts contain the cited ruling
  verbatim (Panharmonicon 9 rulings attached, Restoration Angel 3, Sensei's
  Divining Top 2).
- The question is embedded once per case from the same retrieval query text
  the route handler embeds (`buildRetrievalQueryText`), by
  `EMBEDDING_PROVIDER` — now defaulting to `local`, the deployed provider.
  A real provider that returns no vector, or a pass System 3 reports as
  lexical, aborts the run (`assertQueryEmbedded`, `describeRetrieval`) so
  the recorded label is always what ranked the excerpts.
- Each transcript records `cards` and a `retrieval` block (`usedSemantic`,
  the rule ids attached, `goldRuleInPrompt`); each committed per-case record
  carries `goldRuleInPrompt`. REQ-185/188/189 amended to say so.
- A fresh worktree has no model cache (`apps/backend/data/models/` is
  gitignored); it was copied from the main checkout for this run.

**Fully correct (Correctness 2) of 18, cap 5 / cap 10:** gpt-4.1-mini 17 /
15, gpt-4.1 16 / 18, gpt-5-mini 17 / 18, gpt-5-nano 15 / 13. Mean answer
latency: gpt-4.1 3.4–3.5 s, gpt-4.1-mini 4.3–5.5 s, gpt-5-mini 13.5–20.7 s
(max 66 s), gpt-5-nano 22.9–27.7 s (max 56 s). Mean blind rank (1 is best):
gpt-4.1 1.8 at both caps, gpt-5-mini 1.9, gpt-4.1-mini 2.7–2.9, gpt-5-nano
3.3–3.6.

**Retrieval, now measured per prompt instead of read off by hand.** With
semantic ranking the gold rule reached the prompt for 14 of 18 cases at cap
5 and 16 of 18 at cap 10. The two cases that cap 10 adds are exactly the
two the lexical runs never reached at any cap: 510.1c
(`combat-damage-assignment-order-multiple-blockers`, rank 7) and 113.7a
(`sensei-top-leaves-battlefield-ability-on-stack`). The handoff's "check
whether the tokenizer drops 4/3-style tokens" follow-up is closed: the
misses were the instrument's lexical shortcut, not the corpus. The two
cases never reached at either cap are the other two tier-2 cases
(Panharmonicon 603.2, Restoration Angel 400.7) — and both were answered
fully correctly by every model at both caps, because the attached ruling
answers them; the tier-2 test now measures what it was designed to.

**The combat-damage case is the cap story in one row.** At cap 5 (510.1c
absent) gpt-4.1 scored 1 and gpt-5-mini 0, both reasoning from the
pre-2024 lethal-first rule; at cap 10 (510.1c attached) every model scored 2
and gpt-4.1's answer cites 510.1c by number. Cap 10 also cost gpt-4.1-mini
and gpt-5-nano cases elsewhere (17→15, 15→13), so the distraction effect is
real for the smaller models and absent for gpt-4.1 and gpt-5-mini.

**Read against production (`OPENAI_MODEL=gpt-4.1`, cap 5):** today's
product is the gpt-4.1 cap-5 row, 16/18 at 3.4 s. The same model at cap 10
is 18/18 at 3.5 s. That is the measurement the excerpt-cap follow-up package
needs (REQ-190's "changing the deployed cap requires a recorded run showing
a larger cap scored better").

Summary of the three runs, for the record:

| Run | Embedder label | What actually ranked | Tier-2 card attached | gpt-4.1 cap 5 / 10 | Cost |
| --- | --- | --- | --- | --- | --- |
| 1, 06:47 UTC | mock | lexical | no | 14 / 17 (lexical) | $0.67 |
| 2, 08:03 UTC | local | lexical (no query embedding passed) | no | 14 / 17 | $0.69 |
| 3, 09:48 UTC | local | semantic, all 18 cases | yes | 16 / 18 | $0.63 |

Run 3 is the committed baseline. Runs 1 and 2 compare with each other
(same instrument), not with run 3.

## Verification

```bash
npm run test:scripts
npm --prefix apps/backend run test
npm run quality:check
npm run eval:answer-quality
```

## Files touched

- `scripts/eval-answer-quality.mjs` (wired end to end; then corrected —
  cards attached, question embedded, fallback refused)
- `scripts/eval-answer-quality.test.mjs` (regression-guard assertion added;
  `buildCaseRequest`, `assertQueryEmbedded`, `describeRetrieval`, and the
  `local` default tested)
- `apps/backend/src/eval/answer-quality/artifact.ts` (transcript `cards` +
  `retrieval`, per-case `goldRuleInPrompt`)
- `scripts/lib/prompt-fidelity.mjs` (new: the shared request/embedding
  helpers both instruments use), `scripts/eval-worked-solutions.mjs` +
  test (the retrieval check gained the same fidelity: card attached,
  question embedded, semantic/lexical labelled per line; still 14/18 at
  cap 5, now measured the way production ranks). The run command formats
  `results.json` with the repo's prettier config so a recorded run never
  fails `format:check`.
- `apps/backend/src/eval/worked-solutions/README.md`
- `PRD/sections/non-functional-requirements.md` (NFR-018, amended)
- `PRD/sections/functional-requirements.md` (REQ-146, amended; REQ-185,
  REQ-188, REQ-189, REQ-190 amended after run 3)
- `PRD/sections/system-map.md` (`## Eval harness`, amended)
- `PRD/sections/goals-and-non-goals.md` (amended)
- `apps/backend/src/eval/answer-quality/results.json` (run 3, the corrected
  instrument's first run)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/ai-answer-quality-baseline/` ready to delete
