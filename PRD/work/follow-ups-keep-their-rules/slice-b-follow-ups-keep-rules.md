# Slice B — follow-ups keep the opening question's rules

## Status: planned

## Goal

A player's follow-up is answered with the same three rules sections (`PHASE GUIDANCE`, `GAME RULES (reference)`, `ADDITIONAL RELEVANT RULE EXCERPTS`) as the opening question, in both modes, with no change to the request or to opening questions.

## Requirements

Truth applied by intent (accepted slots in `GATE-QUESTIONS.md`; edit `PRD/sections/` in this slice):

- REQ-246 (new, appended after REQ-245): follow-ups keep the rules their opening question found.
- REQ-178, REQ-022, REQ-074, REQ-027, REQ-024, REQ-238, REQ-242 (amend): each says that on a follow-up "the question" for rule selection is the conversation's opening question, and gains REQ-246 under Dependencies; REQ-238 and REQ-242 gain their one acceptance bullet each.
- The 13 `build` rows of `evidence/amendment-grep.md`, updated to match: `user-flows.md` (FLOW-005 step 7, FLOW-011 step 9), `integrations-and-data.md` (conversation-history section rules), `quick-lookup/README.md`, `in-depth/README.md` (follow-up bullet and System 3 query), `system-map/prompt-assembly.md`, `system-map/game-rules-retrieval.md` (In-Depth triggers, System 3 query, invariants list), `system-map/prompt-layout-spec.md` (PHASE GUIDANCE, GAME RULES, ADDITIONAL RELEVANT RULE EXCERPTS follow-up notes). Re-run the grep line in that file first; dispose any new hit.

Code (`apps/backend/src/`):

1. One helper returns the question rule selection reads: `conversationHistory[0].content` when history is present, otherwise `question`. It reads the request's own history, not the truncated copy. No second copy of the rule.
2. `buildRetrievalQueryInput` and the System 3 word query in the lookup and game branches of `preparation.ts` call it, so `buildRetrievalQueryText` and `buildPerCardSearchTexts` return the opening request's values and the route embeds the opening query.
3. The In-Depth question-word trigger read in `gameRulesTopicSelection.ts` (today `context.finalQuestion`) uses it.
4. The Quick Lookup `namedTurnSteps` read at `preparation.ts:284` uses it.
5. Combo section keeps reading the follow-up text. `QUESTION` and `CONVERSATION HISTORY` unchanged. No `AskAiRequest`, schema, route, response or frontend change; no server-side store.
6. Record the embedder repeatability check (same text embedded twice in one process, warm cache, same vector). If the local model is not available here, the criterion is manual and the observation line says so; if it fails, park and return the intake's choice (store turn 1's rules, or send them in the request) to the owner.

## Acceptance criteria

- [ ] B1: One function decides the rule-selection question and every reader (System 3 query input, System 3 word query, In-Depth topic triggers, Quick Lookup named steps) calls it; a grep finds no other read of `request.question` or `finalQuestion` for rule selection
- [ ] B2: Unit tests prove a follow-up's `PHASE GUIDANCE`, `GAME RULES (reference)` and `ADDITIONAL RELEVANT RULE EXCERPTS` are byte-identical to its opening request's in Quick Lookup and In-Depth, including an opening question that names a turn step in words and one whose words trigger an In-Depth topic the follow-up's words do not
- [ ] B3: Tests prove `buildRetrievalQueryText` and `buildPerCardSearchTexts` return the opening request's values for a follow-up, and the route embeds the opening query
- [ ] B4: The offline measurement reproduces the brief's targets on the 62 diagnostic cases: System 3 selection equal in 62 of 62, In-Depth curated topics equal in 9 of 9, Quick Lookup `PHASE GUIDANCE` equal in 53 of 53
- [ ] B5: A request without `conversationHistory` produces a byte-identical prompt: all existing prompt tests, preview fixtures and the offline prompt gate (REQ-222) pass unchanged
- [ ] B6: With `ASK_AI_PROVIDER=mock`, a follow-up's answer prints the assembled prompt carrying the opening question's rules (tested)
- [ ] B7: The combo section still reads the follow-up text (tested), and the follow-up text is never merged into rule selection
- [ ] B8: No `AskAiRequest`, Zod schema, route handler logic, response, or frontend file changed beyond the one embed-input call path; `git diff --stat origin/main HEAD -- apps/frontend apps/backend/src/validation` is empty
- [ ] B9: `functional-requirements.md` carries new REQ-246 and the seven amendments exactly as the accepted slots state
- [ ] B10: Embedder repeatability recorded: the same text embedded twice in one process returns the same vector (a dated observation line in `slice-b.evidence.md`; park and report if it fails)
- [ ] B11: The 13 derived-doc rows are updated and the amendment grep re-run shows no remaining doc line saying a follow-up's rules come from the follow-up's words
- [ ] B12: `npm --workspace apps/backend run test`, `npm run test:scripts`, `npm run typecheck`, `npm run lint` and `npm run format:check` are green
- [ ] B13: PRD promotion checklist done at build (cleanup only confirms): every accepted slot's text is in `PRD/sections/`, nothing in `PRD/sections/` is left pointing at `PRD/work/follow-ups-keep-their-rules/`

## Verification

```bash
npm --workspace apps/backend run test
node --no-warnings --import ./PRD/work/follow-ups-keep-their-rules/evidence/register.mjs ./PRD/work/follow-ups-keep-their-rules/evidence/measure-follow-up.mjs "$PWD"
npm run test:scripts
npm run typecheck && npm run lint && npm run format:check
git diff --stat origin/main HEAD -- apps/frontend apps/backend/src/validation
grep -rn "ruleSelectionQuestion\|conversationHistory?.\[0\]" apps/backend/src
```

## Files touched

- `apps/backend/src/prompt/preparation.ts`, `apps/backend/src/gameRulesTopicSelection.ts` (and the helper's home, e.g. `apps/backend/src/prompt/ruleSelectionQuestion.ts`)
- `apps/backend/src/routes/askAi.ts` only if the embed input needs it (expected: none)
- tests beside each: `preparation.test.ts`, `gameRulesTopicSelection.test.ts`, `gameRulesRetrieval.test.ts`, `mockAskAi.test.ts`, `app.behavior.test.ts` (route embed)
- `PRD/sections/functional-requirements.md` (REQ-246 new; REQ-178, REQ-022, REQ-074, REQ-027, REQ-024, REQ-238, REQ-242)
- derived docs under `PRD/sections/` listed above

## PRD promotion checklist (executed in cleanup)

- [ ] REQ-246 and REQ-247 present and the nine amendments applied in `functional-requirements.md`
- [ ] The 13 derived-doc rows applied
- [ ] Receipt names the post-merge before/after pushback runs as owner steps
- [ ] The REQ-246 follow-up item (new-topic follow-ups) is carried in the receipt as a follow-up, not built

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/follow-ups-keep-their-rules/` ready to delete
