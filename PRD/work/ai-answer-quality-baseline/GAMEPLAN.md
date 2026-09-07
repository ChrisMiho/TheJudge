# GAMEPLAN — ai-answer-quality-baseline

## What ships

An answer-quality instrument for Ask AI: a repeatable, human-reviewable
bake-off. `npm run eval:answer-quality` asks each model in a configured
lineup (`gpt-4.1-mini`, `gpt-4.1`, `gpt-5-mini`, `gpt-5-nano`) every gold-set
question at excerpt cap 5 and cap 10, a stronger judge (default `gpt-5`,
overridable by `ANSWER_QUALITY_JUDGE_MODEL`) scores each answer alone on four
0–2 axes against the case's published official answer, and then ranks all
answers to a question blind. It writes a small committed scorecard and keeps
full transcripts out of git. It is measurement tooling: no new screen,
endpoint, request contract, provider, or CI gate on model output.

Source of truth: `DESIGN-BRIEF.md` (reconciled 2026-09-07) and the finalized
`GATE-QUESTIONS.md` (ten blocks — REQ-185 through REQ-190 new; NFR-018,
REQ-146, `system-map.md` `## Eval harness`, `goals-and-non-goals.md` amended).

## Architecture

Five pieces, built as five slices, wired together in the last one:

1. **Gold set** (`apps/backend/src/eval/worked-solutions/*.case.json`) — a
   tiered, all-official set of hard rules questions, each carrying a
   published, citable correct answer. Tier 1 cases cite a Comprehensive Rules
   `Example:` line from the committed `gameRulesRuleIndex.json`; tier 2 cases
   cite a WotC card ruling from the committed `cardRulingsByOracleId.json`
   plus a hand-authored, human-reviewed question. A shared loader/validator
   (`scripts/lib/gold-cases.mjs`) enforces the four-field validity test and is
   read by both the existing retrieval check
   (`scripts/eval-worked-solutions.mjs`) and the new answer-quality run.
2. **Run command** (`scripts/eval-answer-quality.mjs`, `npm run
   eval:answer-quality`) — confirmation-gated (`--confirm-live-calls`),
   dry-run by default, checks model access (a models-list request) before any
   paid call, answers every gold case once per model in the lineup and once
   per excerpt cap through `preparePromptInput`, records wall-clock latency
   per call, and never reads `OPENAI_MODEL`. The excerpt cap becomes a run
   parameter by extracting the four hard-coded `5` literals in
   `apps/backend/src/prompt/preparation.ts` into one named, exported constant
   and giving `preparePromptInput` an optional cap override (default: the
   constant) so the run reuses the identical production code path and ranking
   at either cap; production call sites pass no override and stay at 5.
3. **Judge** (`apps/backend/src/eval/answer-quality/`) — a committed rubric
   (four axes, 0–2, revision-stamped), deterministic assertions
   (`namesGoldRuleId`, non-empty, length), a lone judge pass grounded in the
   gold case's published `workedSolution`, and a blind side-by-side ranking
   pass (labels hidden, order shuffled) once every answer to a question has
   been scored alone. The judge is named by `ANSWER_QUALITY_JUDGE_MODEL`
   (default `gpt-5`), is never a lineup model, and the artifact flags any run
   where it is.
4. **Artifact** (`apps/backend/src/eval/answer-quality/results.json`,
   gitignored `output/answer-quality/`) — a small committed, numbers-only
   scorecard (run metadata, per-leg headline counts, per-case-per-leg axis
   scores, latency, blind rank) plus full gitignored transcripts (prompt,
   answer, judge rationale). Two runs differing only in answer-model lineup
   report as a model comparison; a difference in gold set, judge model,
   rubric revision, or `EMBEDDING_PROVIDER` reports as incomparable.
5. **Integration and PRD apply** — wires 1–4 into the working command, adds
   the regression guard (the command is in no gate script), updates
   `apps/backend/src/eval/worked-solutions/README.md` to describe both uses
   of the set, applies the ten `GATE-QUESTIONS.md` blocks to `PRD/sections/`
   by intent, and records the first live run and human review as the
   baseline.

## Data flow (one leg: one model, one excerpt cap, one gold case)

```
gold case (*.case.json)
  -> preparePromptInput({ mode: "lookup", question }, { excerptCap })
  -> live provider call (answer model) -> answer text + latency + tokens
  -> deterministic assertions (namesGoldRuleId, non-empty, length)
  -> judge pass (lone): question + rule ids + answer + workedSolution + rubric
       -> gpt-5 (or ANSWER_QUALITY_JUDGE_MODEL) -> 4 axis scores + rationale
  -> [after every model has answered this case at this cap]
     judge pass (blind rank): all answers, labels hidden, order shuffled
       -> gpt-5 -> per-answer rank
  -> artifact writer -> results.json (scores, metadata) + output/answer-quality/ (transcripts)
```

## Slices

| Slice | Name | Objective | Depends on | `GATE-QUESTIONS.md` blocks |
| --- | --- | --- | --- | --- |
| A | gold-set-and-validity | Tiered gold-set schema, shared validity test, seed cases | none | REQ-185 |
| B | cap-and-run-command | Named excerpt-cap constant, cap-as-run-parameter, `eval:answer-quality` scaffold (dry run, confirm gate, lineup, model-access check, latency) | none | REQ-188, REQ-190 |
| C | judge-and-rubric | Rubric, deterministic assertions, lone judge pass, blind side-by-side rank, judge-model setting and mismatch flag | none | REQ-186, REQ-187 |
| D | artifact-and-transcripts | Committed scores file, gitignored transcripts, comparability rule | none | REQ-189 |
| E | integrate-and-apply | Wire A–D into the working command, regression guard, worked-solutions README, PRD/sections apply (all 10 blocks), first live run + human review baseline, Ship gates | A, B, C, D | REQ-146, NFR-018, SYSTEM-MAP-EVAL-HARNESS, GOALS-ANSWER-QUALITY-NON-GOAL (+ re-confirms REQ-185–190) |

Slices A–D are parallel-ready: each is a self-contained module with its own
tests, taking or producing plain data shapes (a gold case object, an answer
string plus metadata, a scores record) rather than calling into another
slice's code. Slice E is sequential on all four because it is the only place
they are wired into one command and the only place `PRD/sections/` is
touched.

## Verification checklist

- `npm run test:scripts` — script-side unit tests (gold-case validator, cap
  byte-identical test, run-command arg parsing and guards, judge blinding and
  mismatch flag, artifact round-trip, regression guard) all pass.
- `npm run test:eval` and existing backend tests — unaffected; no production
  request/response contract changes.
- `npm run eval:worked-solutions` — unchanged behavior, 6/6 (or more, once
  seeds land) cases still retrieved.
- `npm run eval:answer-quality` with no flag — prints the plan and cost
  estimate, makes no network call, exits 0.
- `npm run quality:check` — green; a test asserts `eval:answer-quality`
  appears in no gate script (`quality:check`, `test`, `test:eval`,
  `coverage:check`, `test:scripts`).
- Manual: the first live run (owner-confirmed, `--confirm-live-calls`) across
  the full lineup × both caps, and a human review pass over the written
  record — dated observations, not a numeric pass/fail (no target is set).
- `git status --porcelain` clean after each slice's commit.

## Browser-observable risk

Nil. No screen, overlay, or frontend change; no Playwright criteria are
added.
