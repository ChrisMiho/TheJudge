---
status: deferred
---

# niche-interaction-rule-tests

Make the Comprehensive Rules that decide a hard interaction reach the AI when the player attaches the cards, starting with the two questions a tester reported (Academy Manufactor with Esix, Fractal Bloom; Silence with Necropotence and Borne Upon a Wind), and validate the change against every existing rule-output test plus those two cases. Re-scoped by the owner on 2026-10-06 (before answering docs PR #266): cards-attached cases only, fix retrieval first, prompt output format is the next package.

- Idea: `IDEA.md`
- Owner intake (evidence only, never authority): `intake/` — the owner's note (`feedback.md`), three Discord screenshots of the tester's verdict, and a fourth (`screenwriter_temp_1791299243121.jpg`) with the tester's two verbatim prompts
- Design brief: `DESIGN-BRIEF.md`; proposed product truth: `GATE-QUESTIONS.md` (`REQ-220` new, `REQ-022` amended, `REQ-221` new)
- Measurement (offline): `measure-candidates.mjs` with its output `measure-candidates.out.txt` — baseline and every candidate retrieval change across all rule-output suites (`npx tsx PRD/work/niche-interaction-rule-tests/measure-candidates.mjs`); `measure-retrieval.mjs` is the first define's single-case probe, kept as earlier evidence
- Build step for the new topic: `build-topic-from-index.mjs` — adds REQ-220's topic to `gameRulesByTopic.json` from the committed rule index and writes nothing else (brief, Scope 1)
- Starting evidence in the repo: the gating context-evaluation harness (`apps/backend/src/eval/contextEvaluationHarness.test.ts`, REQ-032), the worked-solutions retrieval check (`apps/backend/src/eval/worked-solutions/README.md`, REQ-185, NFR-018), and the hybrid-retrieval benchmark (`apps/backend/src/eval/ragRetrievalBenchmark.test.ts`, REQ-177, REQ-182)

## Deferral record

- Previous status: owner-action
- Reason: owner wants a proper rules test harness (answer-level validation) built first; resume this package after it exists, re-measure REQ-220 on that harness, and fold REQ-221's two cases into it

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/niche-interaction-rule-tests

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/niche-interaction-rule-tests/DESIGN-BRIEF.md`
- Findings:
  1. (Important) The new topic's game-mode scope is misdescribed in three owner-facing places. The selector (`contextCards`, `selectGameRulesTopics`) reads every card on the stack plus every populated zone (battlefield, hand, graveyard, exile, library, command). `GATE-QUESTIONS.md:31` says on the stack or battlefield; the in-depth README diff at `GATE-QUESTIONS.md:219` says two or more cards on the stack or in play; `DESIGN-BRIEF.md:196` says on the stack or in play. REQ-220's criterion (`GATE-QUESTIONS.md:77`) and brief Scope 3 correctly say every card on the stack and in populated zones. As written, the in-depth README text that would become product truth contradicts REQ-220. Fix: one phrase everywhere (for example, on the stack or in any zone), or narrow the selector and re-measure.
  2. (Minor) Three restatements of what a lookup prompt assembles lack disposition rows: `user-flows.md:527` (FLOW-023 step 5), `quick-lookup/README.md:203-211` (the one-or-more-cards-attached bullet), `functional-requirements.md:1781` (REQ-074 second criterion). None contradicts REQ-220; the new topic is simply absent from each list. Fix: add disposition rows (unchanged, still true; carried by REQ-220 and the `quick-lookup/README.md:288` bullet), or add one clause to FLOW-023 step 5.
