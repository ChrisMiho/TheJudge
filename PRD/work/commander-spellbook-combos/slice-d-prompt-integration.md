# Slice D — Prompt section rendering and integration

## Status: planned

## Goal

Render selected candidates into the community-sourced prompt section and wire it
into both prompt paths without touching the HTTP contract.

## Requirements

1. `apps/backend/src/commanderSpellbook/formatting.ts` renders
   `COMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED`. Each entry carries its
   classification, stable Commander Spellbook reference, compatible-present /
   wrong-zone / missing / matched-template / unresolved-template ingredients,
   per-ingredient applicable card state, per-ingredient `mustBeCommander`,
   produced effects, steps, mana needed, easy/notable prerequisites, and notes.
2. **The rendered classification never uses the bare word "complete."** A fully
   assigned candidate renders as all pieces present with card state explicitly
   unverified; a candidate with gaps renders as partial with its missing pieces
   named. The internal matcher vocabulary may keep the word; the rendered string
   may not.
3. Instruction lines state that Commander Spellbook is community catalog data, not
   WotC rules, legality validation, or proof of executability; that official card
   text, WotC rulings, and Comprehensive Rules remain authoritative; that partial
   candidates must have their missing or wrong-zone pieces identified; that an
   automatically supplied complete-context candidate is used only when relevant to
   the actual question and must not expand into unrelated staples; and that the
   model must check each ingredient's applicable card state and `mustBeCommander`
   against the submitted board before asserting a combo is live, assembled, or
   executable.
4. `buildPromptText()` inserts the section immediately after the rulings section
   and before `SCOPE`. `buildLookupPromptText()` inserts it after
   `officialRulingsSection` and before `conversationHistorySection`.
5. No selected variants produces no section and no empty heading.
6. `preparePromptInput` runs the matcher only when `comboCatalog` is present,
   for both the game and lookup branches, including the
   `collectEnrichmentDebug` variants.
7. The combo section contributes to `getPromptDiagnostics` the way the rulings and
   supplemental-rules sections already do.
8. Mock provider responses expose the exact assembled combo section under existing
   mock behavior; the live provider keeps the plain-text `{ answer }` contract.
9. `AskAiRequest`, `AskAiResponse`, error shapes, Zod schemas, provider selection,
   and `POST /api/ask-ai` are unchanged — no field added anywhere.

## Acceptance criteria

- [ ] A rendered complete candidate contains no occurrence of the standalone word
      "complete" (case-insensitive, word-boundary assertion over the section text)
- [ ] The same candidate renders card state as explicitly unverified
- [ ] A partial candidate names every missing and wrong-zone ingredient
- [ ] Per-ingredient card state and `mustBeCommander` appear for present,
      wrong-zone, and missing ingredients
- [ ] The state-verification instruction is present in **both** the game and
      lookup prompt texts
- [ ] Community-source, non-authoritative, and WotC-authority lines present in both
      prompt texts
- [ ] Section appears after the rulings section and before `SCOPE` in game mode,
      and after rulings and before conversation history in lookup mode
- [ ] Zero selected variants → the string
      `COMMANDER SPELLBOOK COMBO CONTEXT` appears nowhere in the prompt
- [ ] `comboCatalog` absent → matcher never invoked (spy assertion), no section
- [ ] Mock provider debug output contains the assembled section verbatim
- [ ] `getPromptDiagnostics` reports the combo section's char contribution
- [ ] `app.contract.test.ts` stays green unmodified; request/response bodies are
      byte-identical with and without a combo match
- [ ] `git diff` touches no file under `apps/backend/src/validation/` and no
      frontend file

## Verification

```bash
npm --workspace apps/backend run test -- prompt commanderSpellbook mockAskAi app.contract
npm --workspace apps/backend run typecheck
npm run lint
```

Vitest outermost `describe("Backend - Ask AI", …)`.

## Files touched

- `apps/backend/src/commanderSpellbook/formatting.ts` (new)
- `apps/backend/src/commanderSpellbook/formatting.test.ts` (new)
- `apps/backend/src/prompt/promptAssembly.ts`
- `apps/backend/src/prompt/promptAssembly.test.ts`
- `apps/backend/src/prompt/preparation.ts`
- `apps/backend/src/prompt/preparation.test.ts`
- `apps/backend/src/prompt/promptDiagnostics.ts`
- `apps/backend/src/prompt/enrichmentDebug.ts`
