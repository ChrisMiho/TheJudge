# Slice A — Exact exclusion in code, evidence trace, tests, data test

## Status: done

Build note: the backend suite and `npm run quality:check` (through `coverage:check`) run the context-evaluation golden test, which fails the moment the scorer changes. To keep this commit green, the three prompt goldens were regenerated here with `UPDATE_CONTEXT_EVAL_FIXTURES=1`. Slice B reads that diff against the base (`git diff origin/main -- apps/backend/src/eval/fixtures`) and does the rest of its measuring.

## Goal

System 3 drops a candidate rule only when its own id is a rule number a selected curated topic lists, on both scoring paths and both modes, with the evidence trace mirroring it and a data test guarding the condition that makes it safe.

## Requirements

1. `apps/backend/src/gameRulesRetrieval.ts`: in `scoreIndex`, both exclusion branches (hybrid at about line 705, lexical at about line 740) become `if (excludeRuleIds.has(entry.ruleId))`; drop the `entry.parentRuleIds.some(...)` clause. Rewrite both REQ-179 comments to say exact-id exclusion and why it is safe (a topic prints exactly the rules it lists, held by the data test). `excludedCuratedRuleCount` keeps counting. Leave the `parentRuleIds` ranking boost (lines about 486 and 579) untouched.
2. `apps/backend/src/gameRulesRetrieval.test.ts`: replace the test at line 230 ("excludes by rule-number prefix") with exact-exclusion tests on both paths: a listed parent id excludes only itself, an unlisted sub-rule of a listed parent is rankable and selected, a listed sub-rule id is still excluded. Cover the hybrid path (frozen or stub embeddings, as the neighbouring hybrid tests do) and the lexical path.
3. `scripts/lib/evidence-trace.mjs`: `skippedForCuratedTopic` returns `curatedRuleIds.has(ruleId)` only. Drop the now-unused `ruleEntryById` parameter and update both callers (about lines 63 and 100) if lint flags it, otherwise keep the signature. Update its doc comment.
4. `scripts/lib/evidence-trace.test.mjs`: flip the 514.3a assertions (about lines 103-109: `skippedForCuratedTopic` is now false for 514.3a, still true for parent 514.3) and the test at line 143 (a curated rule is skipped, its lettered sub-rule is not, 514.1 is not). Update the RANKING comment at line 35. 514.3a stays unselected at cap 2 in the fake pipeline, so its `availableToAnswer` stays false.
5. New `apps/backend/src/gameRulesTopicData.test.ts`: over the committed `../data/gameRulesByTopic.json` and `../data/gameRulesRuleIndex.json`, every topic's excerpt includes (plain substring, `excerpt.includes(rule.text)`) the full index text of each rule in its `ruleNumbers`, and includes the full text of no rule not in its `ruleNumbers`. Both directions are asserted per topic, and every listed number must exist in the index. Verified now: 0 missing, 0 extra across all 24 topics. Put the check in a small pure helper inside the test file and prove it fails on a synthetic topic that carries an unlisted rule and on one that omits a listed rule.
6. `apps/backend/src/eval/fixtures/upkeep-trigger.fixture.json`: rewrite the description sentence that says 603.3b is dropped by REQ-179's prefix exclusion. Then check that fixture's expected supplemental set; the golden changes in slice B, but a hand-dropped 603.3b in an expected list must be reconciled here or in B.
7. Do not touch `PRD/sections/` here (slice C), the goldens or the baseline (slice B), any topic's contents, or the ranking boosts.

## Acceptance criteria

- [ ] Neither exclusion branch in `scoreIndex` consults `parentRuleIds`; each drops a candidate only when `excludeRuleIds.has(entry.ruleId)`, and the REQ-179 comments describe exact-id exclusion
- [ ] The retrieval tests prove, on the hybrid path and on the lexical path, that an unlisted sub-rule of a listed parent is ranked and selected and that a listed id is still excluded; the suite passes
- [ ] `skippedForCuratedTopic` in the evidence trace returns true only for a rule number a curated topic lists, and its tests assert 514.3a is no longer skipped while 514.3 still is; `npm run test:scripts` passes
- [ ] `apps/backend/src/gameRulesTopicData.test.ts` asserts, with plain substring matching, that each of the 24 topics' excerpts carries the full text of every rule it lists and of no other rule, and it passes on the committed data
- [ ] The data test's helper fails on a synthetic topic that carries an unlisted rule's text and on one that omits a listed rule's text (a test of the test)
- [ ] The `upkeep-trigger.fixture.json` description no longer says rule 603.3b is dropped by prefix exclusion
- [ ] `npm run typecheck` and `npm run lint` pass

## Tests

Backend vitest for retrieval and the data test; `node --test` script suite for the evidence trace. Run the retrieval test first against the old code to see the new assertions fail, then fix.

## Verification

```bash
npm --workspace apps/backend run test -- src/gameRulesRetrieval.test.ts src/gameRulesTopicData.test.ts
npm run test:scripts
npm run typecheck
npm run lint
grep -n "parentRuleIds" apps/backend/src/gameRulesRetrieval.ts scripts/lib/evidence-trace.mjs
```

## Files touched

- `apps/backend/src/gameRulesRetrieval.ts`
- `apps/backend/src/gameRulesRetrieval.test.ts`
- `scripts/lib/evidence-trace.mjs`
- `scripts/lib/evidence-trace.test.mjs`
- `apps/backend/src/gameRulesTopicData.test.ts`
- `apps/backend/src/eval/fixtures/upkeep-trigger.fixture.json`
