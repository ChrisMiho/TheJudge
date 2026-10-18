# Slice G — Rule search scoring, guarded by an order snapshot

## Status: done

Depends on: E and F (G drops one export from `matcher.ts` after E, and exports from `promptFormatting.ts` after F). Findings: K-05, K-06 (retrieval part), K-12 (non-owned files), K-14, K-15 (search part).

## Goal

Rule search scoring loses its duplicate formula and repeated work. The same rules come back in the same order with the same scores. A new order snapshot guards every step.

## Requirements

1. **The guard first, in its own commit, before any scoring edit.** Add a characterization test `Backend - Rule search order`. For every rules-gate case it runs `retrieveRulesForQueryWithDebug` on the committed frozen vectors (semantic path) and again with no query vector (lexical path). Per case it records the ordered selected and runner-up rule ids, `usedSemantic`, and a SHA-256 of the full scored output (ids and exact scores), and asserts equality with a committed snapshot file. Generate the snapshot on the unmodified code. Re-run it after every later step in this slice.
2. **K-05.** `scoreEntry` repeats `computeIdBoost` and the word-overlap loop line for line (`gameRulesRetrieval.ts` about `:824-839` and `:910-945`). One `accumulateWordOverlap(entry, tokens, N, df, start)`: the lexical scorer passes `start = 0`, `scoreEntry` passes `start = computeIdBoost(...)`. Build the boost `0 -> +100 -> +20` in the same order `scoreEntry` adds it today so every floating-point addition happens in the same order. Update the comment at about `:901-909`. REQ-182's byte-identical-under-mock gate must hold.
3. **K-06 (retrieval part).** Carry the boost `scoreIndex` already computes (about `:1083`) on the scored entry instead of recomputing it twice per candidate in `selectSupplemental` (about `:1302-1309`). Cache each rule vector's squared length in a `WeakMap` keyed by the embeddings object, accumulated in the same index order as `cosineSimilarity` (about `:948-959`) so `Math.sqrt` sees the same bits. Cache cited-rule ids per entry and compiled obsolete-glossary patterns per glossary array. **Not done:** carrying the raw blend instead of `score - boost`, and the concept-terms repeat.
4. **K-14.** `turnStepSearchName` (about `:673-708`) repeats the step-name tables in `prompt/phaseGuidance.ts` except three explicit overrides. Derive it from those tables plus the overrides. Add an exhaustive test over every phase x combat-step pair asserting the same strings as before. Check `phaseGuidance.ts`'s imports first: no new runtime import cycle.
5. **K-15 (search part).** One `escapeRegExp` and one `foldApostrophes` (folds exactly U+2018 and U+2019 to `'`) for `gameRulesRetrieval.ts` (about `:710, 725`), `commanderSpellbook/intent.ts` (about `:21`), `eval/rules-gate/stateFacts.ts` (about `:33`), `gameRulesStemmer.ts` (about `:97`), `gameRulesConceptMap.ts` (about `:140`) and `prompt/phaseGuidance.ts` (about `:164`). Put them in an existing shared backend module if one fits; otherwise one small new module.
6. **K-12 (non-owned files).** Drop `export` from the in-file-only exports in `gameRulesTopicSelection.ts`, `gameRulesStemmer.ts`, `commanderSpellbook/matcher.ts`, `commanderSpellbook/intent.ts`, `commanderSpellbook/formatting.ts`, `prompt/promptFormatting.ts`, `prompt/phaseGuidance.ts` and `prompt/promptDiagnostics.ts`. Do this after K-14. Verify each by grep that nothing else imports it, including tests.
7. **Confinement.** In `gameRulesRetrieval.ts` edit only below the loader block (`:32-372` belongs to backend-health) and leave every public entry point's signature and default parameters alone. Do not edit `catalog.ts`, `embeddingModel.ts`, `ruleLayout.ts`, `validation/askAiRequest.ts`.
8. If the snapshot moves at any step, revert that step and record it.

## Acceptance criteria

- [ ] G1. The `Backend - Rule search order` snapshot test exists, covers every rules-gate case on both paths, and its commit precedes every scoring edit (`git log --oneline` order shown in the evidence log).
- [ ] G2. `accumulateWordOverlap` is the only word-overlap loop in `gameRulesRetrieval.ts`; the boost is added `0 -> +100 -> +20` in `scoreEntry`'s order.
- [ ] G3. `selectSupplemental` no longer recomputes the boost; vector squared lengths, cited-rule ids and obsolete-glossary patterns are cached.
- [ ] G4. `turnStepSearchName` derives from the `phaseGuidance.ts` tables plus three overrides, with an exhaustive phase x combat-step test, and no new import cycle.
- [ ] G5. One `escapeRegExp` and one `foldApostrophes` serve all six listed sites.
- [ ] G6. The in-file-only exports in the eight listed files are no longer exported, and nothing broke.
- [ ] G7. The order snapshot test passes unchanged after the final step.
- [ ] G8. `gameRulesRetrieval.test.ts`, `gameRulesSearchFixes.test.ts`, `rules-gate/rulesGate.test.ts`, `retrievalReportParity.test.ts` and the stemmer, concept-map, phase-guidance and intent tests pass.
- [ ] G9. Eval goldens are byte-identical: `git diff --stat origin/main -- apps/backend/src/eval/fixtures` prints nothing.
- [ ] G10. `npm --workspace apps/backend run test` is green and `npm --workspace apps/backend run typecheck` exits 0.
- [ ] G11. `git diff origin/main -- apps/backend/src/gameRulesRetrieval.ts` shows no hunk in lines 32-372 of the base file and no changed public signature.

## Verification

```bash
npm --workspace apps/backend run test -- ruleSearchOrder
npm --workspace apps/backend run test
npm --workspace apps/backend run typecheck
git diff --stat origin/main -- apps/backend/src/eval/fixtures
git diff origin/main -- apps/backend/src/gameRulesRetrieval.ts
```

## Reverted findings

None. Evidence: `slice-g.evidence.md`.

## Files touched

- new order snapshot test and committed snapshot file under `apps/backend/src/`
- `apps/backend/src/gameRulesRetrieval.ts` (below the loader block only)
- `gameRulesTopicSelection.ts`, `gameRulesStemmer.ts`, `gameRulesConceptMap.ts`, `commanderSpellbook/matcher.ts`, `commanderSpellbook/intent.ts`, `commanderSpellbook/formatting.ts`
- `prompt/promptFormatting.ts`, `prompt/phaseGuidance.ts`, `prompt/promptDiagnostics.ts`, `eval/rules-gate/stateFacts.ts`
- one shared helper module for `escapeRegExp` and `foldApostrophes`
