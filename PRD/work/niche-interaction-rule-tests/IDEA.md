# Idea: niche-interaction-rule-tests

**Problem.** A tester told the owner's friend that Ask AI got three hard rules interactions wrong: Academy Manufactor with Esix, Fractal Bloom (layered token replacement effects); and Silence with Necropotence and Borne Upon a Wind (using Necropotence's cleanup-step trigger to return to the end step and dodge Silence). The tester's verdict was "unreliable for difficult questions." These are the tester's claims, unverified; the exact inputs the tester typed are unknown (the owner is waiting on a reply from Ryan).

**Outcome.** A small set of repeatable tests that ask, for each of these interactions, whether the right Comprehensive Rules excerpts reach the prompt. A test that fails shows a retrieval gap the owner can see and fix. The tester's claim that an LLM cannot do this is then checked with evidence instead of argued.

**Non-goals.** No change to retrieval, prompts, or answers in this package. No new live model calls in `npm test` or `quality:check`. No copying text from the tester's chat or from web sources into the repo as truth; any gold answer must come from the committed rules corpus or a published, citable source.

## Prior run

- `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md` — rule-retrieval recall measurement and the lexical/semantic ranking work this package would test against
- `PRD/instructions/receipts/hybrid-rule-retrieval-2026-09-06.md` — shipped hybrid (meaning plus rare-word) ranking and the regression gate on it
- `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md` — the 18-case worked-solutions gold set and the answer-quality instrument; the natural home for new cases
- `PRD/instructions/receipts/rule-excerpt-cap-ten-2026-09-10.md` — excerpt cap moved 5 to 10 on the gold-set measurement; sets what "pulled" means today
- `PRD/instructions/receipts/prompt-context-retrieval-tuning-2026-06-18.md` — System 2 topic selection and System 3 scoring that decide which rules are pulled
- `PRD/instructions/receipts/supplemental-game-rules-retrieval-2026-06-05.md` — first supplemental-rule retrieval, with golden fixtures for interaction scenarios (state-based actions, cascade)
- `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md` — worked-solutions evaluation set first created, plus combo-question handling
- `PRD/instructions/receipts/commander-spellbook-combos-2026-08-22.md` — combo enrichment and its eval catalog (card-pair combos, a nearby test pattern)
