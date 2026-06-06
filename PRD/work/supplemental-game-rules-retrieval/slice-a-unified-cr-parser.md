# Slice A — Unified CR parser + dual outputs

## Status

`pending`

## Goal

Extend `scripts/build-game-rules.mjs` so a **single parse** of `apps/backend/data/cr/source.txt` produces both existing curated topics and the new searchable rule index.

## Depends on

None.

## Acceptance criteria

- [ ] Shared CR parser extracts all individual rules from WotC CR TXT (rule ID, section title, verbatim text, parent rule IDs)
- [ ] Parser builds precomputed `searchText` per rule (lowercase `ruleId + sectionTitle + text`)
- [ ] `gameRulesByTopic.json` still produced from manifest + shared parse (behavior unchanged for existing 23 topics)
- [ ] `gameRulesRuleIndex.json` produced as JSON array of rule entries (~3000 rules)
- [ ] Missing `cr/source.txt` → both prior artifacts preserved; build exits 0 with warnings
- [ ] `npm run data:build` chain unchanged except build script now writes both outputs
- [ ] Build policy test covers dual-output behavior (extend `gameRulesBuildPolicy.test.ts` or equivalent)

## Files to create

- `apps/backend/data/gameRulesRuleIndex.json` (initial committed artifact from build)

## Files to update

- `scripts/build-game-rules.mjs` — refactor to shared parse; dual write
- `apps/frontend/src/lib/gameRulesBuildPolicy.test.ts` — index artifact expectations

## Implementation notes

- Port rule-line parsing from PR #30 `build-rules-metadata.mjs` into shared parser; reconcile with existing `extractRuleExcerpt()` regex behavior so topic excerpts remain verbatim-identical
- Glossary cutoff: stop parsing at `Glossary` section (PR #30 pattern)
- Do **not** create a separate build script or alternate CR source path
- Index size ~2 MB is acceptable; document in build log output bytes

## Verification

```bash
npm run data:build
# expect both artifacts present; log rule count + output bytes
npm run quality:check
```

## Reference

- Existing: `scripts/build-game-rules.mjs`
- Inspiration: PR #30 `scripts/build-rules-metadata.mjs`
