# GAMEPLAN — prompt-game-state-enrichment

## Summary

Add `gameStateNotes` freeform field to `GameContext` for cross-card, global game-state context the LLM cannot infer from submitted card oracle text. Wire it through backend validation → prompt assembly, and surface it in the frontend enrichment step as a collapsible dropdown. Also improve `contextNotes` UI placeholder on stack items to guide users toward per-card transient annotations.

## Architecture

### Data flow

```
Frontend (GameContext.gameStateNotes)
  → POST /api/ask-ai (gameContext.gameStateNotes: optional string)
  → Backend Zod validation (gameContextSchema, control-char guardrails, 2000-char cap; blank accepted then omitted)
  → buildPromptContext() → PromptContext.gameContext.gameStateNotes
  → buildPromptText() → "ADDITIONAL GAME STATE" section
      positioned: after GENERAL GAME CONTEXT, before PHASE GUIDANCE
      omitted: when absent or blank after trim
```

### Prompt section position (DEC-043)

```
MTG REFERENCE
GENERAL GAME CONTEXT
ADDITIONAL GAME STATE        ← new, conditional
PHASE GUIDANCE
ZONE: STACK ...
ZONE: BATTLEFIELD ...
...
GAME RULES (reference)
ADDITIONAL RELEVANT RULE EXCERPTS
OFFICIAL RULINGS
SCOPE
QUESTION
```

### Files touched

**Backend:**
- `apps/backend/src/validation/askAiRequest.ts` — add `gameStateNotes` to `gameContextSchema`
- `apps/backend/src/types/index.ts` — add `gameStateNotes?: string` to `PromptContext.gameContext`
- `apps/backend/src/prompt/context.ts` — extract + normalize `gameStateNotes` into `PromptContext`
- `apps/backend/src/prompt/normalization.ts` — `formatGameStateNotesSection()` + `buildPromptText()` integration
- `apps/backend/src/validation/askAiRequest.test.ts` — new validation tests
- `apps/backend/src/prompt/normalization.test.ts` — new section tests
- `apps/backend/src/eval/contextEvaluationHarness.ts` — new eval check IDs
- `apps/backend/src/eval/fixtures/game-state-notes.fixture.json` — new fixture
- `apps/backend/src/eval/fixtures/game-state-notes.prompt.golden.txt` — new golden

**Frontend:**
- `apps/frontend/src/types.ts` — add `gameStateNotes?: string` to `GameContext`
- `apps/frontend/src/App.tsx` — `gameStateNotes` state + prop wiring
- `apps/frontend/src/components/EnrichmentStep.tsx` — collapsible dropdown + contextNotes placeholder update

## Verification checklist

- [ ] `npm run quality:check` green in both `apps/backend` and `apps/frontend`
- [ ] Validation rejects `gameStateNotes` with control characters
- [ ] Validation accepts absent, blank-trimmed, and non-empty `gameStateNotes`
- [ ] `ADDITIONAL GAME STATE` section appears in prompt when `gameStateNotes` is non-empty after trim
- [ ] `ADDITIONAL GAME STATE` section is absent when `gameStateNotes` is absent or blank
- [ ] Section is positioned after `GENERAL GAME CONTEXT` and before `PHASE GUIDANCE` in prompt text
- [ ] Eval harness passes for existing fixtures (section absent, position check does not regress)
- [ ] Eval harness passes for new `game-state-notes` fixture (section present, correct position)
- [ ] Frontend collapsible is collapsed by default; expanding reveals textarea
- [ ] Stack item `contextNotes` placeholder shows named transient card-level annotations
- [ ] `npm run prompt:preview` output includes `ADDITIONAL GAME STATE` for fixtures with `gameStateNotes`
