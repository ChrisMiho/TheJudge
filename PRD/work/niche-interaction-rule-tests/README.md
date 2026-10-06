---
status: refining
---

# niche-interaction-rule-tests

Make the Comprehensive Rules that decide a hard interaction reach the AI when the player attaches the cards, starting with the two questions a tester reported (Academy Manufactor with Esix, Fractal Bloom; Silence with Necropotence and Borne Upon a Wind), and validate the change against every existing rule-output test plus those two cases. Re-scoped by the owner on 2026-10-06 (before answering docs PR #266): cards-attached cases only, fix retrieval first, prompt output format is the next package.

- Idea: `IDEA.md`
- Owner intake (evidence only, never authority): `intake/` — the owner's note (`feedback.md`), three Discord screenshots of the tester's verdict, and a fourth (`screenwriter_temp_1791299243121.jpg`) with the tester's two verbatim prompts
- Design brief: `DESIGN-BRIEF.md`; proposed product truth: `GATE-QUESTIONS.md` (`REQ-220` new, `REQ-022` amended, `REQ-221` new)
- Measurement (offline): `measure-candidates.mjs` with its output `measure-candidates.out.txt` — baseline and every candidate retrieval change across all rule-output suites (`npx tsx PRD/work/niche-interaction-rule-tests/measure-candidates.mjs`); `measure-retrieval.mjs` is the first define's single-case probe, kept as earlier evidence
- Starting evidence in the repo: the gating context-evaluation harness (`apps/backend/src/eval/contextEvaluationHarness.test.ts`, REQ-032), the worked-solutions retrieval check (`apps/backend/src/eval/worked-solutions/README.md`, REQ-185, NFR-018), and the hybrid-retrieval benchmark (`apps/backend/src/eval/ragRetrievalBenchmark.test.ts`, REQ-177, REQ-182)

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/niche-interaction-rule-tests

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/niche-interaction-rule-tests/DESIGN-BRIEF.md`
- Findings:
  1. (Important) Q1's fixture cannot carry a frozen vector or a semantic check as written. REQ-221 says each fixture has committed prompt and context goldens, a frozen query embedding, and passes the semantic-path relevance check; the brief says the build produces two new vectors. `scripts/build-frozen-query-embeddings.mjs` and `contextEvaluationHarness.test.ts:265` only treat a fixture as labelled when it carries `expectedSupplementalRuleIds` or `forbiddenSupplementalRuleIds`. `quick-lookup-replacement-interaction` carries only `expectedSystem2TopicIds`, so it gets no vector and no semantic System 3 check. Fix: say Q1 has goldens and the System 2 topic label only, with one new vector (Q2's), and correct the brief's two-new-vectors wording — or deliberately add a System 3 label to Q1.
  2. (Important) The claim that no candidate got 616.1 into the top ten contradicts the measurement. `GATE-QUESTIONS.md` REQ-220 In plain terms and the brief both say it. Under lexical ranking C3 puts 616.1 at #8 and C4 at #7. What holds across every candidate and both rankings is that 616.1f stays at #25 or worse; under hybrid (shipped) 616.1 reaches #31–35. Fix: restate as no search-side candidate got both 616.1 and 616.1f into the top ten under both rankings, and have the REQ-220 Notes line name the lexical #7/#8 alongside hybrid #31–35.
  3. (Important) The topic cannot be built as the brief instructs. The brief says the topic is rebuilt into `gameRulesByTopic.json` by `npm run data:build`. `apps/backend/data/cr/source.txt` is gitignored and absent in worktrees (it exists only in the launch checkout, the 2026-08-07 text, containing all nine rules). Without it `scripts/build-game-rules.mjs` takes the `validateExistingArtifact()` path, prints Preserved existing artifact, exits 0, and silently does not write the topic. Fix: the brief tells the builder to copy that local file into the worktree (no download — that would need human approval), run `node scripts/build-game-rules.mjs` only, and require the topic present in the artifact with verbatim rule text, and the rule index and embeddings byte-identical.
  4. (Minor) The amendment-set grep is case-sensitive and misses restatements. Case-insensitive gives 28 hits; the extra, `quick-lookup/README.md:349` (always-on core topics, a fixed four-topic core set), needs a disposition row (unchanged, with reason). Also missing rows: `system-map/game-rules-retrieval.md:94` (still true), `PRD/ideasForLater/future-infra/sections/retrieval-architecture.md:10` (parked idea file, not truth), and the JSDoc at `gameRulesTopicSelection.ts:93` (game-state signals only; build updates it with the header at `:7`).
  5. (Minor) REQ-220's matching rule is under-specified. It says the oracle text contains the word instead / prevent / prevents / prevented; the measurement used `/\binstead\b/i` and `/\bprevent(s|ed)?\b/i` — case-insensitive, whole word, so prevention and preventing do not count, and the 4.8% rate and 0-of-31 churn depend on that. Fix: add case-insensitive, whole word to the criterion.
  6. (Minor) The follow-up cost range does not reproduce. The brief says the two prompts are about 14,500–18,200 characters (costed at about $0.012–$0.014). Measured: Q1 14,524; Q2 14,699 (hybrid) or 15,136 (lexical). Fix: correct the upper bound or drop it.
