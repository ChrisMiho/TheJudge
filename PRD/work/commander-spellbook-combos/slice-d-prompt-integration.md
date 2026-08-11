# Slice D — Prompt section rendering and integration

## Status: done

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

- [x] A rendered complete candidate contains no occurrence of the standalone word
      "complete" (case-insensitive, word-boundary assertion over the section text)
- [x] The same candidate renders card state as explicitly unverified
- [x] A partial candidate names every missing and wrong-zone ingredient
- [x] Per-ingredient card state and `mustBeCommander` appear for present,
      wrong-zone, and missing ingredients
- [x] The state-verification instruction is present in **both** the game and
      lookup prompt texts
- [x] Community-source, non-authoritative, and WotC-authority lines present in both
      prompt texts
- [x] Section appears after the rulings section and before `SCOPE` in game mode,
      and after rulings and before conversation history in lookup mode
- [x] Zero selected variants → the string
      `COMMANDER SPELLBOOK COMBO CONTEXT` appears nowhere in the prompt
- [x] `comboCatalog` absent → matcher never invoked (spy assertion), no section
- [x] Mock provider debug output contains the assembled section verbatim
- [x] `getPromptDiagnostics` reports the combo section's char contribution
- [x] `app.contract.test.ts` stays green unmodified; request/response bodies are
      byte-identical with and without a combo match
- [x] `git diff` touches no file under `apps/backend/src/validation/` and no
      frontend file

## Verification evidence

Recorded 2026-08-11 on the implementation worktree.

- `npm --workspace apps/backend run test -- prompt commanderSpellbook mockAskAi app.contract`
  — 192/192 pass across 15 files, including `formatting.test.ts` (12) and the new
  `prompt/comboPromptIntegration.test.ts` (13).
- `npm --workspace apps/backend run typecheck` — clean. `npm run lint` — 0 errors.
- `git diff --name-only origin/feature/enhancement-bangers...HEAD` lists no file
  under `apps/backend/src/validation/` and no file under `apps/frontend/`.
- `app.contract.test.ts` is byte-identical to the base branch and stayed green.

### The word "complete" is absent by construction, not by accident

The rendered classifications are `all pieces present; card state unverified` and
`partial; missing pieces named below`. The guardrail instruction that the brief
phrases as "an automatically supplied *complete-context* candidate" is rendered as
"a candidate supplied automatically, rather than in response to an explicit combo
question" — deliberately, because `\bcomplete\b` matches `complete-context` (the
hyphen is a word boundary) and would have failed the assertion. Two tests apply
the regex: one to a fully assigned candidate, one to a section mixing all five
annotation kinds.

### No change was needed for mock exposure

`buildMockAnswer` already emits `promptText` verbatim under
`FULL PROMPT (SENT TO PROVIDER)`, so the combo section is exposed by existing mock
behavior. A test asserts the assembled section appears verbatim in the mock answer
rather than adding a second rendering path.

### Spy assertion is non-vacuous

`expect(spy).not.toHaveBeenCalled()` would pass whether or not `vi.spyOn` can
intercept an ESM named import. The same test therefore also asserts the spy
observes the call a supplied catalog *does* make, so the negative assertion cannot
silently rot into a no-op.

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
