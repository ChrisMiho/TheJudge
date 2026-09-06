# Driver context note for the answer-quality kickoff (2026-09-06)

Written by the graph driver from measurements taken in the session that shipped
hybrid-rule-retrieval. Evidence for refinement, not authority: every product
decision below is the owner's at the define gate.

## What exists today (measured on `main` at `8d139aa`)

- Retrieval is measured three ways, all offline and committed:
  - 9 labelled eval fixtures, 14/14 checks pass under the semantic/hybrid path
    (`npm --workspace apps/backend run test:eval`, hard gate since REQ-032's
    2026-09-06 amendment).
  - 156-pair benchmark (`apps/backend/src/eval/benchmark/`), recall@5 0.8974
    clean / 0.8910 with a card attached, MRR 0.7107 / 0.6931 (REQ-177/182).
  - 6 worked-solution cases with published correct answers
    (`apps/backend/src/eval/worked-solutions/*.case.json`, NFR-018), 6/6 retrieve
    their source rule on both lexical and hybrid paths
    (`npm run eval:worked-solutions`, informational).
- Nothing grades the model's final answer. `eval:worked-solutions` stops at
  "did the source rule reach the prompt"; the fixture corpus (~30 scenarios in
  `apps/backend/src/eval/fixtures/`) holds prompt/context goldens only.
- The worked-solution cases are the only fixtures that carry a known-correct
  answer today, which makes them a natural seed for an answer gold set.

## An open retrieval question this baseline would settle

System 3 attaches up to five rule excerpts (REQ-182, `game-rules-retrieval.md`).
Measured 2026-09-06 on the benchmark, hybrid path, clean questions: the right
rule is in the top 5 for 89.7%, top 6 89.7%, top 7 90.4%, top 8 91.0%,
top 10 94.2%; 9 of 156 never reach the top 10. Excerpts average about 70
tokens (p90 about 130). Whether extra, lower-confidence excerpts help or
distract the model when it writes the answer is unmeasurable without an
answer-quality instrument; the driver recommended keeping five until one
exists. Raising the cap is a product-truth change.

## Cost notes already recorded

- Live provider calls: the org's gpt-4.1 cap is 30k tokens per minute; earlier
  live batches ran sequentially with prompt caching; a 20-request pilot cost
  about $0.40 (memory note `reference_openai_live_call_limits`).
- The parked idea's non-goals still stand: no CI gate on model output, no new
  product surface, no provider swap.

## The owner's words (2026-09-06)

"ok its merged, lets cleanup, and thne start scoping out validation of th
enhancement?" — after asking earlier "Can we now test accuracy post changes? Or
is there more we need to do?" The enhancement is the hybrid rule retrieval
that just shipped; the validation is whether Ask AI's answers are actually
right, not just whether the right rules reached the prompt.
