# Slice F evidence

## Baseline (tip after slice E, 2026-10-18)

- Backend: 56 files, 896 tests pass. `git diff --stat origin/main -- apps/backend/src/eval/fixtures` prints nothing. `contextEvaluationHarness.test.ts`: 3 tests pass.

## Changes (line numbers re-read from the code; the brief's were close)

- K-02 / K-06 (combo part): in `prompt/preparation.ts` the four near-copy branches are now one body per request kind (`prepareLookupPromptInput`, `prepareGamePromptInput`), switching on `options.collectEnrichmentDebug` through three small helpers. `resolveRulings` calls `resolveRulingsForPrompt(..., true)` with debug and without it otherwise. `retrieveSupplementalRules` calls `retrieveRulesForQueryWithDebug` (with the query text) on the debug path and `retrieveRulesForQuery` otherwise, with the same arguments in the same order as before. `buildEnrichmentDebug` builds the sidecar with its keys in the old order (`supplemental`, `curatedGameRules`, `rulings`, `ruleLayout`) and the result carries `enrichmentDebug` only when debug was collected. `formatComboSection` runs once per request; the text is passed to the prompt builders through a new `comboSection` option (the builders still format `comboCandidates` themselves for callers that pass only candidates, such as the eval harness).
- K-07: `prompt/enrichmentDebug.ts` has no `zod`; `EnrichmentDebug` is a plain type built from `SupplementalRulesDebug`, `RulingsDebug` and `RuleLayoutStats`. Grep confirmed `enrichmentDebugSchema` was never imported or parsed anywhere. The type now carries `usedSemantic`, `perCardSelected` and `keywordSetSelected`, so one test fixture in `mockAskAi.test.ts` gained those three fields (a literal of the type; no assertion changed).
- K-09: the two `request as GameAskAiRequest` casts are gone (TypeScript narrows without them); `buildPlayerDisplayNameLookup` uses `Object.fromEntries`; `config/index.ts` has an `isMode` guard in place of the two `as` casts. `routes/askAi.ts` untouched.
- K-10: `formatZoneCardMetadataLines` is the one builder; it emits lines in final order (caster, targets, manaSpent, copies, contextNotes, oracleText) from options, so the prefix-search splice code (`lineIndex`) is gone. Lookup passes `includeTargetsAndNotes: false` instead of formatting `targets:` and `contextNotes:` and filtering them out.
- K-11 (non-owned parts): `getPromptDiagnostics` takes only the options object (no caller ever passed bare rulings; checked by grep); `buildZoneScopeSentence` lost its unused first parameter (its five test calls updated); `formatSupplementalRulesSection` moved to `src/test-utils/supplementalRulesSection.ts` for its one test file.
- K-13: `prompt/context.ts` has `sharedCardFields`, spread first in both `normalizeZoneItem` and the stack item, so the key order is `cardId, name, oracleText, imageUrl, manaCost, manaValue, typeLine, colors, supertypes, subtypes, keywords, ...displayFields`, then each kind's own fields. The stack keeps `normalizeWhitespace(card.name)` without the empty-name check. Inline `import("../types/index.js")` types replaced by the import list.
- K-15 (prompt part): `truncatePromptLabel` inlined to `truncateOracleText`; `MAX_CONVERSATION_TURN_CHARS` named in `normalization.ts`.
- K-18 (non-owned parts): the stale `promptContext.ts` pointer in `types/index.ts` now names `normalizeContextTarget in prompt/context.ts`; `errors.ts` names the message once (`DEFAULT_ERROR_MESSAGE`) and callers in `errors.ts` and `openAiResponsesProvider.ts` leave it out (they pass `undefined` for the message and keep their details).

## After

- Backend: 56 files, 896 tests pass (same as the baseline). `contextEvaluationHarness.test.ts`: 3 tests pass. Every golden is byte-identical: `git diff --stat origin/main -- apps/backend/src/eval/fixtures apps/backend/src/routes/askAi.ts` prints nothing.
- `npm --workspace apps/backend run typecheck` exits 0; `npm run lint` (`--max-warnings 0`) exits 0.

## Reverted findings

None.
