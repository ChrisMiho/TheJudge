# Slice B — Backend module split

## Status: planned

## Goal

Split `apps/backend/src/prompt/normalization.ts` (470 lines, three mixed concerns) into three
focused files — `normalization.ts` (normalization only), `promptFormatting.ts` (display
formatting), and `promptDiagnostics.ts` (diagnostics) — updating all import sites.

## Requirements

1. Create `apps/backend/src/prompt/promptFormatting.ts` containing:
   - `ZONE_SECTION_LABEL`, `ZONE_ITEM_LABEL` (currently private to normalization.ts)
   - `buildPlayerDisplayNameLookup`, `formatPlayerRef`, `toPlayerLabelIndex` (lines 112–143)
   - `formatTargets`, `formatGameContext`, `formatStackSection`, `formatNonStackZoneSections`
     (lines 145–254)
   - `formatList` helper (line 108–110)
   All are currently private; export what `normalization.ts`'s `buildPromptText` calls.

2. Create `apps/backend/src/prompt/promptDiagnostics.ts` containing:
   - `estimatePromptChars` (line 308)
   - `PromptDiagnostics` type (lines 312–327)
   - `GetPromptDiagnosticsOptions` type (lines 329–337)
   - `getPromptDiagnostics` function (lines 338–391)

3. Trim `apps/backend/src/prompt/normalization.ts` to keep only:
   - All `MAX_*` constants and `SYSTEM_ROLE_PREAMBLE_LINES`
   - `normalizeWhitespace`, `truncateOracleText`, `truncatePromptLabel`, `normalizeQuestion`,
     `normalizeCardText`, `truncateConversationHistory`, `formatConversationHistorySection`
   - `formatOfficialRulingsSection`, `formatSupplementalRulesSection`, `buildZoneScopeSentence`
   - `buildPromptText` (imports display helpers from `./promptFormatting.js`)
   Add imports from `./promptFormatting.js` and remove the deleted sections.

4. Update external callers — files that import `getPromptDiagnostics` or `PromptDiagnostics`
   from `normalization.ts` must update to import from `./promptDiagnostics.js` (or
   `../prompt/promptDiagnostics.js` from the backend root level):
   - `apps/backend/src/prompt/normalization.test.ts` — `getPromptDiagnostics`
   - `apps/backend/src/mockAskAi.test.ts` — `getPromptDiagnostics`
   - `apps/backend/src/types/index.ts` — `type PromptDiagnostics`
   - `apps/backend/src/prompt/preparation.ts` — `getPromptDiagnostics`, `type PromptDiagnostics`

5. Zero behavior changes — all functions operate identically; only file boundaries change.

## Acceptance criteria

- [ ] `apps/backend/src/prompt/promptFormatting.ts` and `promptDiagnostics.ts` exist
- [ ] `normalization.ts` no longer contains the formatting block (lines 112–254) or the
      diagnostics block (lines 308–391)
- [ ] `normalization.test.ts` imports compile cleanly; `getPromptDiagnostics` is imported
      from `./promptDiagnostics.js`
- [ ] `types/index.ts` imports `PromptDiagnostics` from `../prompt/promptDiagnostics.js`
- [ ] `npm run typecheck` exits 0
- [ ] `npm run test` exits 0 (all existing normalization tests still pass)

## Verification

```bash
grep -n "getPromptDiagnostics\|PromptDiagnostics" apps/backend/src/prompt/normalization.ts
# Should return 0 lines (both have moved to promptDiagnostics.ts)

grep -rn "from.*normalization" apps/backend/src/ | grep -v "normalization\.ts\|normalization\.test"
# Spot-check: remaining callers of normalization.ts should be for non-split symbols only

npm run typecheck
npm run test
```

## Files touched

- NEW `apps/backend/src/prompt/promptFormatting.ts`
- NEW `apps/backend/src/prompt/promptDiagnostics.ts`
- MOD `apps/backend/src/prompt/normalization.ts`
- MOD `apps/backend/src/prompt/normalization.test.ts`
- MOD `apps/backend/src/mockAskAi.test.ts`
- MOD `apps/backend/src/types/index.ts`
- MOD `apps/backend/src/prompt/preparation.ts`
