# Idea: niche-interaction-rule-tests

**Problem.** A tester told the owner's friend that Ask AI got three hard rules interactions wrong: Academy Manufactor with Esix, Fractal Bloom (layered token replacement effects); and Silence with Necropotence and Borne Upon a Wind (using Necropotence's cleanup-step trigger to return to the end step and dodge Silence). The tester's verdict was "unreliable for difficult questions." These are the tester's claims, unverified. The tester's two verbatim questions arrived mid-run (`intake/screenwriter_temp_1791299243121.jpg`); whether he attached the cards is unknown.

**Owner re-scope (2026-10-06, before answering docs PR #266).** Focus on questions where the player attaches every named card, and treat the tester as having attached them. Fix rule retrieval first ("lets start with making the rules correct, and then we can make the output pretty"); refining the prompt's output format is the next step, and must be tested too. Validation is "a full test of all use cases were using to validate output of rules, this is just expanding on it".

**Outcome.** With the cards attached, the Comprehensive Rules that decide each reported question reach the AI's prompt, and every existing rule-output test (the rules test harness's gates, the gating context-evaluation harness, the worked-solutions retrieval check, the hybrid-retrieval benchmark) gives the same result it gives today. The two reported questions join the rule-output tests so the fix stays fixed (since 2026-10-07 both are approved cases in the rules test corpus; the brief records which of their rules this package delivers).

**Non-goals.** No prompt output-format change in this package (the named follow-up). No handling of card names typed without attaching the cards. No new live model calls in `npm test` or `quality:check`. No copying text from the tester's chat or from web sources into the repo as truth; any expected rule comes from the committed rules corpus.

## Prior run

- `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md` — rule-retrieval recall measurement and the lexical/semantic ranking work this package would test against
- `PRD/instructions/receipts/hybrid-rule-retrieval-2026-09-06.md` — shipped hybrid (meaning plus rare-word) ranking and the regression gate on it
- `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md` — the 18-case worked-solutions gold set and the answer-quality instrument; the natural home for new cases
- `PRD/instructions/receipts/rule-excerpt-cap-ten-2026-09-10.md` — excerpt cap moved 5 to 10 on the gold-set measurement; sets what "pulled" means today
- `PRD/instructions/receipts/prompt-context-retrieval-tuning-2026-06-18.md` — System 2 topic selection and System 3 scoring that decide which rules are pulled
- `PRD/instructions/receipts/supplemental-game-rules-retrieval-2026-06-05.md` — first supplemental-rule retrieval, with golden fixtures for interaction scenarios (state-based actions, cascade)
- `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md` — worked-solutions evaluation set first created, plus combo-question handling
- `PRD/instructions/receipts/commander-spellbook-combos-2026-08-22.md` — combo enrichment and its eval catalog (card-pair combos, a nearby test pattern)
