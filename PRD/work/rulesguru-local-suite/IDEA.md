# Idea: local RulesGuru practice suite

Problem: the AI judge is checked against about 400 committed cases, so wrong rulings on questions nobody wrote stay invisible. Outcome: the owner imports a much larger set of judge-style rules questions from RulesGuru (used with permission, local only) and runs the retrieval check and the answer-quality run over it, split by level, complexity and tag. The tooling is a polite, resumable import command that freezes each question as fetched, a converter into the existing case format with card and rule mapping, and suite selection plus filters on both runs. Non-goals: no RulesGuru question, answer, card-roll text or per-question result is ever committed; tooling is tested on synthetic data only; RulesGuru answers are never approved reference answers (REQ-185); nothing enters a player's prompt.

## Prior run
- PRD/instructions/receipts/rules-test-harness-2026-10-06.md
- PRD/instructions/receipts/answer-quality-investigation-2026-10-07.md
- PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md
- PRD/instructions/receipts/niche-interaction-rule-tests-2026-10-07.md
- PRD/instructions/receipts/exact-curated-rule-exclusion-2026-10-08.md
