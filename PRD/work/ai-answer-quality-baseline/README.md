---
status: refining
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
record is `DESIGN-BRIEF.md`; the proposed product truth is `GATE-QUESTIONS.md`
(ten blocks: REQ-185 through REQ-190 new, NFR-018 / REQ-146 /
`system-map.md` `## Eval harness` / `goals-and-non-goals.md` amended; no blocker
questions). Nothing was written to `PRD/sections/` — implementation applies the
approved proposal alongside the code.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/ai-answer-quality-baseline/DESIGN-BRIEF.md`
- Findings: (build half, attempt 1, 2026-09-07 — re-grade after the owner's six edits were applied inside `GATE-QUESTIONS.md`; the spec-forming attempt on 2026-09-06 had PASSed the pre-edit brief)
  1. Gold-set size: `DESIGN-BRIEF.md:47` (non-goals) says six gold cases and one rubric; finalized REQ-185 requires at least the six named cases plus roughly a dozen tier-1/tier-2 seeds.
  2. Model swap: `DESIGN-BRIEF.md:11-13` and `:41-42` promise no provider or model swap and that the answer model stays what `OPENAI_MODEL` selects; finalized REQ-188 defines a four-model lineup (`gpt-4.1-mini`, `gpt-4.1`, `gpt-5-mini`, `gpt-5-nano`) for the eval run.
  3. Judge default: assumption A9 (`DESIGN-BRIEF.md:245`) defaults the judge to `OPENAI_MODEL`; finalized REQ-186 defaults it to `gpt-5` under `ANSWER_QUALITY_JUDGE_MODEL` and forbids it matching any answer model.
  4. Stale cost: M3 (`DESIGN-BRIEF.md:102-121`) estimates a six-case single-model two-leg run at ≈ $0.04–$0.19; finalized REQ-188 is lineup × ~18 cases × 2 caps plus judge calls and was never re-derived in the brief.
  5. Measurement plan: the artifact fields (`DESIGN-BRIEF.md:299-303`) omit per-call latency and the blind side-by-side rank (REQ-189), and the first live run (`:304-308`) has no per-model axis, omitting the model × cap crossing (REQ-188/REQ-190).
  6. Judge mechanism: the judge section (`DESIGN-BRIEF.md:192-205`) names three layers and never the blind side-by-side ranking REQ-186's edit added.
  7. Provenance inside the finalized proposal: REQ-185's diff and `- Reason:` call `apps/backend/data/cr/source.txt` committed CR text; it is gitignored (`.gitignore:47`; `integrations-and-data.md:255`), absent in this worktree, written by `scripts/refresh-scryfall-data.mjs` and read by `scripts/build-game-rules.mjs`. The 277 `Example:` count reproduces in the launch checkout only (driver, 2026-09-07).
  Passed: provider `openAiResponsesProvider.ts` sends only `model` and `input`, so the lineup and judge are addressable by model id; `cardRulingsByOracleId.json` 19,542 cards / 76,605 rulings; four cap-of-5 sites in `preparation.ts` (228/272/317/355); `eval:worked-solutions` 6/6 under `EMBEDDING_PROVIDER=local`; 4/4 `Current:` excerpts byte-identical to live `PRD/sections/` at `787ca5f`; REQ-185–190 unused; heading hygiene clean; 16-term amendment-set grep leaves no uncovered assertion; no screen change. Package state `refining`.
