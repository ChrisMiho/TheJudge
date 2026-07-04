# Slice B — Card-mode prompt assembly

## Status: planned

## Goal

For `mode: "card"`, assemble a prompt for the single looked-up card that reuses the same per-card enrichment the game flow applies (rulings, full metadata incl. oracle text, System-3 supplemental rules) and omits every game-state-only section, returning the same `{ answer }` contract (REQ-074).

## Requirements

1. The card-mode prompt includes the looked-up card's full metadata + oracle text using the **same per-card formatting** as populated-zone cards (REQ-030), plus that card's WotC rulings (DEC-029), reusing the existing helper functions (single authoritative definitions — no re-implementation).
2. The card-mode prompt includes System-3 supplemental rules (DEC-046 / REQ-022) scored against the single card + question.
3. The card-mode prompt includes the `QUESTION` and, when present, the `CONVERSATION HISTORY` section (REQ-027) using existing placement rules.
4. The card-mode prompt **omits** zone sections, `PHASE GUIDANCE` (REQ-024), System-2 game-state topic gating (DEC-045), and the merged zone `SCOPE` sentence (DEC-025) — card mode carries no game state.
5. Success `{ answer }` and error shapes unchanged; plain-text answer preserved (REQ-013). Mock provider exposes the exact assembled card-mode prompt (DEC-017 / DEC-038).
6. Backend-only; no `AskAiRequest` change beyond Slice A; no new endpoint; no rules-validation/legality/board-state behavior added under card enrichment.

## Acceptance criteria

- [ ] A `mode: "card"` request produces a prompt containing the card's oracle text + full metadata (same per-card block as a populated-zone card), its rulings section, and a System-3 supplemental-rules section.
- [ ] The same prompt contains **no** zone sections, **no** `PHASE GUIDANCE`, **no** System-2 curated `GAME RULES` game-state gating, and **no** merged zone `SCOPE` sentence.
- [ ] `QUESTION` is present; when `conversationHistory` is sent, `CONVERSATION HISTORY` appears with existing placement/formatting.
- [ ] With `ASK_AI_PROVIDER=mock`, a card-mode response's `answer` contains the exact assembled card-mode prompt.
- [ ] Game-mode prompts are byte-identical to `main` (existing goldens/eval unchanged); rulings + System-3 helpers are the same functions used by the game flow.
- [ ] Success/error response shapes unchanged for both providers.

## Verification

```bash
npm --workspace apps/backend run test -- prompt
npm --workspace apps/backend run test -- mockAskAi
npm run test:eval
npm --workspace apps/backend run typecheck
```

## Files touched

- `apps/backend/src/prompt/context.ts` — card-mode `buildPromptContext` path producing a single-card `PromptContext` (or card-mode analog) with the question; no game-state normalization
- `apps/backend/src/prompt/promptAssembly.ts` — gate zone sections, `PHASE GUIDANCE`, and `SCOPE` off for card mode; keep MTG reference, rulings, System-3, history, question
- `apps/backend/src/prompt/preparation.ts` — branch `preparePromptInput` on mode: card mode skips `selectGameRulesTopics` (System-2) + zone/phase inputs, keeps `resolveRulingsForPrompt` + `retrieveSupplementalRules` + diagnostics
- `apps/backend/src/prompt/promptAssembly.test.ts`, `apps/backend/src/prompt/context.test.ts` — card-mode section presence/omission
- `apps/backend/src/mockAskAi.test.ts` — mock exposes assembled card-mode prompt
- `apps/backend/src/eval/` fixtures — add a card-mode fixture asserting rulings + System-3 present and zone/phase/scope absent (extend the harness minimally; no live provider calls)

## Notes

- The card reference feeds `collectCardsForRulings` and the System-3 retrieval context the same way a populated-zone card does; adapt the collection helpers to accept the single card rather than duplicating scoring logic.
- Keep the card-mode branch a thin gate over shared helpers; the game-mode path must stay untouched.
- Depends on **Slice A** for the `mode: "card"` request shape.
