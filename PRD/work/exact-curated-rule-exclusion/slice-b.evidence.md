# Slice B evidence — exact curated rule exclusion

Measured 2026-10-08 in `.worktrees/implement-exact-curated-rule-exclusion`, offline (no network, no model call), local embedder present for hybrid rows. Slice C copies these into REQ-179's Notes.

## B1 — PR #273 condition

`git diff --stat f98b8feb HEAD -- apps/backend/data` printed nothing. The committed game-rules data is identical to `f98b8feb`, so the brief's numbers apply unchanged and nothing was re-measured against a refreshed index. Hybrid runs ranked semantically: `npm run eval:worked-solutions` header "Embedding provider: local (392/392 cases ranked semantically)", no lexical fallback.

## B2 — goldens

Regenerated with `UPDATE_CONTEXT_EVAL_FIXTURES=1 npm --workspace apps/backend run test:eval` (done in slice A's commit, because the suite and `quality:check` run this golden test and fail the moment the scorer changes; see slice A's build note). `git diff origin/main -- apps/backend/src/eval/fixtures` shows exactly three prompt goldens moved, each the named swap, plus the `upkeep-trigger.fixture.json` description from slice A:

- `commander-spellbook-lookup-attached-intent`: 614.10a out, 115.1b in
- `commander-spellbook-wrong-zone`: 500.10a out, 117.3a in
- `upkeep-trigger`: 609.7a out, 603.3b in

No context golden moved (none lists these supplemental ids), and no other golden moved. 28 of 31 prompt goldens unchanged.

## B3 — eval green without the flag

`npm --workspace apps/backend run test:eval`: 3 tests passed.

## B4 — baseline

`npm run eval:rules-gate:baseline` (no `--allow-regressions`). Output: "392 cases, 392 scored (289 hit, 103 missed), 11 with a deciding rule carried by a curated topic, 0 awaiting re-freeze, 0 regressed, 0 failed". "Newly recorded hits: triggers-becomes-tapped-not-entering-tapped: 603.2e; triggers-damage-prevented-no-trigger: 603.2g". No `Accepted regressions` line. `baseline.json` diff is exactly those two cases moving from `miss` to `hit`.

Rules test cases with every deciding rule in the prompt (System 3 or curated topic), counted from `baseline.json` (no miss, or every miss carried in `inTopic`): 293 before, 295 after (target 295).

Consequence: `apps/backend/src/eval/rules-gate/rulesGate.test.ts` pins the committed baseline's no-miss count (`toBe(287)`, REQ-220 test); it moved to `toBe(289)` with the raise. That one-number edit is part of slice B.

## B5 — `npm run eval:worked-solutions`

289 of 392 (before 287; target 289). Run: hybrid, local embedder.

## B6 — closing cases under hybrid, frozen vectors

`npm run eval:evidence-trace -- --case triggers-becomes-tapped-not-entering-tapped --case triggers-damage-prevented-no-trigger` on clean commit `eba01255`: vector source `frozen` for both, "0 ranked with a locally embedded vector". 603.2e rank 1, selected in System 3, not skipped for curated topic, available to the answer. 603.2g rank 1, selected in System 3, not skipped, available. Trace gate check: "2 cases held against baseline.json, 2 agree, 0 diverge". (Trace file `output/evidence-trace/eba01255/trace.json` is gitignored, not committed.)

The trace refuses a dirty checkout, so the raised `baseline.json` was committed on its own first (part 1) so the trace could run.

## B7 — lexical, recorded not gated

`EMBEDDING_PROVIDER=mock npm run eval:worked-solutions` ("0/392 cases ranked semantically"): 225 of 392 overall. First-ship cases lexical: 14 of 18 (misses `combat-damage-assignment-order-multiple-blockers`, `panharmonicon-controller-not-entering-permanent`, `sensei-top-leaves-battlefield-ability-on-stack`, `restoration-angel-blink-resets-counters`), same as the REQ-220 before-value of 14 of 18. The two closing cases under lexical ranking: both HIT (`triggers-becomes-tapped-not-entering-tapped` expects 603.2e, `triggers-damage-prevented-no-trigger` expects 603.2g).

First-ship cases hybrid: 16 of 18, the same two misses as before (`panharmonicon-controller-not-entering-permanent` 603.2, `restoration-angel-blink-resets-counters` 400.7).

## B8 — benchmark recall@5

`npm run benchmark:rag-retrieval`: lexical-idf clean 0.5833, polluted 0.5769 (n=156). `npm run benchmark:rag-retrieval -- --semantic`: semantic-local clean 0.8974, polluted 0.8910. Both equal the REQ-220 record (0.5833 / 0.5769 lexical, 0.8974 / 0.8910 hybrid): unchanged. The two tracked `results.json` / `semantic-results.json` files were restored with `git checkout --` (the scripts rewrite `scoredAt` and also move a few stale committed fields; none of that is part of this change).

## Context-evaluation labelled System 3 checks

Semantic report in `npm --workspace apps/backend run test:eval`: 9 labelled fixtures, 14/14 checks PASS (2+2+1+1+1+2+1+2+2). Lexical: the checklist-report golden is unchanged and the golden test passes with every fixture PASS. So 14/14 semantic and 14/14 lexical.

## Not measured

Whole-prompt size change (brief: median 0, p95 +79, max +465, mean -30 characters) was not re-measured; it is "if cheap" and the brief's number stands.
