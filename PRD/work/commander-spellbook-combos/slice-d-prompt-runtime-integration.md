# Slice D — Prompt and runtime integration

## Status: planned

## Dependencies

- Slice C — consumes the finalized `CommanderSpellbookMatch` annotations and selector behavior; prompt formatting must not re-derive matching or ranking.

## Goal

Load the catalog once at startup, select matches during existing prompt preparation, and render the bounded community-sourced section in both prompt modes while preserving every public contract.

## Requirements

1. Add `promptSection.ts` exporting `formatCommanderSpellbookSection(matches)`. Return `""` for no matches. For non-empty input, render the exact heading `COMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED` and deterministic variant blocks in supplied rank order.
2. Section-level instructions must state:
   - Commander Spellbook is community catalog data, not official WotC rules;
   - inclusion is not legality validation or proof of executability;
   - official card text, WotC rulings, and Comprehensive Rules remain authoritative;
   - partial candidates identify every missing/incorrectly zoned piece;
   - automatically supplied complete matches are used only when relevant to the actual question.
3. Each variant block renders complete/partial classification, stable id/source URL, compatible exact ingredients, compatible template matches, wrong-zone ingredients with submitted/expected zones, missing exact/resolved-template quantities, unresolved templates, produced effects, description/steps, mana needed, easy/notable prerequisites, and notes when present. Render card/template names, not internal oracle ids.
4. Extend `BuildPromptTextOptions` with matches and insert the formatted section:
   - game: after `OFFICIAL RULINGS` (or the last available card/rules enrichment) and before `SCOPE`, conversation history, and `QUESTION`;
   - lookup: after card/rules/rulings enrichment and before conversation history and `QUESTION`.
   Existing section relative order and bottom-to-top stack output stay unchanged.
5. Extend `PreparePromptInputOptions` with `commanderSpellbookCatalog`. In both game and lookup preparation, call `selectCommanderSpellbookMatches` once with the validated request and already-normalized prompt context, then pass the returned matches to prompt assembly. An empty/default catalog yields no section.
6. Extend prompt diagnostics with optional `commanderSpellbookVariantCount` and `commanderSpellbookSectionChars`; include them only when the section is non-empty. Add the same optional values to existing prompt-build lifecycle logs. Do not bypass or change `MAX_PROMPT_CHAR_BUDGET`.
7. Wire startup dependency injection through `createConfiguredApp.ts` → `createApp.ts` → `routes/askAi.ts` → `preparePromptInput`. Load both committed artifact paths once in `createConfiguredApp`, expose startup variant/template counts, and log them from local `index.ts`. Lambda packaging needs no edit because `scripts/package-lambda.sh` already copies `apps/backend/data`.
8. Preserve mock behavior: the existing full-prompt debug answer exposes the exact assembled combo section and optional diagnostics. Do not add a new public success field or modify `enrichmentDebugSchema` solely for combo data.
9. Preserve live behavior: OpenAI continues receiving one plain-text prompt and returning `{ answer }` only. No request schema, Zod, route path, provider selection, error shape, frontend, or second model call changes.
10. Add formatter, assembly, preparation, diagnostics, app-behavior, and contract tests using the in-memory normalization seam from Slice B; no integration test reads the live corpus unless it is explicitly testing startup loading.

## Acceptance criteria

- [ ] `promptSection.test.ts` proves the exact heading, source/authority guardrails, automatic relevance instruction, full complete/partial annotations, optional-field omission, stable order, and `""` for no matches.
- [ ] `promptAssembly.test.ts` proves game and lookup placement after official enrichment and before `SCOPE`/history/question, while existing game-rules/rulings order and stack order remain unchanged.
- [ ] `preparation.test.ts` proves both request modes call the shared selector behavior through an injected catalog and omit the section for empty/no-match catalogs.
- [ ] `promptDiagnostics.test.ts` proves combo count/chars appear only for a non-empty section and remain part of the unchanged global prompt-budget calculation.
- [ ] `app.behavior.test.ts` proves an injected catalog reaches `POST /api/ask-ai` through the existing dependency chain and the mock answer contains the exact combo section.
- [ ] `app.contract.test.ts` proves live provider success still has exactly `Object.keys(body) === ["answer"]`, lookup/game request validation is unchanged, errors are unchanged, and no new route exists.
- [ ] `createConfiguredApp` tests or a startup-focused unit test prove missing/corrupt artifacts still create a working app and valid artifacts report non-zero startup counts.
- [ ] `npm --workspace apps/backend run test` and typecheck pass; a diff inspection confirms no changes to `askAiRequest.ts` or frontend request builders.
- [ ] A source scan confirms the runtime Commander Spellbook modules contain no `fetch`, HTTP client, or upstream URL invocation.

## Verification

```bash
npm --workspace apps/backend run test -- src/commanderSpellbook/promptSection.test.ts src/prompt/promptAssembly.test.ts src/prompt/preparation.test.ts src/prompt/promptDiagnostics.test.ts src/app.behavior.test.ts src/app.contract.test.ts
npm --workspace apps/backend run typecheck
rg -n "fetch\(|backend\.commanderspellbook\.com|api\.scryfall\.com" apps/backend/src/commanderSpellbook apps/backend/src/prompt apps/backend/src/runtime
git diff -- apps/backend/src/validation/askAiRequest.ts
```

The `rg` and final `git diff` commands are expected to show no runtime upstream call and no Slice D request-schema change. The app contract tests guard the unchanged frontend-facing request/response contract; final diff review confirms Slice D added no frontend files.

## Files touched

- `apps/backend/src/commanderSpellbook/promptSection.ts` (new)
- `apps/backend/src/commanderSpellbook/promptSection.test.ts` (new)
- `apps/backend/src/prompt/promptAssembly.ts`
- `apps/backend/src/prompt/promptAssembly.test.ts`
- `apps/backend/src/prompt/preparation.ts`
- `apps/backend/src/prompt/preparation.test.ts`
- `apps/backend/src/prompt/promptDiagnostics.ts`
- `apps/backend/src/prompt/promptDiagnostics.test.ts`
- `apps/backend/src/app/createApp.ts`
- `apps/backend/src/routes/askAi.ts`
- `apps/backend/src/runtime/createConfiguredApp.ts`
- `apps/backend/src/index.ts`
- `apps/backend/src/app.behavior.test.ts`
- `apps/backend/src/app.contract.test.ts`
