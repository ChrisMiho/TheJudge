# Slice C — manual evidence log

This slice's mechanical criteria (C1-C9) are earned by the tool calls the
build node ran against `askAiRequest.ts`, `preparation.ts`,
`gameRulesRetrieval.ts`, the combo modules, and the providers modules,
per `slice-c.criteria.json`'s evidence blocks. This log records the manual
reading and reasoning behind those calls, including three real, sourced
discrepancies found between the spec's "Built:" claims and the actual
`apps/backend/src/` code — all three are out of this slice's bounded
correction license (the DEC-047/REQ-033 `Backed by:` addition only) and
are reported via a PR comment rather than silently corrected or silently
passed over.

## Confirmed accurate (C1-C5, C8)

- Request validation (`askAiRequest.ts`, read in full): `askAiRequestSchema`
  is `z.preprocess` + `z.discriminatedUnion("mode", ...)`; a payload with no
  `mode` key gets `mode: "game"` injected by the preprocess step (back-compat
  default confirmed). `gameAskAiRequestSchema` is `.strict()` with exactly
  `{ mode?, question, gameContext, conversationHistory? }` -- no top-level
  `stack`/`battlefieldContext`/`card`. `zonesSchema` uses `.min(1)` on every
  zone array, so an empty zone can never be submitted (empty-zone omission
  confirmed at the schema level). `conversationHistorySchema`: `.min(1).max(20)`
  turns, `superRefine` enforces first-turn `user`, last-turn `assistant`,
  strict alternation -- matches the shared-validator claim exactly.
- Prompt assembly (`preparation.ts` `prepareGamePromptInput` +
  `promptAssembly.ts` `buildPromptText`, both read in full): `PHASE GUIDANCE`
  is unconditionally pushed (never gated on `.length > 0` the way every other
  optional section is) -- confirms "never omitted for a valid phase."
  `formatZoneCardMetadataLines` (`promptFormatting.ts`) emits exactly
  `manaCost, manaValue, typeLine, colors, supertypes, subtypes, targets,
  contextNotes, oracleText` for every card in every populated zone, with the
  empty-oracle-text fallback string byte-for-byte
  `"(none) — no oracle text recorded for this card"`. `formatStackSection`
  splices in `caster` and `manaSpent` only for stack items (and prints the
  `stackRole` in the item label); `formatNonStackZoneSections` adds `owner`
  and does not add `caster`. Neither `cardId` nor `imageUrl` appear in either
  formatter's output. All of this matches the spec's claims exactly.
- Retrieval (`gameRules.ts`, `gameRulesTopicSelection.ts`,
  `gameRulesRetrieval.ts`, all read in full): missing/unparseable rules
  artifact logs a warning once and returns `[]` (section omitted, matches).
  `selectGameRulesTopics` (System 2) selects `ALWAYS_ON_TOPIC_IDS` plus
  zone/phase/combat-step-gated additions -- reads only
  `context.orderedStack`, `context.populatedZones`, `context.gameContext.
  turnPhase/combatStep`, never card names or oracle text (matches "card-
  agnostic" exactly). `scoreIndex`/`scoreEntry` (System 3) is IDF-weighted
  (`SCORE_EXACT_RULE_ID`/`SCORE_PARENT_RULE_ID`/token-IDF `weight`),
  `retrieveSupplementalRules` defaults `max = 5`, filters `score > 0` before
  inclusion, and `excludeRuleIds` (the curated System-2 ids) is threaded
  through `scoreIndex` for dedup. Matches exactly.
- Combo enrichment (`matcher.ts`, `formatting.ts`, `preparation.ts`, all read
  in full): `MAX_COMBO_CANDIDATES = 5`. `selectComboCandidates`'s `eligible`
  filter admits every `fullyAssigned` (complete) candidate unconditionally
  and admits a partial candidate only when `request.hasExplicitIntent` is
  true (and, for game mode with named anchors, only when the candidate
  shares an anchor) -- matches "without explicit combo intent, retrieval
  returns only complete candidates; with explicit combo intent, complete
  candidates rank first and partial candidates may also return" exactly.
  `compareCandidates` sorts `fullyAssigned` first, then deterministic
  tiebreakers ending in `variantId.localeCompare` -- fully deterministic
  ordering confirmed. `COMBO_SECTION_HEADING` is byte-for-byte
  `"COMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED"`; a code comment
  in `formatting.ts` states the section is "deliberately free of the bare
  word complete" -- confirmed. `resolveGameComboCandidates` is the game-mode
  combo call site cited by the spec, distinct from
  `resolveLookupComboCandidates`. `package.json`'s `quality:check` script
  chain does not include `scripts/compare-combo-answer-quality.mjs` --
  confirms DEC-161's "never a golden, never in quality:check, never a build
  gate" claim.
- Provider boundary and diagnostics (`askAiProvider.ts`,
  `mockAskAiProvider.ts`, `providers/README.md`, `routes/askAi.ts`, all read):
  `AskAiProvider.generateAnswer(preparedPrompt: PreparedPromptInput)` takes
  only the prepared prompt, no `mode` parameter anywhere in the interface or
  call sites -- confirms mode-agnostic. `providers/README.md` confirms
  `ASK_AI_PROVIDER` mock-default / openai-live selection. `routes/askAi.ts`
  logs `correlationId` + `providerElapsedMs` always, and spreads
  `getAnswerSizeDiagnostics(response.answer)` (which is `answerChars`,
  `estimatedAnswerTokens`, `charsPerTokenEstimate`) into the log only when
  `askAiProviderMode === "openai"` -- matches "successful live answers emit
  log-only size diagnostics" exactly. `res.status(200).json(response)` sends
  the provider's `{ answer }` object directly with no sidecar merged in,
  confirmed by `app.contract.test.ts`'s explicit
  `not.toHaveProperty("answerChars"/...)` assertions on the response body.
- Where it lives (backend half): every named file
  (`routes/askAi.ts`, `validation/askAiRequest.ts`,
  `prompt/{preparation,context,normalization,mtgReference,phaseGuidance}.ts`,
  `{cardRulings,gameRules,gameRulesTopicSelection,gameRulesRetrieval}.ts`,
  `commanderSpellbook/*`, `providers/*`) confirmed present in the repository
  tree via `ls`.

## Three real, sourced discrepancies found (out of this slice's correction license)

1. **`gameStateNotes` / `ADDITIONAL GAME STATE` does not exist in `apps/`.**
   `grep -rn "gameStateNotes" apps/` returns zero results anywhere in the
   repository, frontend or backend, and `git log --all -S "gameStateNotes" --
   apps/` returns zero commits -- the string has never existed in the git
   history of `apps/`. The spec's Request-validation bullet ("`gameStateNotes`
   is optional, trimmed, control-character-guarded, capped at 2000
   characters...") and its Prompt-assembly bullet ("`ADDITIONAL GAME STATE`
   (when `gameStateNotes` present)") both present this as a shipped, Built
   feature. It is not built. This is not a fresh ambiguity: `PRD/sections/
   system-map.md`'s own `### gameStateNotes / ADDITIONAL GAME STATE` catalog
   entry already says so explicitly -- "decided and documented, no code under
   `apps/` yet" and "Lives in: (planned) `apps/backend/src/prompt/` +
   `GameContext` request shape" -- confirming DEC-043/REQ-031 were decided
   (`Status: confirmed`) but never implemented. `PRD/sections/system-map/
   prompt-assembly.md` independently confirms: "`ADDITIONAL GAME STATE` is a
   planned DEC-043 prompt slot, represented as planned in the catalog until
   the request shape and assembly code ship it." The in-depth spec's "Built:"
   framing for this content contradicts the corpus's own already-recorded
   shipped/planned distinction.

2. **`conversationHistory`'s per-message character cap is 10000 in code, not
   2000 as REQ-027/DEC-038 (and this spec) state.** `askAiRequest.ts`'s
   `conversationTurnSchema` is `{ role, content: boundedText(10000) }` --
   `boundedText(10000)` caps at 10000 characters. No other validation layer
   (`normalization.ts`'s `truncateConversationHistory` only enforces the
   aggregate `MAX_CONVERSATION_HISTORY_CHARS` budget, not a per-message cap)
   imposes 2000 anywhere. REQ-027's acceptance criteria state "max 2000
   chars/message" and DEC-038's Impact states "max 2000 chars/message,"
   and the in-depth spec's Request-validation bullet repeats "≤2000
   chars/message" and Measured bounds repeats "≤2000 chars/message." All
   four sources agree with each other and disagree with the shipped
   validator by 5x. This is not the same as the already-flagged
   `MAX_CONVERSATION_HISTORY_CHARS` REQ-027/FLOW-005 disagreement (that one
   the spec explicitly flags as ambiguous and unresolved); this is a
   confirmed drift between decided behavior and shipped code that no part
   of the corpus currently flags.

3. **The `SCOPE` / `CONVERSATION HISTORY` order is inverted in the spec
   relative to actual code.** The spec's Prompt-assembly bullet states the
   fixed order ends "...combo context (when eligible) → `CONVERSATION
   HISTORY` (when present) → `SCOPE` → `QUESTION`." `promptAssembly.ts`'s
   `buildPromptText`, read directly, pushes sections in this order:
   `sections.push("", "SCOPE", scopeSentence)` THEN
   `if (conversationHistorySection.length > 0) sections.push("",
   conversationHistorySection)` THEN `sections.push("", "QUESTION", ...)`.
   The real order is `... → combo → SCOPE → CONVERSATION HISTORY (when
   present) → QUESTION` -- `SCOPE` and `CONVERSATION HISTORY` are
   transposed relative to the spec's claim.

None of these three findings are corrected in this slice's diff: the
licensed correction for this slice is exactly the DEC-047/REQ-033 `Backed
by:` addition (applied, see the file diff), and no other content edit.
These findings are reported to the PR as a `Scope or decision update`
comment for the owner to resolve (implement the missing/mismatched behavior,
or correct the spec's claims -- a product decision, not a documentation
formatting choice) in a follow-up package.
