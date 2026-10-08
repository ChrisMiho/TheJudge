---
status: refined
---

# niche-interaction-rule-tests

Make the Comprehensive Rules that decide a hard interaction reach the AI when the player attaches the cards, starting with the two questions a tester reported (Academy Manufactor with Esix, Fractal Bloom; Silence with Necropotence and Borne Upon a Wind), and validate the change against every existing rule-output test, including the rules test harness that now holds both questions as approved cases. Re-scoped by the owner on 2026-10-06 (before answering docs PR #266): cards-attached cases only, fix retrieval first, prompt output format is the next package. Deferred until the harness existed and resumed 2026-10-07 after it shipped (PR #269).

- Idea: `IDEA.md`
- Owner intake (evidence only, never authority): `intake/` — the owner's note (`feedback.md`), three Discord screenshots of the tester's verdict, and a fourth (`screenwriter_temp_1791299243121.jpg`) with the tester's two verbatim prompts
- Design brief: `DESIGN-BRIEF.md`; proposed product truth: `GATE-QUESTIONS.md` (`REQ-220` new, `REQ-022` and `REQ-222` amended, `REQ-221` withdrawn)
- Measurement (offline): `measure-candidates.mjs` with its output `measure-candidates.out.txt` — baseline and every candidate retrieval change across the context-eval, first-ship worked-solutions, and benchmark suites (`npx tsx PRD/work/niche-interaction-rule-tests/measure-candidates.mjs`); `measure-rules-gate.mjs` with `measure-rules-gate.out.txt` (and `measure-rules-gate.nine.out.txt`, the topic without 614.1a) — the topic on the rules test harness: the real rules gate, the whole corpus, both tester cases in both wordings, production code with the topic patched in (`npx tsx PRD/work/niche-interaction-rule-tests/measure-rules-gate.mjs`); `measure-retrieval.mjs` is the first define's single-case probe, kept as earlier evidence
- Build step for the new topic: `build-topic-from-index.mjs` — adds REQ-220's topic to `gameRulesByTopic.json` from the committed rule index and writes nothing else (brief, Scope 1)
- Starting evidence in the repo: the rules test corpus and its offline rules gate (`apps/backend/src/eval/worked-solutions/`, `apps/backend/src/eval/rules-gate/`, REQ-185, REQ-222), the coverage gate and staleness report (REQ-223, REQ-225), the gating context-evaluation harness (`apps/backend/src/eval/contextEvaluationHarness.test.ts`, REQ-032), the worked-solutions retrieval check (`npm run eval:worked-solutions`, NFR-018), and the hybrid-retrieval benchmark (`apps/backend/src/eval/ragRetrievalBenchmark.test.ts`, REQ-177, REQ-182)

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/niche-interaction-rule-tests/DESIGN-BRIEF.md`
- Findings: none
- Verified at gate-qc attempt 6 (2026-10-07, on the tree with `origin/main` merged at `92031511`): both amendment-set greps re-run as quoted (Invariant 1: 28 hits, Invariant 2: 12 hits, every hit with a disposition row and every amend row with a diff); the old side of all 19 diff blocks matches `PRD/sections/` exactly; REQ-220 and REQ-221 unused; `measure-rules-gate.mjs` (ten-rule and nine-rule) and `measure-candidates.mjs` outputs byte-identical to the committed `.out.txt` files; `build-topic-from-index.mjs` on a scratch export: 23 → 24 topics, 3,846-character excerpt, 25,808 total under the 26,000 cap, only the manifest and `gameRulesByTopic.json` change; `gameRulesBuildPolicy.test.ts` fails 23 vs 24 then passes 9/9 with the proposed numbers; the fresh-worktree build sequence needs no gitignored file and names every gating test it touches.
- Non-blocking notes for the build (no scope or number changes):
  1. `PRD/sections/system-map/prompt-assembly.md:40-41` (selects curated game-rule topics from the normalized game state) is outside the grep and has no disposition row; not contradicted, since the normalized context includes the cards. A one-line unchanged row would match the brief's pattern.
  2. The REQ-222 line being rewritten (`functional-requirements.md:5791`) keeps the dated first-ship sentence (16 cases with every deciding rule reaching the prompt; 603.2 and 400.7 recorded as misses). Under the amended counting that literal count would be 18; it is a historical System 3 count and the `hit`/`miss` lists keep their System 3 meaning, so it is not wrong. The build may add the words a System 3 excerpt to remove the ambiguity.
  3. The brief's assumption table (`DESIGN-BRIEF.md:704`) names `contextCards` as the card set the selector reads; that name exists only in the measure scripts. The production equivalent is `buildQueryParts` in `gameRulesRetrieval.ts` (stack plus populated zones).
