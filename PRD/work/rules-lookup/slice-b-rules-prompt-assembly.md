# Slice B — Rules-mode prompt assembly + query-based System-3

## Status: planned

## Goal

Assemble the rules-mode prompt (MTG reference + always-on core topics + question-scored
System-3 supplemental, with a verbatim-fidelity guard; no game-state sections, no card
rulings) and refactor the DEC-046 System-3 scorer to be query-based so one
authoritative matcher serves game, card, and rules modes (DEC-100 / REQ-077).

## Requirements

1. Refactor `gameRulesRetrieval.ts` so scoring accepts a **query** (tokens + rule IDs),
   not a `PromptContext`: extract `buildQueryTokensFromParts`, add
   `buildQueryTokensFromText(text, source)`, and add
   `retrieveRulesForQuery(...)` / `retrieveRulesForQueryWithDebug(...)` holding the
   scoring/sort/slice core. `retrieveSupplementalRules(context, …)` and its debug
   variant delegate — **no scoring behavior change for game/card mode** (same IDF
   weighting, question/keyword boosts, exact/parent rule-ID bonuses, tie-break).
2. Add `buildRulesPromptContext(request)` producing a rules PromptContext
   (`{ finalQuestion, conversationHistory? }`, no `gameContext`).
3. Add `buildRulesPromptText(context, options)` reusing shared formatters. It includes,
   in order: `SYSTEM ROLE PREAMBLE`, `INSTRUCTIONS` **with a verbatim-fidelity guard**
   (quote rule text only from the provided rule sections; present the genuinely
   relevant excerpts verbatim with an explanation; never invent rule numbers or text),
   `MTG REFERENCE`, `GAME RULES (reference)` (core topics), `ADDITIONAL RELEVANT RULE
   EXCERPTS` (question-scored supplemental), `CONVERSATION HISTORY` (when present),
   `QUESTION`. It **omits** `GENERAL GAME CONTEXT`, `PHASE GUIDANCE`, zone sections,
   the `SCOPE` sentence, and `OFFICIAL RULINGS`.
4. `preparePromptInput` branches on `request.mode === "rules"`: core topics =
   `allGameRulesTopics` filtered to `ALWAYS_ON_TOPIC_IDS` (reuse the exported constant,
   **not** `selectGameRulesTopics`); `curatedRuleIds = collectCuratedRuleIds(coreTopics)`;
   supplemental = `retrieveRulesForQuery` on the **question** tokens excluding
   `curatedRuleIds`; no rulings. It returns the first-pass rule-ID set (core +
   supplemental) and a `rulesMode` marker on `PreparedPromptInput` for Slice C.
5. The mock provider exposes the exact assembled rules-mode prompt and enrichment debug
   via the existing `buildMockAnswer` path (DEC-017 / DEC-033); success `{ answer }` /
   error shapes and plain-text output (REQ-013) are unchanged. No rules-validation,
   legality, or board-state behavior (DEC-002 / DEC-013).

## Acceptance criteria

- [ ] The rules-mode prompt contains `MTG REFERENCE`, `GAME RULES (reference)` (the
      four `ALWAYS_ON_TOPIC_IDS` topics), an `ADDITIONAL RELEVANT RULE EXCERPTS` section
      when the question scores rules, the verbatim-fidelity guard line, and `QUESTION`.
- [ ] The rules-mode prompt contains **no** `GENERAL GAME CONTEXT`, `PHASE GUIDANCE`,
      zone sections, `SCOPE`, or `OFFICIAL RULINGS`.
- [ ] Supplemental retrieval for rules mode scores on the **question text only**
      (no zone/oracle inputs) and dedups against the core rule IDs.
- [ ] `retrieveSupplementalRules` output for existing game/card fixtures is unchanged
      (query-based refactor is behavior-preserving) — existing
      `gameRulesRetrieval.test.ts` stays green.
- [ ] `PreparedPromptInput` exposes `rulesMode` and the first-pass rule-ID set for a
      rules request.
- [ ] With `ASK_AI_PROVIDER=mock` a rules request's `answer` contains the assembled
      rules-mode prompt; `enrichmentDebug` exposes the question-scored supplemental
      selections/runner-ups.
- [ ] `npm --workspace apps/backend run test` and `npm run test:eval` green.

## Verification

```bash
npm --workspace apps/backend run test -- gameRulesRetrieval
npm --workspace apps/backend run test -- promptAssembly
npm --workspace apps/backend run test
npm run test:eval
node scripts/prompt-preview.mjs   # spot-check a rules-mode prompt (mock)
```

## Files touched

- `apps/backend/src/gameRulesRetrieval.ts` — query-based scorer refactor
  (`buildQueryTokensFromParts`, `buildQueryTokensFromText`, `retrieveRulesForQuery` +
  debug); delegate `retrieveSupplementalRules*`
- `apps/backend/src/gameRulesRetrieval.test.ts` — query-based unit tests + game-mode
  parity regression
- `apps/backend/src/prompt/context.ts` — `buildRulesPromptContext`
- `apps/backend/src/prompt/promptAssembly.ts` — `buildRulesPromptText` (+ verbatim guard)
- `apps/backend/src/prompt/promptAssembly.test.ts` — rules-mode section present/omitted
- `apps/backend/src/prompt/preparation.ts` — rules-mode branch; `rulesMode` +
  first-pass rule-ID set on `PreparedPromptInput`
- eval fixtures/harness — a rules-mode scenario asserting core-topic presence and
  question-driven supplemental recall (REQ-032 / DEC-047 extension)

## Notes

- Depends on **Slice A** (rules request shape + `mode` discriminator).
- Reuse the existing scorer internals — the refactor keeps a **single authoritative
  matcher** (DEC-100); do not fork a rules-only scorer.
