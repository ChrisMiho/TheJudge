# Findings: backend code quality (2026-10-18)

## Summary in plain words

The backend is sound underneath. There are no import cycles, no `any`, and no `@ts-ignore`. Data loads once, and caches sit in the right places.

The one cost a player can actually feel is combo matching. On every In-Depth question, the server unpacks every combo that a card on the board belongs to, even when the question never mentions combos and only complete combos can be shown. With Ashnod's Altar, Phyrexian Altar or Sensei's Divining Top on the board, that measured 60–170 ms per question on a laptop, on every question, with no caching.

The rest is code that is hard to change safely:
- `prompt/preparation.ts` has four near-copy branches.
- The rule-search entry points take 10–11 positional arguments, and callers pass `undefined` placeholders.
- `gameRulesRetrieval.ts` (1,467 lines) mixes five jobs in one file.
- Tests and eval code (about 70% of the compiled output) ship in the Lambda package.
- The type that describes the debug part of the response is out of date.

Every fix below keeps answers, prompts, retrieved rules and their order the same. Each one names the test that proves it.

## Findings, ranked

### K-01: Combo matching unpacks thousands of combos per In-Depth question, even with no combo intent
- **Evidence:**
  - `commanderSpellbook/matcher.ts:373-376` fetches the detail of every variant (one combo record) that any board card belongs to. The eligibility filter at `:378-386` only runs after that. Without combo wording in the question, only fully-assigned candidates survive (`:379-381`).
  - The game path always runs the matcher when the catalog is loaded (`prompt/preparation.ts:226-233`). The catalog is on by default (`config/index.ts:127`).
  - The cache holds 64 variants plus 1 block (`catalog.ts:116, 460`), so it reloads everything on every request.
  - Measured with the committed data (tsx, laptop). The first two cards are the most-combo'd in the index; Sensei's Divining Top is a further sample:

    | Card | Variants | Blocks decoded | Time per pass |
    |---|---|---|---|
    | Ashnod's Altar | 6,148 | 475 | 152 ms, 127 ms on a repeat |
    | Phyrexian Altar | 5,296 | 650 | 167 ms |
    | Sensei's Divining Top | 3,658 | 191 | 72 ms |
    | Median card | 28 | | |

  - Sorting the lookups into block order does not help: the ids are already in block order.
- **Why it is poor:** this is the largest piece of our own per-request work in the backend. B-07 measured a warm request at 5–10 ms; this adds up to 170 ms on a common Commander board.
- **Behavior-preserving fix:**
  - A card ingredient can only be satisfied by an instance with that oracle id. `byOracleId` lists exactly the card ingredients (`scripts/build-commander-spellbook-combos.mjs:466-468`).
  - So, at load, count each variant's distinct card-ingredient ids from `byOracleId`.
  - When `!hasExplicitIntent`, keep only variants whose submitted-id hit count equals that number before calling `getVariant`. Any other variant cannot be `fullyAssigned` and is dropped by the filter anyway.
  - The final sort is a total order (it ends on `variantId`), so the order things were fetched in cannot change the output.
  - With combo intent the cost stays. That case is separate.
- **Size:** M
- **Proof of no change:**
  - Existing: `commanderSpellbook/matcher.test.ts` (780 lines) and the combo prompt goldens in `eval/fixtures/` (eval catalog).
  - Add: a test over boards built from the real catalog (top-50 cards, pairs) asserting the prefiltered `selectComboCandidates` deep-equals the unfiltered one.
- **Overlap:** partial. The backend-health brief edits `commanderSpellbook/catalog.ts` (loader warnings). The count map would live in the same file, so run after it or put the count in `matcher.ts`.
- One log-only difference: a corrupt variant that is now never fetched no longer prints its integrity warning.

### K-02: `preparation.ts` has four near-identical branches
- **Evidence:**
  - `prompt/preparation.ts:298-385` (lookup) and `:410-488` (game) each have a debug and a non-debug copy: retrieval, layout, prompt build, diagnostics.
  - The only differences:
    - debug calls `resolveRulingsForPrompt(..., true)` and `retrieveRulesForQueryWithDebug`;
    - lookup calls `buildLookupPromptText` and game calls `buildPromptText`.
  - ESLint probe: `prepareLookupPromptInput` is 112 lines (complexity 17); `prepareGamePromptInput` is 96 lines.
- **Why it is poor:** a change to the prompt pipeline has to be made four times. The debug and production paths can drift apart without anyone noticing.
- **Behavior-preserving fix:**
  - One `assemble(kind, context, query, ...)` helper.
  - Choose between `retrieveRulesForQuery` and `...WithDebug` with a flag. Both return the same `selected`; that is `selectSupplemental(...).selected` in both, see `gameRulesRetrieval.ts:1376, 1413`.
  - Attach `enrichmentDebug` only when asked.
- **Size:** M
- **Proof of no change:** the prompt goldens (`eval/fixtures/*.prompt.golden.txt`, `*.context.golden.json`) through `contextEvaluationHarness.test.ts`, plus `prompt/preparation.test.ts` (610 lines) and `builtPromptChecks.test.ts`.
- **Overlap:** none.

### K-03: Rule-search entry points take 10–11 positional arguments, with `undefined` placeholders
- **Evidence:**
  - `retrieveRulesForQueryWithDebug` takes 11 parameters (`gameRulesRetrieval.ts:1335-1347`) and `retrieveRulesForQuery` takes 10 (`:1399-1410`).
  - `queryText` is the 8th argument in one and missing from the other, so every later argument sits one position apart between the two.
  - Callers pass `undefined` for `resources`: `preparation.ts:311, 360, 418, 461`.
  - `selectSupplemental` takes 9 parameters (`:1287`) and `scoreIndex` takes 7 (`:997`).
  - 31 call sites across `preparation.ts`, `eval/ragRetrievalBenchmark.ts`, `scripts/score-rule-search.mjs` and three test files.
- **Why it is poor:** swapping two arrays of the same type, such as `cardVectors` and `keywordSets`, or `queryRuleIds` and `questionRuleIds`, still type-checks and would silently change which rules are retrieved.
- **Behavior-preserving fix:**
  - One options object, `{ index, exclude, max, resources, queryVector, questionRuleIds, cardVectors, keywordSets, queryText }`.
  - `retrieveRulesForQuery(opts)` becomes `retrieveRulesForQueryWithDebug(opts).selected`, or both share one internal function.
- **Size:** M (touches tests, so not a `codehealth` tick).
- **Proof of no change:** `gameRulesRetrieval.test.ts`, `gameRulesSearchFixes.test.ts`, `rules-gate/rulesGate.test.ts` and `retrievalReportParity.test.ts`. The rules gate only checks which rules hit, not their order, so first add the order snapshot described in K-04.
- **Overlap:** backend-health brief, `gameRulesRetrieval.ts`, but a different region: the brief owns the loaders at `:32-372`.

### K-04: `gameRulesRetrieval.ts` mixes five jobs; split along existing seams
- **Evidence:** the file falls into five blocks.

  | Lines | What it does |
  |---|---|
  | `:32-372` | Artifact loaders, int8/float32 vector decode, default resources |
  | `:461-499` | Rule-id utilities (`extractRuleIds`, `compareRuleIds`); also imported by `prompt/ruleLayout.ts:5` |
  | `:501-810` | Query building (tokens, compact card signal, turn step, obsolete glossary terms, `buildRetrievalQuery`) |
  | `:812-1128` | Scoring (boosts, lexical, cosine, index match, `scoreIndex`) |
  | `:1139-1467` | Selection and the public entry points |

  ESLint probe: `scoreIndex` is 98 lines with complexity 34, and `selectWithPerCardSlots` has complexity 19. The curated-rule exclusion block is pasted twice inside `scoreIndex` (`:1070-1077` and `:1105-1112`).
- **Why it is poor:** one file of 1,467 lines with 40+ exports. `ruleLayout` (prompt layout) depends on the search module only to get `compareRuleIds`.
- **Behavior-preserving fix:**
  - Move the blocks into `rules/retrievalData.ts`, `rules/ruleIds.ts`, `rules/retrievalQuery.ts`, `rules/scoring.ts` and `rules/selection.ts`.
  - Keep `gameRulesRetrieval.ts` as a barrel that re-exports, so none of its 33 importers (6 of them scripts) change.
  - Pull the exclusion check into one function. Moving code between files cannot change the order.
- **Size:** L
- **Proof of no change:**
  - Add first: a characterization test that records `retrieveRulesForQueryWithDebug` output (ordered ids and scores, `selected` and `runnerUp`, `usedSemantic`) for every rules-gate case on its committed frozen vectors, and asserts deep equality.
  - Then the existing retrieval, search-fix, benchmark and gate tests.
- **Overlap:** backend-health brief, `gameRulesRetrieval.ts`. The loader block `:32-372` is the part the brief rewrites (`warnOnce`, `getDefaultScoringResources`). Split only after the brief lands.

### K-05: Lexical scoring is written twice; one function can serve both with the same floating-point result
- **Evidence:**
  - `scoreEntry` (`gameRulesRetrieval.ts:910-945`) repeats `computeIdBoost` (`:824-839`) and `computeLexicalWordOverlapScore` (`:875-898`) line for line.
  - The comment at `:901-909` says it is kept separate so the floating-point additions happen in the same order.
- **Why it is poor:** two copies of the scoring formula. A tuning change made to one will silently miss the other.
- **Behavior-preserving fix:** `accumulateWordOverlap(entry, tokens, N, df, start)`, where:
  - `computeLexicalWordOverlapScore` passes `start = 0`;
  - `scoreEntry` passes `start = computeIdBoost(entry, ids)`.

  `computeIdBoost` builds `0 → +100 → +20` in the same order `scoreEntry` does, so the running total sees exactly the same additions. The comment's concern (summing two results at the end) does not apply to seeding the starting value.
- **Size:** S
- **Proof of no change:** the A4 "byte-identical under mock" tests in `gameRulesRetrieval.test.ts`, plus the K-04 order snapshot on the lexical path.
- **Overlap:** backend-health brief, `gameRulesRetrieval.ts` (different region).

### K-06: Repeated work on each request (new instances of B-08)
- **Evidence:**
  - **Boosts computed twice.** `selectSupplemental` recomputes `computeIdBoost + computeCrossReferenceBoost` twice per candidate (`gameRulesRetrieval.ts:1302-1309`), although `scoreIndex` already computed it (`:1084`). The cross-reference boost runs two regexes over the rule text (`:857`) each time.
  - **Rule-vector lengths recomputed.** `cosineSimilarity` (`:948-959`) recomputes the length of all 2,894 committed rule vectors on every request (`:1082`), and again for each card vector (`:1199`).
  - **Regexes rebuilt per call.** `findObsoleteGlossaryTerms` (`:728-739`) rebuilds 36 `RegExp`s and re-tokenizes their terms on every call (34 obsolete entries). `buildRetrievalQuery` runs about 3× per request (B-08).
  - **Concept terms computed again.** `conceptTermsForCards` (84 regexes per card) also runs in topic selection (`gameRulesTopicSelection.ts:61`), on top of the retrieval-query runs.
  - **Combo section built twice.** `formatComboSection` runs twice per request: for its length (`preparation.ts:296, 408`) and inside the prompt builder (`promptAssembly.ts:67, 144`).
- **Why it is poor:** each one recomputes something that cannot change within a request, or within the process.
- **Behavior-preserving fix:**
  - Carry `boost` on `ScoredEntry`. It is the same function with the same inputs, so `score - boost` gives the same bits.
  - Cache the per-rule length term in a `WeakMap` keyed by the embeddings object, computed with the same loop, so `Math.sqrt` gives the same bits.
  - Cache cited-rule ids per entry, and the compiled glossary patterns per glossary array, in `WeakMap`s.
  - Pass the combo section text into the prompt builder.
- **Size:** S each.
- **Proof of no change:** the K-04 order snapshot (semantic path), `gameRulesSearchFixes.test.ts`, and the prompt goldens.
- **Overlap:** backend-health brief, `gameRulesRetrieval.ts` (scoring region only).

### K-07: The response's debug type comes from a Zod schema that is never run and is out of date
- **Evidence:**
  - `prompt/enrichmentDebug.ts:9-47` defines `enrichmentDebugSchema` only to derive `EnrichmentDebug` from it. It is never `.parse()`d; its only use is in its own file.
  - Its `supplemental` object is missing `usedSemantic`, `perCardSelected` and `keywordSetSelected`, which `SupplementalRulesDebug` carries (`gameRulesRetrieval.ts:1142-1162`) and the response actually sends (`preparation.ts:338, 445`).
- **Why it is poor:** the response type under-describes the real response, and it loads `zod` at runtime just to produce a type.
- **Behavior-preserving fix:** `type EnrichmentDebug = { supplemental: SupplementalRulesDebug; curatedGameRules: {...}; rulings: RulingsDebug; ruleLayout?: RuleLayoutStats }`, and delete the schema.
- **Size:** S
- **Proof of no change:** typecheck. This is a type-only change, so no runtime path changes.
- **Overlap:** none.

### K-08: Tests and eval code ship inside the Lambda package
- **Evidence:**
  - `apps/backend/tsconfig.json` sets `include: ["src"]` with no exclude.
  - `scripts/package-lambda.sh:67` copies all of `apps/backend/dist`.
  - Compiling to scratch gave 1,244 KB in total:
    - 55 `*.test.js` files, 724 KB;
    - `eval/` 276 KB (part of it is those test files);
    - `test-utils/`.
  - No production module imports `eval/` or `test-utils` (checked by grep). Nothing reads `dist/eval`; scripts use `src` through tsx.
- **Why it is poor:** about 70% of the shipped compiled code is never loaded, and the test files import `vitest`, which isn't installed in the package. The size is small next to the 262 MB limit, but it is dead weight and confuses anyone auditing the package.
- **Behavior-preserving fix:** a `tsconfig.build.json` that excludes `**/*.test.ts`, `src/eval/**` and `src/test-utils/**`, used by `"build"`. Typecheck keeps the full config.
- **Size:** S
- **Proof of no change:** `scripts/lambda-package-budget.test.mjs`, the CI deploy, and one live request after deploy. The memory note says to verify the native embedder chain after a deploy.
- **Overlap:** none (build config). Deploy-affecting, so verify live.

### K-09: Casts that do nothing, and a hand-built lookup
- **Evidence:**
  - Two casts that do nothing, both confirmed by compiling a probe file in scratch with `tsc --strict` without them (exit 0):
    - `routes/askAi.ts:77`: `parsed.data as AskAiRequest`. `AskAiRequest` is `z.infer` of that same schema.
    - `prompt/preparation.ts:109, 124`: `request as GameAskAiRequest`. The union already narrows after the `mode === "lookup"` check.
  - `promptFormatting.ts:98-104`: `reduce` with an object spread plus `{} as Record<...>`; quadratic.
  - `promptAssembly.ts:138` passes `{} as Record<PlayerLabel,...>` only to satisfy a parameter whose output it then filters away (see K-10).
  - `config/index.ts:33, 42` cast a raw string to the mode type before validating it.
- **Why it is poor:** the casts hide real type errors if the schema changes.
- **Behavior-preserving fix:**
  - Delete the two casts.
  - Use `Object.fromEntries(players.map(p => [p.label, p.displayName]))`: same keys, same insertion order.
  - Add an `isMode` type guard in config.
- **Size:** S
- **Proof of no change:** typecheck, `promptFormatting.test.ts`, and the prompt goldens.
- **Overlap:** backend-health brief, `routes/askAi.ts` (it edits `:106`); one-line, low collision risk.

### K-10: Prompt card blocks are built, then patched by searching line prefixes
- **Evidence:**
  - `promptFormatting.ts:291-302` and `:327-334` build the metadata lines, then `splice` `caster:`, `manaSpent:` and `copies:` in by searching for the `"targets:"` and `"manaSpent:"` prefixes.
  - The comment at `:294` ("caster after subtypes (index 6), manaSpent after targets (index 8)") is wrong since REQ-245: power, toughness and loyalty shift those positions.
  - Lookup (`promptAssembly.ts:133-139`) formats a `targets:` line with an empty name map, then filters out the `targets:` and `contextNotes:` lines.
- **Why it is poor:** the line order is set implicitly, by searching for strings, rather than written out.
- **Behavior-preserving fix:** `formatZoneCardMetadataLines(card, names, { caster?, manaSpent?, copies?, includeTargets, includeNotes })` that emits the lines in their final order directly.
- **Size:** S–M
- **Proof of no change:** the prompt goldens (stack, zone and lookup fixtures) and `promptAssembly.test.ts` (843 lines).
- **Overlap:** none.

### K-11: Dead branches, a dead parameter and a dead type
- **Evidence:**
  - `getPromptDiagnostics` still accepts a bare `ResolvedRulings` as its second argument (`promptDiagnostics.ts:40, 55-57`, plus the cast at `:58`). No caller in `src`, tests or scripts passes one; all pass the options object or nothing.
  - `buildZoneScopeSentence(_selectedZones, …)` ignores its first parameter (`promptFormatting.ts:359`), as its own docstring says. Called at `promptAssembly.ts:60`.
  - `errorHandler.ts:25-34`: `metadata` always holds `correlationId`, so `Object.keys(metadata).length > 0 ? … : undefined` can never take the `undefined` branch.
  - `GameRulesSection` (`gameRules.ts:10-13`) has zero references.
  - Test-only production exports:
    - `retrieveSupplementalRules` (`gameRulesRetrieval.ts:1444`, used only by tests, and it builds its query from `finalQuestion`, not the REQ-246 rule question production uses);
    - `buildQueryText` (`:584`, its comment says "retained for debug output" but no debug output uses it);
    - `buildQueryTokens` (`:589`);
    - `formatSupplementalRulesSection` (`promptFormatting.ts:350`).
- **Why it is poor:** a reader has to reason about paths that cannot run. The test-only retrieval entry point tests a query production never builds.
- **Behavior-preserving fix:** delete the overload branch, the parameter, the ternary and the type. Move the test-only exports into test helpers, or point those tests at the production entry points.
- **Size:** S (the test-only exports need test edits, so they are not a `codehealth` tick).
- **Proof of no change:** typecheck and `promptDiagnostics.test.ts`; the error-contract tests in `app.contract.test.ts`.
- **Overlap:** backend-health brief, `app/errorHandler.ts` (fold the ternary into its error-handler change).

### K-12: About 25 exports are used only inside their own file
- **Evidence** (zero importers in `apps/` or `scripts/`, tests included; each used in its own file):
  - `gameRulesTopicSelection.ts`: `selectTriggeredTopicIds`
  - `gameRulesStemmer.ts`: `SEARCH_STOP_WORDS`
  - `gameRulesRetrieval.ts`: `errorOnce`, `loadGameRulesGlossary`
  - `embeddingModel.ts`: `EMBEDDING_MODEL_MANIFEST_PATH`
  - `matcher.ts`: `resolveAnchorCardIds`
  - `intent.ts`: `COMBO_INTENT_TERMS`
  - `formatting.ts`: `COMBO_INSTRUCTION_LINES`
  - `promptFormatting.ts`: `STACK_ORDER_PREAMBLE_LINE`, `buildPlayerDisplayNameLookup`, `formatPlayerRef`, `toPlayerLabelIndex`, `formatTargets`
  - `phaseGuidance.ts`: `MAX_NAMED_STEP_SUMMARIES`, `TURN_STEP_NAME_TABLE`
  - `ruleLayout.ts`: `defaultPartTitles`, `lastSentence`
  - `promptDiagnostics.ts`: `estimatePromptChars`
  - `enrichmentDebug.ts`: `enrichmentDebugSchema`
  - `validation/askAiRequest.ts`: `stackZoneCardItemSchema`, `lookupCardReferenceSchema`, `commanderDamageEntrySchema`, `namedCounterSchema`
- **Why it is poor:** the public surface looks about twice as large as it is, which hides what each module's real interface is.
- **Behavior-preserving fix:** drop `export` from each. No test imports them, so this is a valid `codehealth` tick.
- **Size:** S
- **Proof of no change:** typecheck plus the full test run.
- **Overlap:** backend-health brief touches `gameRulesRetrieval.ts`, `embeddingModel.ts`, `ruleLayout.ts` and `validation/askAiRequest.ts`; leave those four for after it.

### K-13: Stack and zone cards are normalized by two copies of the same code
- **Evidence:**
  - `prompt/context.ts:296-312` (stack items) repeats `:186-203` (zone items) field by field: oracle text, mana cost, type line, colors, supertypes, subtypes, keywords, display fields, targets, notes.
  - Inline `import("../types/index.js").ZoneCardItem` types at `:180, 277` instead of the import list.
  - `normalizeOptionalCopies` is called twice at `:317-318`.
- **Why it is poor:** a new card field (REQ-245 was the last one) has to be added in two places.
- **Behavior-preserving fix:** one `cardDetailFields(card, detail)` helper, spread at the same position in both object literals so the JSON key order of `context` stays the same. The stack's own empty-name handling stays as it is (see out of scope).
- **Size:** S
- **Proof of no change:** the `*.context.golden.json` fixtures and `prompt/context.test.ts` (670 lines).
- **Overlap:** none.

### K-14: The search's turn-step names repeat the step tables in `phaseGuidance.ts`
- **Evidence:**
  - `turnStepSearchName` (`gameRulesRetrieval.ts:673-708`) is a 35-line switch.
  - Its output equals `STEP_SUMMARIES[key].name` (`phaseGuidance.ts:33-111`) through `PHASE_STEP_KEY` / `COMBAT_STEP_KEY` (`:187-203`) in every case except three:
    - `main_1` gives "precombat main phase";
    - `main_2` gives "postcombat main phase";
    - combat with no step gives "combat phase".
- **Why it is poor:** two tables of rule-book step names, one in the search and one in the prompt guidance.
- **Behavior-preserving fix:** derive the names from the `phaseGuidance` tables plus those three explicit overrides. Better, move the key tables into a small shared module, so the search doesn't import from `prompt/`.
- **Size:** S
- **Proof of no change:** add an exhaustive test over every phase × combat-step pair (8 × 6) asserting the same strings. The input space is finite, so the test proves it.
- **Overlap:** backend-health brief, `gameRulesRetrieval.ts` (query region only).

### K-15: Small text helpers are copied around and drifting
- **Evidence:**
  - `escapeRegExp`: `gameRulesRetrieval.ts:710`, `commanderSpellbook/intent.ts:21`, `eval/rules-gate/stateFacts.ts:33`.
  - Curly-apostrophe folding, four places in two spellings: `gameRulesStemmer.ts` (`CURLY_APOSTROPHE`), `gameRulesRetrieval.ts:725`, `gameRulesConceptMap.ts:140`, `phaseGuidance.ts:164`.
  - `truncatePromptLabel` is a one-line wrapper around `truncateOracleText` (`promptFormatting.ts:81-83`).
  - `formatConversationHistorySection` uses an inline `EFFECTIVELY_UNLIMITED_CHARS / 10` (`promptFormatting.ts:87`) instead of a named constant.
  - Combo data:
    - `catalog.ts:71` `ZONE_IDS` repeats `zones.ts` `COMBO_ZONE_ORDER` (same order).
    - The block size is a hard-coded `>> 7` / `& 127` (`catalog.ts:357-358, 434`), where the build exports `COMBO_BLOCK_SIZE = 128` (`scripts/build-commander-spellbook-combos.mjs:45`).
- **Why it is poor:** copies drift. Two apostrophe spellings already exist.
- **Behavior-preserving fix:** a `text.ts` with `escapeRegExp` and `foldApostrophes`; named constants; import `COMBO_ZONE_ORDER`; a `COMBO_BLOCK_SHIFT` constant.
- **Size:** S
- **Proof of no change:** the stemmer, concept-map, phase-guidance, intent and catalog unit tests.
- **Overlap:** backend-health brief, `catalog.ts` (do the catalog part after it).

### K-16: The eval harness has checks that always pass and labels that are out of date (new instance of B-10)
- **Evidence** (all in `eval/contextEvaluationHarness.ts`):
  - **Check `supplemental-rules-before-rulings` always passes.** It searches for `"\nOFFICIAL RULINGS"` (`:472-488`), a section REQ-241 removed.
  - **Check `game-rules-before-rulings` no longer checks order** (`:423-435`).
  - **Wrong pass message.** `supplemental-rules-section-present` passes with "…present with expected disclaimer" (`:448`) while it now checks that the disclaimer is absent.
  - **Wrong fallback question.** `FALLBACK_QUESTION = "Resolve the stack"` (`:12`) ignores production's board-only fallback (`context.ts:230-240`, `DEFAULT_BOARD_QUESTION`). It is latent: the schema allows an empty question (`questionSchema` min 0).
  - **Retyped instruction lines.** `REQUIRED_GUARDRAIL_LINES` (`:14-18`) retypes `SHARED_INSTRUCTION_LINES` (`promptFormatting.ts:43-50`).
  - **Second copy of the checks.** `renderRelevanceScenario` (`:670-725`, complexity 23) re-implements the System 2 and System 3 checks from `:503-551`, and skips `lexicalKnownMisses`.
  - **Wrong slot count.** "top-10" labels appear throughout, while the cap is 15 (`preparation.ts:60`).
- **Why it is poor:** the harness reports checks as passing that test nothing.
- **Behavior-preserving fix:** import the production constants and the fallback function; reuse the check functions in the report; drop or redefine the two rulings checks.
- **Size:** S–M. It changes eval report text, so `relevanceReport.test.ts` expectations move. No product output changes.
- **Proof of no change:** the prompt goldens stay untouched; only harness tests change.
- **Overlap:** none.

### K-17: Eleven loose modules at the root of `src/`, and `cardRulings.ts` does two jobs
- **Evidence:**
  - Root files:
    - five `gameRules*` files: 24, 5, 33, 5 and 7 importers;
    - three loaders: `cardDetail`, `cardPrices`, `cardRulings`;
    - also `embeddingModel`, `mockAskAi`, `responseSizeDiagnostics`.
  - `cardRulings.ts` mixes loading the file (`:41-97`) with prompt policy: `collectCardsForRulings` and the debug-flag overload of `resolveRulingsForPrompt` (`:100-213`).
  - `collectCardsForRulings` does a `.find` per zone (`:116-117`) over a list that is already in canonical order.
  - No runtime import cycles were found.
- **Why it is poor:** the folders (`prompt/`, `providers/`, `commanderSpellbook/`) stop at the root, and the rules family is scattered.
- **Behavior-preserving fix:**
  - `rules/` for the `gameRules*` files and the K-04 split.
  - `data/` for the loaders.
  - Move rulings policy into `prompt/rulings.ts`.
  - Leave re-export stubs at the old paths for the 6 script importers, or update them.
- **Size:** L. Low payoff; do last.
- **Proof of no change:** typecheck, the full test suite, `npm run test:scripts`.
- **Overlap:** backend-health brief owns the loader files and `gameRules.ts`; run after it.

### K-18: Stale comments and duplicated literals
- **Evidence:**
  - `types/index.ts:41` points to `normalizeContextTarget in promptContext.ts`; the file is `prompt/context.ts`.
  - `promptFormatting.ts:294` gives stale positions (see K-10).
  - `routes/askAi.ts:188-193` hard-codes the 1,200 ms latency threshold twice.
  - `routes/askAi.ts:24` and `app/createApp.ts:23` retype `"mock" | "openai"` instead of exporting `AskAiProviderMode` from `config/index.ts:10`.
  - `localEmbeddingProvider.ts:46` retypes `Extractor` inline.
  - "Miho is working on it" is passed explicitly where it is already the default (`errors.ts:84, 88`; `openAiResponsesProvider.ts:108, 127, 136`).
- **Why it is poor:** small drift traps.
- **Behavior-preserving fix:** fix the references, add a `PROVIDER_LATENCY_WARNING_MS` constant, export and import the mode type, rely on the default message.
- **Size:** S
- **Proof of no change:** typecheck, `errors.test.ts`, provider tests.
- **Overlap:** backend-health brief touches `routes/askAi.ts`, `createApp.ts` and `localEmbeddingProvider.ts`; fold those lines into it.

### K-19: The part-titles loader swallows a parse error with no warning (new instance of B-02)
- **Evidence:** `prompt/ruleLayout.ts:57-62` has `catch { titles = {}; }`. A corrupt `gameRulesBookMeta.json` silently drops every "<part title> ›" label from the search excerpts. Every other loader at least `warnOnce`s.
- **Why it is poor:** this is the same silent-degradation class as B-02, and the only loader with no signal at all.
- **Behavior-preserving fix:** route it through the brief's shared `readCommittedJson` / `warnOnce`. The prompt does not change; it only adds a log line.
- **Size:** S
- **Proof of no change:** `ruleLayout` tests.
- **Overlap:** backend-health brief, `prompt/ruleLayout.ts` (B-07 already names this loader). Hand it to that run.

## Behavior changes (out of scope)

- **Stack card names.** Filtering empty-named stack cards the way zone cards are filtered (`context.ts:183-184` vs `:299`) changes the context and prompt for a malformed stack card.
- **Carrying the raw blend.** Carrying the unboosted blend in place of `score - boost` (`gameRulesRetrieval.ts:1305, 1309`) can flip the relevance cutoff by one unit in the last place of a floating-point number. That is not order-proof.
- **Storing rule vectors as Float32Array.** This would cut about 9 MB of heap, but it rounds scores differently.
- **Batching embedding calls.** Batching the query and per-card embeddings into one pipeline call may shift vectors numerically.
- **"Effectively unlimited" caps.** Removing these caps and their truncation branches (`normalization.ts:3-11`, `cardRulings.ts:173-193`) changes behaviour on extreme input; DEC-042 owns the budget.
- **Latency threshold.** Raising the 1,200 ms latency-warning threshold to match the 30 s budget changes which log lines appear.
- **Fixing the eval fallback.** Fixing the eval fallback-question check (K-16) changes eval results for empty-question board-only fixtures (none exist today).
- **Combo prefilter log.** With K-01, a corrupt variant that is never fetched no longer prints its warning.
- **Combo matching with intent.** Speeding up matching when the question has combo intent needs ingredient data in the index, or a different ranking.

## Healthy: don't fix

- **No runtime import cycles** in `src` (graph check over non-type imports).
- **No `any`, `@ts-ignore` or `eslint-disable`** in production code. The one `as unknown as` (`localEmbeddingProvider.ts:41`) is a fair bridge over the transformers pipeline typing.
- **The `!` uses in retrieval** are guarded: by the validation at `:287`, by `useSemantic` at `:1079`, and by bounded indexes.
- **The OpenAI provider's deadline and retry logic** is careful and well commented (`openAiResponsesProvider.ts`): one deadline, the SDK's own retries off, the rejection handled.
- **One validation schema and one error class family.** `classifyProviderError` keeps `AppError`s it is given.
- **Concept-map and stemmer regexes** are compiled once at module load. The `WeakMap` caches in retrieval and `ruleLayout` are right.
- **The combo catalog's block-and-position design** is deliberate (DEC-162). Its validation is thorough.
- **The two combo comparators** (game vs lookup) differ on purpose (REQ-094/REQ-167).
- **Keep the per-card and keyword-set selection logic as it is.** It is complex but each rule is tied to a REQ; only move it (K-04), don't reshape it.
