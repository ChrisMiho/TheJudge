---
status: active
---

# niche-interaction-rule-tests

Make the Comprehensive Rules that decide a hard interaction reach the AI when the player attaches the cards, starting with the two questions a tester reported (Academy Manufactor with Esix, Fractal Bloom; Silence with Necropotence and Borne Upon a Wind), and validate the change against every existing rule-output test, including the rules test harness that now holds both questions as approved cases. Re-scoped by the owner on 2026-10-06 (before answering docs PR #266): cards-attached cases only, fix retrieval first, prompt output format is the next package. Deferred until the harness existed and resumed 2026-10-07 after it shipped (PR #269).

- Idea: `IDEA.md`
- Owner intake (evidence only, never authority): `intake/` — the owner's note (`feedback.md`), three Discord screenshots of the tester's verdict, and a fourth (`screenwriter_temp_1791299243121.jpg`) with the tester's two verbatim prompts
- Design brief: `DESIGN-BRIEF.md`; proposed product truth: `GATE-QUESTIONS.md` (`REQ-220` new, `REQ-022` and `REQ-222` amended, `REQ-221` withdrawn)
- Measurement (offline): `measure-candidates.mjs` with its output `measure-candidates.out.txt` — baseline and every candidate retrieval change across the context-eval, first-ship worked-solutions, and benchmark suites (`npx tsx PRD/work/niche-interaction-rule-tests/measure-candidates.mjs`); `measure-rules-gate.mjs` with `measure-rules-gate.out.txt` (and `measure-rules-gate.nine.out.txt`, the topic without 614.1a) — the topic on the rules test harness: the real rules gate, the whole corpus, both tester cases in both wordings, production code with the topic patched in (`npx tsx PRD/work/niche-interaction-rule-tests/measure-rules-gate.mjs`); `measure-retrieval.mjs` is the first define's single-case probe, kept as earlier evidence
- Build step for the new topic: `build-topic-from-index.mjs` — adds REQ-220's topic to `gameRulesByTopic.json` from the committed rule index and writes nothing else (brief, Scope 1)
- Starting evidence in the repo: the rules test corpus and its offline rules gate (`apps/backend/src/eval/worked-solutions/`, `apps/backend/src/eval/rules-gate/`, REQ-185, REQ-222), the coverage gate and staleness report (REQ-223, REQ-225), the gating context-evaluation harness (`apps/backend/src/eval/contextEvaluationHarness.test.ts`, REQ-032), the worked-solutions retrieval check (`npm run eval:worked-solutions`, NFR-018), and the hybrid-retrieval benchmark (`apps/backend/src/eval/ragRetrievalBenchmark.test.ts`, REQ-177, REQ-182)

## Slices

| Slice | Title | Status | Depends on | Criteria |
| --- | --- | --- | --- | --- |
| A | [Topic data and size guard](slice-a-topic-data-and-size-guard.md) | done | none | 8 (1 manual) |
| B | [Card-wording selector and the rules-retrieval product truth](slice-b-card-wording-selector-and-rules-truth.md) | done | Slice A (the topic must exist in the committed artifact for the lookup and prompt tests) | 12 (0 manual) |
| C | [The rules gate counts a rule a curated topic carries](slice-c-rules-gate-counts-topic-rules.md) | done | Slices A and B (the baseline records the topic only once the selector fires it) | 11 (0 manual) |
| D | [Re-measure against every rule-output suite and ship](slice-d-remeasure-and-ship.md) | planned | Slices A, B, and C | 14 (4 manual) |

Build note (2026-10-07): Slices B and C landed in one commit. Slice B alone turns the topic on, which makes the rules gate fail on `replacement-bard-and-bilbo-tokens` until Slice C teaches the gate to count topic-carried rules, so no B-only tree passes `npm run quality:check`.

Plan: [GAMEPLAN.md](GAMEPLAN.md). Build order A, B, C, D. Slices B and C apply the owner-accepted product truth (REQ-220 new; REQ-022 and REQ-222 amended; REQ-221 withdrawn and unused) to `PRD/sections/` with the code; Slice D replaces REQ-220's last Notes bullet with the measured before and after. Build step 7 (copy `apps/backend/data/models/` from the main checkout, never download) and the PR #273 rule-index check are carried in Slices A and D.

## Implementation map

| Area | Files |
| --- | --- |
| Topic data and size guard (A) | `apps/backend/data/gameRulesTopicManifest.json`, `apps/backend/data/gameRulesByTopic.json` (via `build-topic-from-index.mjs`), `apps/frontend/src/lib/gameRulesBuildPolicy.test.ts` |
| Selector and call sites (B) | `apps/backend/src/gameRulesTopicSelection.ts`, `apps/backend/src/prompt/preparation.ts`, and their tests |
| Rules gate (C) | `apps/backend/src/eval/rules-gate/rulesGate.ts`, `baseline.ts`, `rulesGate.test.ts`, `baseline.json` |
| Product truth (B, C, D) | `PRD/sections/functional-requirements.md`, `system-map.md`, `system-map/game-rules-retrieval.md`, `system-map/prompt-layout-spec.md`, `integrations-and-data.md`, `quick-lookup/README.md`, `in-depth/README.md`; `apps/backend/src/eval/worked-solutions/README.md` |
| Re-measure (D) | `npm run quality:check`, `eval:worked-solutions`, `eval:rules-staleness`, `eval:evidence-trace`; `slice-d.evidence.md` |

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/niche-interaction-rule-tests/DESIGN-BRIEF.md`
- Findings: none
- Verified at gate-qc attempt 8 (2026-10-07, build half, `thejudge-auto/niche-interaction-rule-tests-work` on `origin/main` `c1188dc8`): `PRD/sections/`, `GATE-QUESTIONS.md`, code, and the measure outputs unchanged since `c1188dc8`; amendment greps 28 + 12 hits; REQ-220/221 unused; the brief's fresh-worktree sequence run in a scratch export — without the model folder `npm run eval:worked-solutions` exits 1, after step 7's `cp -R` it exits 0 with 392/392 ranked semantically and 287/392; without the folder, `eval:rules-staleness`, `eval:rules-gate:baseline` (392 / 287 hit / 0 regressed), the rules-gate, context-eval and benchmark tests (43/43) and frontend coverage (1559/1559) all pass, so the no-gitignored-file claim holds except the named folder; embedder `allowRemoteModels = false`.
- Non-blocking note from attempt 8: the brief cites `localEmbeddingProvider.ts:31` without its directory; the real path is `apps/backend/src/providers/localEmbeddingProvider.ts`.
- Attempt 7 (FAIL, fixed by owner-authorized define attempt 7): 1 finding —
  1. The brief's fresh-worktree build section says no step needs a gitignored file or a network call. Step 7 (Scope 6, the re-measure) runs `npm run eval:worked-solutions`, which embeds with the local MiniLM model in `apps/backend/data/models/` — gitignored (`.gitignore:89`) and absent from a fresh worktree. Run without it, the script exits 1 (`EMBEDDING_PROVIDER=local returned no embedding for gold case abandon-rule-text … Refusing to record that`); its hint, `node scripts/warm-embedding-model-cache.mjs`, needs a network download. The 287/392 re-measure is an acceptance number, so the builder would stall there. `npm run quality:check` is unaffected. The same applies to the three define scripts if re-run. Fix: one sentence in the build section — before step 7, copy `apps/backend/data/models/` from the main checkout (or run the warm script) — and correct the no-gitignored-file claim to name this folder.
- Re-verified clean at attempt 7: both amendment greps (28 + 12 hits, all dispositioned); all 24 diff blocks match `PRD/sections/` exactly at the expected anchors; REQ-220/221 unused; `measure-rules-gate.mjs` (ten and nine), `measure-candidates.mjs` byte-identical to the committed `.out.txt`; scratch topic build 23 → 24 topics, 3,846-character excerpt, 25,808 total under 26,000, only `gameRulesByTopic.json` changes; build-policy test 9/9 with the proposed numbers; rules-gate, context-eval, topic-selection tests 50/50; every cited number reproduces.
- Previously (attempt 6): PASS. Verified at gate-qc attempt 6 (2026-10-07, on the tree with `origin/main` merged at `92031511`): both amendment-set greps re-run as quoted (Invariant 1: 28 hits, Invariant 2: 12 hits, every hit with a disposition row and every amend row with a diff); the old side of all 19 diff blocks matches `PRD/sections/` exactly; REQ-220 and REQ-221 unused; `measure-rules-gate.mjs` (ten-rule and nine-rule) and `measure-candidates.mjs` outputs byte-identical to the committed `.out.txt` files; `build-topic-from-index.mjs` on a scratch export: 23 → 24 topics, 3,846-character excerpt, 25,808 total under the 26,000 cap, only the manifest and `gameRulesByTopic.json` change; `gameRulesBuildPolicy.test.ts` fails 23 vs 24 then passes 9/9 with the proposed numbers; the fresh-worktree build sequence needs no gitignored file and names every gating test it touches.
- Non-blocking notes for the build (no scope or number changes):
  1. `PRD/sections/system-map/prompt-assembly.md:40-41` (selects curated game-rule topics from the normalized game state) is outside the grep and has no disposition row; not contradicted, since the normalized context includes the cards. A one-line unchanged row would match the brief's pattern.
  2. The REQ-222 line being rewritten (`functional-requirements.md:5791`) keeps the dated first-ship sentence (16 cases with every deciding rule reaching the prompt; 603.2 and 400.7 recorded as misses). Under the amended counting that literal count would be 18; it is a historical System 3 count and the `hit`/`miss` lists keep their System 3 meaning, so it is not wrong. The build may add the words a System 3 excerpt to remove the ambiguity.
  3. The brief's assumption table (`DESIGN-BRIEF.md:704`) names `contextCards` as the card set the selector reads; that name exists only in the measure scripts. The production equivalent is `buildQueryParts` in `gameRulesRetrieval.ts` (stack plus populated zones).
