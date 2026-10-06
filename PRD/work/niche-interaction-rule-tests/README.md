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
  1. (Important) The topic build step cannot produce its required result. The brief requires `gameRulesRuleIndex.json`, `gameRulesTokenStats.json`, and every existing topic to come out unchanged, and tells the builder to copy the launch checkout's `apps/backend/data/cr/source.txt`. That file is the 2026-08-07 rules text; the committed artifacts were built from the 2026-06-05 text. A scratch run of `node scripts/build-game-rules.mjs` with the nine rules added and that source: rule index 2,873 → 2,890 entries with 50 old entries' text changed (including 616.2, which the new topic carries, and 514.3a, which the Necropotence + Silence fixture needs); `gameRulesTokenStats.json` changes; existing topic `damage-lifelink-deathtouch` changes (820 vs 790 chars). Embeddings and core-topics stayed identical but would no longer match the rewritten index. Following the brief ends in its own stop-and-report. Fix: pick one path and say so — add only the new topic and leave every other artifact untouched (stating which rules text the nine rules come from), or make a rules-text refresh explicit scope with index, stats, embeddings, goldens re-measured and brought to the owner. Reconcile REQ-220's byte-identical criterion with the chosen path.
  2. (Important) The new topic breaks an existing gating test neither the brief nor REQ-220 names: `apps/frontend/src/lib/gameRulesBuildPolicy.test.ts` asserts exactly 23 topics (line 202) and total topic text between 18,000 and 22,000 characters. Committed total 21,962; +~3,670 → ~25,630, failing both limits. Fix: name the test in Scope and in Mechanism tests to expect touching, and in REQ-220's acceptance criteria give the new topic count (24) and the new ceiling. Raising a prompt-size guard is an owner-visible choice.
  3. (Minor) `apps/backend/src/eval/fixtures/checklist-report.golden.txt` is a third committed golden (one row per fixture), asserted by the golden-scenario test; it must gain two rows. Name it in the fixture scope and REQ-221's golden criterion, and keep the 0-of-31-goldens wording scoped to prompt and context goldens.
  4. (Minor) The 3,662-character topic cost is rule text only; through `formatGameRulesSection` the real addition is about 3,720 (title line plus separators). Say about 3,700, or state that 3,662 is rule text only.
  5. (Minor) Neighbouring restatements lack disposition rows: `functional-requirements.md:1782` (REQ-074, lookup omits System 2 game-state topic gating), `quick-lookup/README.md:215` (same), and `quick-lookup/README.md:200` (three things always run regardless of the attached card set). All still true (the new gate is card-wording, not game-state; the lookup topic list stays a superset of the core four). Add unchanged, still-true rows.
