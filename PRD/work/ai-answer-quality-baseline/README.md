---
status: active
---

# ai-answer-quality-baseline

Repeatable, human-reviewable answer-quality baseline for Ask AI, seeded from
the six worked-solution cases in `apps/backend/src/eval/worked-solutions/`
that carry published correct answers.

Captured by `thejudge-kickoff` under `graph is controlling` (run
`graph-20260906-092312`), unparking `PRD/ideasForLater/ai-answer-quality-baseline/`
after the hybrid-rule-retrieval shipment (PRs #197, #199). See `IDEA.md` for
the framing, prior-run receipts, and non-goals, and `intake/` for the staged
idea and the driver's measurement context note this package was seeded from.

Refined 2026-09-06 under `graph is controlling` (node 3, `define`). The design
record is `DESIGN-BRIEF.md`; the product truth is `GATE-QUESTIONS.md` (ten
blocks: REQ-185 through REQ-190 new, NFR-018 / REQ-146 /
`system-map.md` `## Eval harness` / `goals-and-non-goals.md` amended; no blocker
questions). The owner answered every block on 2026-09-06 — six `edit`, four
`accept`, no rejections — and `graph-gate-review` applied each edit inside that
block's diff. Nothing was written to `PRD/sections/` — implementation applies the
approved proposal alongside the code.

Re-refined 2026-09-07 (node 3, build half, attempt 1) to reconcile the brief with
that finalized proposal after gate-qc FAILed it on seven findings. The instrument
the brief now describes is the one the owner approved: a **multi-model bake-off**
(`gpt-4.1-mini`, `gpt-4.1`, `gpt-5-mini`, `gpt-5-nano`) over a **tiered,
all-official gold set** of at least the six committed cases plus roughly a dozen
seeds, judged by a **stronger model** (`gpt-5` by default) that scores each answer
alone and then ranks all answers to a question blind. Finding 7 was a factual
correction inside REQ-185's diff: tier-1 text comes from the committed rule index
`apps/backend/data/gameRulesRuleIndex.json` (277 `Example:` lines across 215
entries, re-measured 2026-09-07 in this worktree), not from the gitignored raw CR
download. The owner's verdict and reason lines are untouched.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/ai-answer-quality-baseline/DESIGN-BRIEF.md`
- Findings: none (build half, attempt 2, 2026-09-07, at `2de4800`: all seven attempt-1 findings closed — gold set `DESIGN-BRIEF.md:373`, model swap `:18-21`, judge default A9 `:426` and `:330`, M3 `:151-199` re-derived with every input shown and labelled an estimate with no numeric cost target, measurement plan `:463-520`, four judge layers `:305-316`, provenance now the committed `gameRulesRuleIndex.json` with 277 `Example:` occurrences across 215 entries reproduced; `git diff fe4435a..2de4800` on `GATE-QUESTIONS.md` is two provenance lines inside REQ-185, verdict and reason lines byte-identical; 4/4 `Current:` excerpts byte-identical to live `PRD/sections/`, which is itself unchanged from `787ca5f`; REQ-185–190 unused; heading hygiene clean; 16-term amendment-set grep unchanged from attempt 1; technical-design-rules hold, no screen change; package `refined`. One non-blocking note: `DESIGN-BRIEF.md:208` cites the `preparation.ts` cap-of-5 sites at 223/267/313/351 while the live lines are 228/272/317/355 — supporting evidence only, build greps for the literal.)
- Prior result: FAIL (build half, attempt 1, 2026-09-07 — re-grade after the owner's six edits were applied inside `GATE-QUESTIONS.md`; the spec-forming attempt on 2026-09-06 had PASSed the pre-edit brief). The seven findings, kept for the record:
  1. Gold-set size: `DESIGN-BRIEF.md:47` (non-goals) says six gold cases and one rubric; finalized REQ-185 requires at least the six named cases plus roughly a dozen tier-1/tier-2 seeds.
  2. Model swap: `DESIGN-BRIEF.md:11-13` and `:41-42` promise no provider or model swap and that the answer model stays what `OPENAI_MODEL` selects; finalized REQ-188 defines a four-model lineup (`gpt-4.1-mini`, `gpt-4.1`, `gpt-5-mini`, `gpt-5-nano`) for the eval run.
  3. Judge default: assumption A9 (`DESIGN-BRIEF.md:245`) defaults the judge to `OPENAI_MODEL`; finalized REQ-186 defaults it to `gpt-5` under `ANSWER_QUALITY_JUDGE_MODEL` and forbids it matching any answer model.
  4. Stale cost: M3 (`DESIGN-BRIEF.md:102-121`) estimates a six-case single-model two-leg run at ≈ $0.04–$0.19; finalized REQ-188 is lineup × ~18 cases × 2 caps plus judge calls and was never re-derived in the brief.
  5. Measurement plan: the artifact fields (`DESIGN-BRIEF.md:299-303`) omit per-call latency and the blind side-by-side rank (REQ-189), and the first live run (`:304-308`) has no per-model axis, omitting the model × cap crossing (REQ-188/REQ-190).
  6. Judge mechanism: the judge section (`DESIGN-BRIEF.md:192-205`) names three layers and never the blind side-by-side ranking REQ-186's edit added.
  7. Provenance inside the finalized proposal: REQ-185's diff and `- Reason:` call `apps/backend/data/cr/source.txt` committed CR text; it is gitignored (`.gitignore:47`; `integrations-and-data.md:255`), absent in this worktree, written by `scripts/refresh-scryfall-data.mjs` and read by `scripts/build-game-rules.mjs`. The 277 `Example:` count reproduces in the launch checkout only (driver, 2026-09-07).
  Passed: provider `openAiResponsesProvider.ts` sends only `model` and `input`, so the lineup and judge are addressable by model id; `cardRulingsByOracleId.json` 19,542 cards / 76,605 rulings; four cap-of-5 sites in `preparation.ts` (228/272/317/355); `eval:worked-solutions` 6/6 under `EMBEDDING_PROVIDER=local`; 4/4 `Current:` excerpts byte-identical to live `PRD/sections/` at `787ca5f`; REQ-185–190 unused; heading hygiene clean; 16-term amendment-set grep leaves no uncovered assertion; no screen change. Package state `refining`.

Mapped out 2026-09-07 (node 5, build half, `plan`) under `graph is controlling`.
Five slices, sequential only where E depends on A–D landing first (see table
below); no browser-observable risk (no screen change), so no Playwright
criteria.

## Slices

| Slice | Name | Goal | Depends on | Status |
| --- | --- | --- | --- | --- |
| A | [gold-set-and-validity](./slice-a-gold-set-and-validity.md) | Tiered gold-set schema, shared validity test, seed cases (REQ-185) | none | done |
| B | [cap-and-run-command](./slice-b-cap-and-run-command.md) | Named excerpt-cap constant, cap-as-run-parameter, `eval:answer-quality` scaffold (REQ-188, REQ-190) | none | done |
| C | [judge-and-rubric](./slice-c-judge-and-rubric.md) | Rubric, deterministic assertions, lone judge pass, blind rank (REQ-186, REQ-187) | none | done |
| D | [artifact-and-transcripts](./slice-d-artifact-and-transcripts.md) | Committed scores file, gitignored transcripts, comparability rule (REQ-189) | none | done |
| E | [integrate-and-apply](./slice-e-integrate-and-apply.md) | Wire A–D, regression guard, PRD apply (NFR-018, REQ-146, SYSTEM-MAP-EVAL-HARNESS, GOALS-ANSWER-QUALITY-NON-GOAL), first live run + human review | A, B, C, D | planned |

## Implementation map

- `scripts/lib/gold-cases.mjs`, `scripts/lib/gold-cases.test.mjs` — shared
  gold-case loader/validator (Slice A)
- `apps/backend/src/eval/worked-solutions/*.case.json`,
  `apps/backend/src/eval/worked-solutions/README.md` — the gold set itself
  (Slice A, README finished in Slice E)
- `apps/backend/src/prompt/preparation.ts` — named excerpt-cap constant and
  optional cap override (Slice B)
- `scripts/eval-answer-quality.mjs`, `scripts/eval-answer-quality.test.mjs`,
  `package.json` (`eval:answer-quality`) — the run command (Slice B,
  wired end to end in Slice E)
- `apps/backend/src/eval/answer-quality/rubric.ts`, `assertions.ts`,
  `judge.ts` (+ tests) — the rubric and judge (Slice C)
- `apps/backend/src/eval/answer-quality/artifact.ts`,
  `apps/backend/src/eval/answer-quality/results.json`, `.gitignore` — the
  artifact and gitignored transcripts (Slice D)
- `PRD/sections/functional-requirements.md` (REQ-185/186/187/188/189/190 new,
  REQ-146 amended), `PRD/sections/non-functional-requirements.md` (NFR-018
  amended), `PRD/sections/system-map.md` (`## Eval harness` amended),
  `PRD/sections/goals-and-non-goals.md` (amended) — applied by intent, one
  slice per new block, amendments in Slice E
