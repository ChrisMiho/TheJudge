# Slice B — Map change

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries

## Status: planned

## Goal

Land the six entries (and whichever of the `attached` tweak and type-setting narrowing slice A kept) in the concept map, with tests, header, re-recorded goldens and REQ-234 applied.

## Requirements

1. Entries 79-84 in `apps/backend/src/gameRulesConceptMap.ts`, patterns and terms exactly as in `DESIGN-BRIEF.md` Scope 1 (triggered abilities -> `handling triggered abilities`; alternative cost -> `alternative cost casting`; layer wording -> `interaction of continuous effects`; -N/-N -> `toughness state-based action`; sacrifice as a cost -> `activated ability cost`; casting choices -> `casting spells`). Copy patterns from the brief (bare `|` in source).
2. Apply `attached` (entry 81) and the type-setting narrowing (78th entry) only if slice A recorded "keep". Never drop or narrow an entry on your own; if slice A parked, this slice does not start.
3. Tests in `apps/backend/src/gameRulesConceptMap.test.ts`: at least 6 match and 6 non-match tests per new entry (the type-setting entry's shape); narrowed type-setting cases added to its non-match list if kept; pins updated: 78 -> 84 entries, 163 -> 165 words over 83 -> 89 entries; Ephemeral Hydra upkeep example also gets `handling triggered abilities`.
4. File header (m-2): stop saying every entry was ported verbatim; 77 ported, the 78th and 79th-84th owner-reviewed additions.
5. Re-record changed example prompts: `UPDATE_CONTEXT_EVAL_FIXTURES=1` per `apps/backend/src/eval/fixtures/` README; review each diff; only expected concept-term and topic changes.
6. Rules gate: the gate runs in `npm test` against committed vectors. If the map change alone fails it on the current model, STOP splitting: land B and C as one slice (do the retrain in this slice's commit set, one re-baseline after the retrain) and record that in the slice status.
7. Measure and record (counts only): how many In-Depth corpus cases gain a curated topic, and the curated-topic rule characters per In-Depth corpus case, before -> after (recorded only, no bar; owner's REQ-234 edit). `inDepthTopicGuard.test.ts` stays at or above REQ-242's 17 of 30. Quick Lookup (REQ-238) unchanged.
8. Apply REQ-234 by intent from the finalized `GATE-QUESTIONS.md` (with the owner's edit) into `PRD/sections/functional-requirements.md`: 84 entries, six entries, narrowing, term rule, tests rule, intake and build notes including the In-Depth topic effect and the measured numbers from slice A and this slice. Do not touch REQ-236 here, do not touch other IDs.
9. Before commit: confirm the harness patch is gone (`git diff --stat`), `node scripts/privacy-scan.mjs`, `npm run quality:check`, `npm test`. Git: explicit `git add` paths only.

## Acceptance criteria

- [ ] `gameRulesConceptMap.ts` has 84 oracle-text entries whose patterns and terms match the brief's table, with no harness code or `CONCEPT_CANDIDATES` reference
- [ ] `attached` tweak and type-setting narrowing are applied exactly when slice A recorded keep, and not otherwise
- [ ] `gameRulesConceptMap.test.ts` has at least 6 match and 6 non-match tests for each of the six entries and passes with pins 84 entries and 165 words over 89 entries
- [ ] The Ephemeral Hydra upkeep example expects `handling triggered abilities`
- [ ] The file header says 77 ported, the 78th and 79th-84th owner-reviewed additions
- [ ] Changed eval goldens are re-recorded under `apps/backend/src/eval/fixtures/` and each diff reviewed as an expected concept-term or topic change
- [ ] In-Depth topic additions on the corpus and curated-topic rule characters per In-Depth corpus case, before -> after, are recorded in the REQ-234 build note (counts only, no bar)
- [ ] `inDepthTopicGuard.test.ts` passes at or above 17 of 30
- [ ] REQ-234 in `PRD/sections/functional-requirements.md` matches the finalized `GATE-QUESTIONS.md` block including the owner's edit; no other REQ changed
- [ ] `npm run quality:check` and `npm test` are green (or, if the rules gate fails on the current model, the slice is merged with C per requirement 6)
- [ ] `git diff --stat` before commit shows no harness change; `node scripts/privacy-scan.mjs` passes; nothing kept lives under `PRD/work/`

## Verification

```bash
npx vitest run apps/backend/src/gameRulesConceptMap.test.ts
npm run quality:check
npm test
node scripts/privacy-scan.mjs
git diff --stat
```

## Files touched

- `apps/backend/src/gameRulesConceptMap.ts`
- `apps/backend/src/gameRulesConceptMap.test.ts`
- `apps/backend/src/eval/fixtures/*.golden.*`
- `PRD/sections/functional-requirements.md` (REQ-234 only)
- `PRD/work/concept-map-wording-entries/slice-b-map-change.md`, `slice-b.criteria.json` (status only)
