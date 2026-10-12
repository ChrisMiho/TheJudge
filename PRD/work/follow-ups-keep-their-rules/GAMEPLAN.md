# Gameplan — follow-ups keep their rules, and the eval learns to push back

Design: `DESIGN-BRIEF.md`. Truth: the 11 accepted slots in `GATE-QUESTIONS.md` (11 accept, 0 edit, 0 reject). Quality-check: PASS (README `## Preparation gate`).

## What a player and the owner get

A player pushes back on Luna's ruling ("that's wrong, check again"). Luna re-checks against the same rules she had the first time, instead of rules searched from the pushback's words. The owner can run a two-turn pushback mode in the answer-quality eval to measure whether right answers hold and wrong ones get fixed.

## Slices

| Slice | Goal | Depends on |
| --- | --- | --- |
| A | The eval's pushback mode (`--follow-up pushback`), tooling only. Applies REQ-247, REQ-226, REQ-228. | none |
| B | A follow-up keeps the opening question's rules. Applies REQ-246, REQ-178, REQ-022, REQ-074, REQ-027, REQ-024, REQ-238, REQ-242, plus the 13 derived-doc rows. Final slice: ship gates. | A (ordering only) |

Sequential, with a stated blocker: A lands as its own commit before B so the owner's post-merge "before" run can be launched from A's commit, which still follows up with today's retrieval (brief, Assumption 9). The two slices touch disjoint code (A: `scripts/`; B: `apps/backend/src/`), so they share no files except `PRD/sections/functional-requirements.md`, where each edits different entries.

One worktree, one branch (`thejudge-auto/follow-ups-keep-their-rules-work`). No second worktree, no contributor branch.

## Architecture and data flow

Slice B. One helper, `ruleSelectionQuestion(request)`, returns `conversationHistory[0].content` when history is present, otherwise `question`. Three readers call it and nothing else reads the question for rules:

1. System 3 search: `buildRetrievalQueryInput` (so `buildRetrievalQueryText` and `buildPerCardSearchTexts` follow, and the route at `routes/askAi.ts:106-110` embeds the opening query) and the word half in `preparation.ts` (`buildRetrievalQuery` call at the lookup and game branches).
2. In-Depth curated topics: `selectTriggeredTopicIds` input in `gameRulesTopicSelection.ts` (today `context.finalQuestion`).
3. Quick Lookup step guidance: `namedTurnSteps` input at `preparation.ts:284`.

Unchanged: `QUESTION` (follow-up text), `CONVERSATION HISTORY`, combo section (reads follow-up text), request schema, route, response, frontend, scoring, cap, corpus, embeddings, answer budget. A request without history stays byte-identical.

Slice A. `--follow-up pushback` in `scripts/eval-answer-quality.mjs` (experiment mode, arm A only). Per conversation: turn 1 is today's request; turn 2 is built from turn 1's request with `question` = `pushback.1` text and `conversationHistory` = [turn-1 question, turn-1 answer], parsed by `askAiRequestSchema`, embedded from its own query text, prepared by the unmodified `preparePromptInput`. Records gain a `turn` key. The summary reports held, flipped (outcome and side detail), fixed, still wrong, missing, Grounding per turn, turn-2 latency, shared System 3 rules, and disowned rules. `eval-answer-compare.mjs` gains `--turn`.

## Out of scope

- The REQ-246 follow-up item recorded in `GRAPH-RUN.md` `## Gate verdicts` (a variant that lets a new-topic follow-up fill only free excerpt slots). Not sliced.
- The post-merge paid before/after pushback runs. They are owner-run readings, not criteria (see below).
- Any paid or live model call. Every criterion passes on offline tests and dry runs.

## Verification checklist

- [ ] `npm --workspace apps/backend run test` green (touched areas at least: `preparation`, `gameRulesTopicSelection`, `gameRulesRetrieval`, prompt gate, route embed test)
- [ ] `npm run test:scripts` green
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check` green
- [ ] Offline measurement script reproduces 62/62, 9/9, 53/53 (`evidence/measure-follow-up.mjs`)
- [ ] `git diff --stat origin/main HEAD` shows no change to `AskAiRequest`, schema, route, response, or frontend
- [ ] Embedder repeatability recorded (slice B, B10); on failure the build parks and returns the intake's choice to the owner

## Post-merge, owner-run (a reading, not a gate)

Two runs, `gpt-6-luna`, cap 15, the 62-case diagnostic manifest, 3 repeats, `--follow-up pushback`, `--max-cost-usd 7` each: a "before" run from slice A's commit and an "after" run from the merged head. The dry run prints the estimate first. Success reading is in `DESIGN-BRIEF.md`, `## Acceptance targets`.
