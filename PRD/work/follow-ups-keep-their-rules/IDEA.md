# Follow-ups keep their rules, and the eval learns to push back

When a player replies to Luna's ruling with "that's wrong, check again" or any follow-up, rule search runs on the follow-up text alone. The rules Luna quoted the first time disappear, and she sometimes tells the player a rule she just cited "wasn't provided". The outcome: a follow-up re-checks against the same rule excerpts the opening question retrieved, so Luna stands by a right ruling and corrects a wrong one at least as often as today. The answer-quality eval also gains an opt-in two-turn pushback mode so this can be measured on demand. Non-goals: no change to Luna's reasoning effort or prompt format, no new rules for a follow-up that raises a new topic, no practice-suite data in committed files, no `AskAiRequest` change.

## Prior run

- `PRD/instructions/receipts/right-rules-in-order-2026-10-12.md` (rule search changes, cap 15, merged after the intake brief was written)
- `PRD/instructions/receipts/rule-excerpt-cap-ten-2026-09-10.md` (earlier excerpt cap change, same retrieval ground)
- `PRD/instructions/receipts/hybrid-rule-retrieval-2026-09-06.md` (keyword plus embedding rule retrieval)
- `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md` (original rule retrieval and query building)
- `PRD/instructions/receipts/answer-quality-investigation-2026-10-07.md` (answer-quality eval, REQ-188 and REQ-230 family)
- `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md` (answer-quality eval baseline)
- `PRD/instructions/receipts/resolution-recipe-eval-2026-10-10.md` (eval run on the same judge and corpus, mentions follow-ups)
- `PRD/instructions/receipts/post-decrypt-follow-up-chat-2026-06-07.md` (follow-up chat contract, REQ-027 ground)
