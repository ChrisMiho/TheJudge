# Slice A — CR download and build pipeline

## Status: planned

## Goal

Extend the data refresh/build chain with WotC Comprehensive Rules download and a `build-game-rules.mjs` transform that extracts verbatim excerpts from a topic manifest — with graceful degradation matching the card-rulings pipeline.

## Requirements

1. [REQ-022](../../sections/functional-requirements.md) — `npm run data:build` runs `build-game-rules.mjs`; missing CR source exits 0 and preserves committed artifact.
2. [REQ-022](../../sections/functional-requirements.md) — `npm run data:refresh` attempts WotC CR download alongside Scryfall with graceful skip when unavailable.
3. [DEC-030](../../sections/decisions.md) — gitignored source at `apps/backend/data/cr/source.txt`; committed manifest at `apps/backend/data/gameRulesTopicManifest.json`.
4. Mirror `build-card-rulings.mjs` patterns: export pure transform functions for unit tests; never fail the script when inputs are missing (preserve prior artifact).
5. Agent-run network refresh still requires explicit human approval (existing PRD policy — do not auto-run `data:refresh` in CI).

## Acceptance criteria

- [ ] `.gitignore` includes `apps/backend/data/cr/source.txt` (and temp download path if used).
- [ ] `scripts/refresh-scryfall-data.mjs` downloads WotC CR TXT to `apps/backend/data/cr/source.txt` after Scryfall bulk downloads; Scryfall or CR failure logs warning and continues; refresh still runs `npm run data:build` when at least one download succeeds.
- [ ] `scripts/build-game-rules.mjs` exists; reads manifest + CR source; writes `apps/backend/data/gameRulesByTopic.json`.
- [ ] Build with missing `cr/source.txt` logs warning, preserves existing `gameRulesByTopic.json` if present, exits 0.
- [ ] Build with missing per-topic rule in source logs warning, preserves prior excerpt for that topic from committed artifact, exits 0.
- [ ] `package.json` `data:build` chain: `build-card-metadata.mjs && build-card-rulings.mjs && build-game-rules.mjs`.
- [ ] Initial scaffold manifest committed with schema-valid structure (1–2 placeholder topics acceptable; Slice B replaces with curated library).
- [ ] Unit tests cover rule extraction, manifest normalization, and graceful-degradation paths using inline CR fixture text (no network, no committed CR source).

## Verification

```bash
# Build chain includes game rules (missing CR source → graceful exit 0)
npm run data:build

# Unit tests for build script + refresh policy
npm --workspace apps/frontend run test -- src/lib/gameRulesBuildPolicy.test.ts
npm --workspace apps/frontend run test -- src/lib/scryfallRefreshPolicy.test.ts
```

Manual: with human-approved `npm run data:refresh`, confirm `apps/backend/data/cr/source.txt` appears locally and is gitignored (`git status` must not list it).

## Files touched

- `.gitignore`
- `package.json`
- `scripts/refresh-scryfall-data.mjs`
- `scripts/build-game-rules.mjs` (new)
- `apps/backend/data/gameRulesTopicManifest.json` (new — scaffold)
- `apps/frontend/src/lib/gameRulesBuildPolicy.test.ts` (new)
- `apps/frontend/src/lib/scryfallRefreshPolicy.test.ts` (extend CR download target tests)

## Tests

- Export and test `extractRuleExcerpt(crText, ruleNumber)` (or equivalent) against fixture CR snippets.
- Export and test manifest → artifact transform with partial failures.
- Extend Scryfall refresh policy test to assert CR download target path and graceful-skip behavior.

## Notes

- WotC CR page: [magic.wizards.com/en/rules](https://magic.wizards.com/en/rules) — download the TXT/PDF link programmatically; store plain text at `cr/source.txt`.
- Do **not** commit `cr/source.txt` or full CR text.
- Slice B owns final topic list and committed artifact content; A only proves the pipeline.
