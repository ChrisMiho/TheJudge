# rules-test-harness

**Problem.** Today Ask AI is graded on 18 hard rules cases. That cannot tell the owner whether the AI is giving wrong or made-up rulings across the whole game, and checking live every time costs too much.

**Outcome.** A test backbone the owner can trust. About 400 cases: one for every real Magic mechanic plus about 120 hard interactions in twelve hard rules areas, such as copies, layers, replacement effects, triggers, and multiplayer, answered by official Wizards text wherever it exists. Offline checks, free and safe to gate on, catch a card the player attached that never reaches the AI and a deciding rule that stops reaching it. The AI's final ruling is graded only on demand, re-paying only for cases whose prompt changed. The owner reviews every case before it counts, and the case format is ready for all six test layers (run 1 switches on three).

**Non-goals.** No change to the live prompt or to Ask AI behavior (no clarification behavior); no rebuild of the rule index or Comprehensive Rules refresh; no live run in `quality:check` or any build gate; no outside-source text (Stack Exchange, Cranial Insertion) in run 1; no player-wording or clarification tests yet; run 2 depth is out of scope.

**Source.** Owner request plus the owner-prepared intake at `PRD/work/rules-test-harness/intake/GRAPH-BRIEF.md` (evidence, never authority). It cites, as paths only and unopened: `PRD/work/probe-rules-test-harness/` (`FINDINGS-repo-baseline.md`, `FINDINGS-mechanic-coverage.md`, `FINDINGS-external-sources.md`), `PRD/work/properRulesTestHarness/gameplanIdeas.md`, and the deferred `niche-interaction-rule-tests` package (draft PR #266).

## Prior run

- `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md` — built the answer-quality instrument (gold cases, judge, `npm run eval:answer-quality`, REQ-185–190) that this run extends.
- `PRD/instructions/receipts/rule-excerpt-cap-ten-2026-09-10.md` — raised the rule-excerpt cap 5 to 10 and measured 16/18 to 18/18 on the 18-case gold set, the baseline this run's ratchet starts from.
- `PRD/instructions/receipts/hybrid-rule-retrieval-2026-09-06.md` — hybrid rule retrieval plus the REQ-177 lexical baseline gate the intake's ratchet is modelled on.
- `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md` — rule-retrieval fixes and the recall-measuring tools whose hit counts the offline rule check relies on.
- `PRD/instructions/receipts/prompt-context-retrieval-tuning-2026-06-18.md` — System 2 / System 3 eval checks and labelled fixtures (kept untouched).
- `PRD/instructions/receipts/supplemental-game-rules-retrieval-2026-06-05.md` — eval harness checklist IDs and golden prompt fixtures (kept untouched).
- `PRD/instructions/receipts/general-game-rules-prompt-2026-06-05.md` — golden prompt fixtures for the game-rules block (kept untouched).
- `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md` — worked-solutions input and golden fixture confirmation.
- `PRD/instructions/receipts/resilient-weekly-data-refresh-2026-09-08.md` — names the deferred eval-golden regeneration that rebuilding the rule index would trigger.
- `PRD/instructions/receipts/commander-spellbook-combos-2026-08-22.md` — earlier combo answer-quality comparison, adjacent ground.
