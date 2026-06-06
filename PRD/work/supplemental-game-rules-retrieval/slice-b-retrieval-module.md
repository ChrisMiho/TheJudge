# Slice B — Retrieval module

## Status

`pending`

## Goal

Add runtime search/scoring to find up to 5 supplemental CR rules per request, deduped against the curated baseline manifest.

## Depends on

Slice A (`gameRulesRuleIndex.json` committed and loadable).

## Acceptance criteria

- [ ] `loadGameRulesRuleIndex(path)` loads and validates index; returns `[]` with warn-once when missing
- [ ] `buildQueryText(context)` aggregates question, turn phase, selected zones, stack cards, zone items
- [ ] `retrieveSupplementalRules(context, index, excludeRuleIds, max = 5)` returns scored matches
- [ ] Scoring: exact rule ID boost, parent rule boost, keyword token overlap (port PR #30)
- [ ] Rules in `excludeRuleIds` (from manifest `ruleNumbers`) never returned
- [ ] Returns empty array when index empty or no positive scores
- [ ] Unit tests cover: exact rule mention, keyword match, dedupe exclusion, max-5 cap, empty index

## Files to create

- `apps/backend/src/gameRulesRetrieval.ts`
- `apps/backend/src/gameRulesRetrieval.test.ts`

## Files to update

- None (startup wiring in Slice C)

## Implementation notes

- Export `collectCuratedRuleIds(topics: GameRulesTopic[]): Set<string>` — flatten manifest rule numbers from loaded topics
- Share stop-word list and tokenization with PR #30 spike
- Cache loaded index in module (mirror `gameRules.ts` / PR #30 `loadRulesMetadata` pattern)
- Do not import from PR #30 branch directly — port logic cleanly

## Verification

```bash
npm --workspace apps/backend run test -- gameRulesRetrieval
npm run typecheck
```

## Reference

- PR #30: `apps/backend/src/rules/rulesRetrieval.ts`
- PR #30: `apps/backend/src/rules/rulesRetrieval.test.ts`
