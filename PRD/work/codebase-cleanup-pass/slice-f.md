# Slice F — The prompt pipeline is written once

## Status: done

Depends on: none (must land before G; both edit `prompt/promptFormatting.ts`). Findings: K-02, K-06 (combo part), K-07, K-09, K-10, K-11 (non-owned parts), K-13, K-15 (prompt part), K-18 (non-owned parts).

## Goal

The prompt code is written once instead of four times, and card blocks are built in their final order. The prompt the AI receives does not change by one byte.

## Requirements

Run the context evaluation harness after every item; any golden diff stops that item and it is reverted (recorded in the evidence log). Record the base first: backend test count and a clean `git diff` on the eval fixtures.

1. **K-02.** `apps/backend/src/prompt/preparation.ts` has four near-copy branches: lookup and game, each with a debug and a non-debug copy (about `:296-367` and `:408-470`). Write one internal assemble helper per request kind with a debug flag. It calls exactly the same functions with exactly the same arguments as today for each (kind, debug) pair: `retrieveRulesForQueryWithDebug` on the debug path, `retrieveRulesForQuery` otherwise. Do not substitute one entry point for the other.
2. **K-06 (combo part).** `formatComboSection` runs twice per request (for its length at about `preparation.ts:296, 408`, and again inside the prompt builder). Build it once and pass the text into the builder.
3. **K-07.** `prompt/enrichmentDebug.ts` builds a Zod schema only to derive the `EnrichmentDebug` type (never `.parse()`d; confirm with grep). Replace it with a plain type built from `SupplementalRulesDebug` and the other debug types. The file keeps its name and path. The mock-only debug sidecar's bytes do not change.
4. **K-09.** Drop the two no-op casts `request as GameAskAiRequest` (about `preparation.ts:109, 124`). Replace the spread-in-`reduce` lookup (`promptFormatting.ts` about `:98-104`) with `Object.fromEntries` (same keys, same insertion order). Add an `isMode` guard in `config/index.ts`. Leave the cast in `routes/askAi.ts` (backend-health owns it).
5. **K-10.** Card metadata lines are built then patched by prefix search (`promptFormatting.ts` about `:288-304`, stale index comment). Replace with one builder that emits lines in final order, with options for caster, mana spent, copies, targets and notes. Lookup stops formatting a `targets:` line only to filter it out (`promptAssembly.ts` about `:133-139`).
6. **K-11 (non-owned parts).** Remove `getPromptDiagnostics`' dead bare-rulings overload (`promptDiagnostics.ts` about `:40-58`) and `buildZoneScopeSentence`'s unused first parameter (`promptFormatting.ts` about `:359`). Move the test-only `formatSupplementalRulesSection` into a test helper.
7. **K-13.** Stack and zone cards are normalized by two copies of the same fields (`prompt/context.ts` about `:178-205` and `:294-320`). One helper for the shared detail fields, spread so the JSON key order of `context` stays exactly `cardId, name, oracleText, imageUrl, manaCost, manaValue, typeLine, colors, supertypes, subtypes, keywords, ...displayFields`, then each kind's own fields. The stack's own name handling stays. Use the import list instead of inline `import("../types/index.js")` types.
8. **K-15 (prompt part).** Inline `truncatePromptLabel` and name the `EFFECTIVELY_UNLIMITED_CHARS / 10` constant (`promptFormatting.ts` about `:81-87`).
9. **K-18 (non-owned parts).** Fix the stale `promptContext.ts` pointer in `types/index.ts` (about `:41`); stop passing the default "Miho is working on it" message explicitly in `errors.ts` and `providers/openAiResponsesProvider.ts`.
10. Do not edit `routes/askAi.ts`, `app/createApp.ts`, `providers/localEmbeddingProvider.ts`, `gameRules.ts` or any other backend-health-owned file.

## Acceptance criteria

- [ ] F1. `preparation.ts` has one assemble helper per request kind with a debug flag, calling the same functions with the same arguments per (kind, debug) pair.
- [ ] F2. `formatComboSection` is called once per request.
- [ ] F3. `enrichmentDebug.ts` imports no `zod` and exports a plain `EnrichmentDebug` type; the file still exists at the same path.
- [ ] F4. The two no-op casts are gone, the lookup uses `Object.fromEntries`, `config/index.ts` has an `isMode` guard, `routes/askAi.ts` is unchanged.
- [ ] F5. One card-metadata builder emits lines in final order; the prefix-patching code and the lookup `targets:` filter are gone.
- [ ] F6. The dead overload, the unused `buildZoneScopeSentence` parameter and the test-only `formatSupplementalRulesSection` export are gone from production code.
- [ ] F7. One shared helper builds the stack/zone detail fields with the exact `context` key order.
- [ ] F8. `truncatePromptLabel` is inlined, the divisor is a named constant, the stale `types/index.ts` pointer is fixed, and the default message is no longer passed explicitly in `errors.ts` and the OpenAI provider.
- [ ] F9. Every eval golden is byte-identical: `git diff --stat origin/main -- apps/backend/src/eval/fixtures` prints nothing, and `contextEvaluationHarness.test.ts` passes.
- [ ] F10. `npm --workspace apps/backend run test` is green with a test count no lower than the base.
- [ ] F11. `npm --workspace apps/backend run typecheck` exits 0.
- [ ] F12. `npm run lint` exits 0.

## Verification

```bash
npm --workspace apps/backend run test -- contextEvaluationHarness
npm --workspace apps/backend run test
npm --workspace apps/backend run typecheck
npm run lint
git diff --stat origin/main -- apps/backend/src/eval/fixtures apps/backend/src/routes/askAi.ts
```

## Reverted findings

None. Evidence: `slice-f.evidence.md`.

## Files touched

- `apps/backend/src/prompt/preparation.ts`, `enrichmentDebug.ts`, `promptFormatting.ts`, `promptAssembly.ts`, `promptDiagnostics.ts`, `context.ts`
- `apps/backend/src/config/index.ts`, `apps/backend/src/types/index.ts`, `apps/backend/src/errors.ts`, `apps/backend/src/providers/openAiResponsesProvider.ts`
- a backend test helper for `formatSupplementalRulesSection` and the tests that import it
