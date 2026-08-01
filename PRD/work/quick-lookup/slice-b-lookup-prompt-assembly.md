# Slice B — Lookup-mode prompt assembly and domain guardrail

## Status: done

## Goal

For `mode: "lookup"`, assemble one branching backend prompt: always-on
question-driven rules retrieval, per-card enrichment layered in only when a card
is attached, every game-state-only section omitted, and an off-domain "confused
rules lookup" persona guardrail always active (REQ-074 / DEC-107 / DEC-108).

## Requirements

1. Refactor the System-3 scorer in `apps/backend/src/gameRulesRetrieval.ts` to be
   query-based rather than `PromptContext`-only: extract
   `buildQueryTokensFromParts({ questionText, oracleText })` as the shared token
   builder (the existing `buildQueryParts` logic); keep `buildQueryTokens(context)`
   as a thin adapter that computes `{ questionText, oracleText }` from a
   `PromptContext` and delegates to it (**no behavior change for game mode** —
   same IDF weighting, question/keyword boosts, exact/parent rule-ID bonuses,
   tie-break). Add `retrieveRulesForQuery(queryTokens, queryRuleIds, index,
   excludeRuleIds, max, resources)` (+ a `…WithDebug` variant) holding the
   scoring/sort/slice core that `scoreIndex` currently does inline;
   `retrieveSupplementalRules(context, …)` / `retrieveSupplementalRulesWithDebug`
   become thin wrappers that build tokens from `context` and delegate.
2. Add `buildLookupPromptContext(request: Extract<AskAiRequest, { mode: "lookup"
   }>)` in `apps/backend/src/prompt/context.ts` (or a sibling module) producing a
   small context: `{ finalQuestion, card?: LookupPromptCard, conversationHistory?
   }`. Reuse `normalizeQuestion` for the question and the same per-field
   normalizers `normalizeZoneItem` uses (oracle text, mana cost/value, type line,
   colors, supertypes, subtypes) for `card`. No fallback-question logic — a blank
   lookup question is a frontend-blocked case (REQ-073), not a backend concern
   here.
3. Add `buildLookupPromptText(context, options)` in
   `apps/backend/src/prompt/promptAssembly.ts` assembling, in order:
   - `SYSTEM ROLE PREAMBLE` — reuse `SYSTEM_ROLE_PREAMBLE_LINES`.
   - `INSTRUCTIONS` — the existing three shared guardrail lines, **plus** the
     verbatim-fidelity guard (quote rule text only from the provided GAME RULES /
     ADDITIONAL RELEVANT RULE EXCERPTS sections; present the genuinely relevant
     excerpts verbatim with an explanation; never invent rule numbers or text),
     **plus** the DEC-108 off-domain guardrail (treat unrecognized/off-domain
     terms as "not found in the rules corpus"; ask the user to check spelling or
     rephrase toward a Magic term; never answer the off-domain question
     directly) — both new lines are always present, card or no card.
   - `MTG REFERENCE` — `MTG_PROMPT_REFERENCE`.
   - `GAME RULES (reference)` — always-on core topics via `formatGameRulesSection`.
   - `ADDITIONAL RELEVANT RULE EXCERPTS` — via `formatSupplementalRulesSection`.
   - a new single-card section (label it distinctly from `ZONE: *`, e.g. `CARD
     (looked up)`) **only when `context.card` is present**, built by calling
     `formatZoneCardMetadataLines` (existing per-card formatter, REQ-030) with
     `targets: []` (a lookup card never has targets) and no `contextNotes`.
   - `OFFICIAL RULINGS` — via `formatOfficialRulingsSection`, **only when
     `context.card` is present**.
   - `CONVERSATION HISTORY` — via `formatConversationHistorySection`, when present.
   - `QUESTION` — `context.finalQuestion`.
   It **omits unconditionally**: `GENERAL GAME CONTEXT`, `PHASE GUIDANCE`, all
   zone sections, and the `SCOPE` sentence — lookup mode never carries game
   state, card or no card.
4. Branch `preparePromptInput` (`apps/backend/src/prompt/preparation.ts`) on
   `request.mode === "lookup"`:
   - core topics = `allGameRulesTopics.filter(topic =>
     ALWAYS_ON_TOPIC_IDS.includes(topic.id))` (import `ALWAYS_ON_TOPIC_IDS` from
     `gameRulesTopicSelection.ts`; do **not** call `selectGameRulesTopics`, which
     reads game-state signals lookup mode doesn't have).
   - `curatedRuleIds = collectCuratedRuleIds(coreTopics)` (existing helper,
     unchanged).
   - rulings: when `card` present, `resolveRulingsForPrompt([{ cardId:
     card.cardId, name: card.name }], cardRulingsIndex, limits[, debug])` — build
     the one-item array directly; no need to route through
     `collectCardsForRulings` (that helper is `PromptContext`-shaped and
     game-mode-specific). When no card, empty rulings (existing zero-cards
     shape).
   - supplemental = `retrieveRulesForQuery(...)` (Requirement 1's new function),
     with query tokens from `buildQueryTokensFromParts({ questionText:
     request.question, oracleText: card ? \`${card.oracleText} ${card.typeLine}\`
     : "" })`, excluding `curatedRuleIds`.
   - call `buildLookupPromptText` (Requirement 3) instead of `buildPromptText`.
   - `getPromptDiagnostics` and `enrichmentDebug` construction reuse the same
     helpers the game-mode path uses today, fed lookup-mode inputs.
5. `routes/askAi.ts` requires no new branching — it already calls
   `preparePromptInput(parsed.data, options)` generically for any `AskAiRequest`;
   confirm this stays true (no `request.gameContext` access anywhere in the route
   handler outside logging, which already optional-chains).
6. Success `{ answer }` and error response shapes are unchanged; mock provider
   lookup-mode responses expose the exact assembled prompt via the existing
   `buildMockAnswer(preparedPrompt.promptText, ...)` path — no separate mock
   wiring needed.
7. No answer-seeded second-pass retrieval — do not implement anything resembling
   DEC-100's re-query step (deferred, Q-004).

## Acceptance criteria

- [ ] Lookup-mode prompt (no card) includes: `SYSTEM ROLE PREAMBLE`,
      `INSTRUCTIONS` (incl. verbatim-fidelity + off-domain guardrail lines),
      `MTG REFERENCE`, `GAME RULES (reference)` with exactly the
      `ALWAYS_ON_TOPIC_IDS` topics, `ADDITIONAL RELEVANT RULE EXCERPTS` when any
      score > 0, `QUESTION`; omits `GENERAL GAME CONTEXT`, `PHASE GUIDANCE`, any
      `ZONE:` section, `SCOPE`, `CARD (looked up)`, `OFFICIAL RULINGS`.
- [ ] Lookup-mode prompt (card attached) additionally includes `CARD (looked
      up)` with the card's full metadata + oracle text (same field set/format as
      a populated-zone card minus targets/context notes) and `OFFICIAL RULINGS`
      when the card has WotC rulings data; supplemental retrieval is scored
      against question + card oracle text/type line (assert via a fixture where
      a card-only keyword surfaces a rule the question text alone would not).
- [ ] `CONVERSATION HISTORY` appears when `conversationHistory` is present, in
      the same position/format as game mode.
- [ ] Game-mode prompt output is byte-for-byte unchanged (existing
      `promptAssembly.test.ts` / `promptDiagnostics.test.ts` / eval goldens pass
      with zero diffs) — the query-based scorer refactor must be behavior-neutral
      for game mode.
- [ ] `retrieveSupplementalRules(context, ...)` (game mode's entry point)
      produces identical output to before the refactor for existing fixtures.
- [ ] Mock provider (`ASK_AI_PROVIDER=mock`) lookup-mode response `answer`
      contains the exact assembled lookup prompt text.
- [ ] `npm --workspace apps/backend run test:eval` green with no game-mode
      golden drift; new lookup-mode eval fixtures (no card, card attached,
      off-domain question) added and passing.

## Verification

```bash
npm --workspace apps/backend run test -- src/prompt
npm --workspace apps/backend run test -- src/gameRulesRetrieval.test.ts
npm --workspace apps/backend run test:eval
```

## Files touched

- `apps/backend/src/gameRulesRetrieval.ts`
- `apps/backend/src/gameRulesRetrieval.test.ts`
- `apps/backend/src/prompt/context.ts`
- `apps/backend/src/prompt/context.test.ts`
- `apps/backend/src/prompt/promptAssembly.ts`
- `apps/backend/src/prompt/promptAssembly.test.ts`
- `apps/backend/src/prompt/preparation.ts`
- `apps/backend/src/eval/contextEvaluationHarness.ts` (extend fixture/check
  handling to tolerate `mode: "lookup"` requests — several existing checks like
  `general-game-context-section` and `system2-conditional-selection` assume
  `gameContext`; gate them to game-mode fixtures or add lookup-specific checks)
- `apps/backend/src/eval/fixtures/*.fixture.json` / `*.golden.json` (new
  lookup-mode fixtures: no-card question, card-attached question, off-domain
  question)

## Notes

- Depends on Slice A for the `AskAiRequest` union and `lookupCardReferenceSchema`
  shape.
- The off-domain guardrail (DEC-108) is prompt-instruction-only — do not add
  backend detection, classification, or validation logic. Wording is a
  build-time content concern and may be tuned as long as the "not found in the
  rules" persona and no-direct-answer behavior hold.
- `formatZoneCardMetadataLines` already exists precisely for this kind of reuse
  (REQ-030) — do not re-implement per-card formatting.
