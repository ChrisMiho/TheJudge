---
status: active
---

# rules-lookup

A lightweight Ask AI entry for general rules questions — no game state, no card. The
player asks; the backend runs question-driven rules enrichment and the model surfaces
the relevant **verbatim** Comprehensive Rules excerpts plus an explanation. A free
answer-seeded second pass recovers rules the question missed; a committed local
core-topics list gives a zero-cost browse fallback. Ships as a feature-portal
destination reusing Card Lookup's conversation chrome under the main flow's limits.

See `DESIGN-BRIEF.md` for scope/decisions and `GAMEPLAN.md` for architecture.

## Slices

| Slice | Objective | Depends on | Layer |
| --- | --- | --- | --- |
| [A](slice-a-rules-mode-contract.md) | `mode: "rules"` request branch (Zod + types) | DEC-096 union *(card-lookup-qa Slice A, external)* | backend |
| [B](slice-b-rules-prompt-assembly.md) | Rules-mode prompt + query-based System-3 scorer | A | backend |
| [C](slice-c-answer-seeded-second-pass.md) | Answer-seeded second-pass retrieval, appended to `answer` | B | backend |
| [D](slice-d-core-topics-artifact.md) | Core-topics browse artifact + data build | — (uses `gameRulesByTopic.json`) | data/build |
| [E](slice-e-rules-lookup-view.md) | Rules Lookup view, portal entry, browse UI, conversation (**ship**) | A, D *(+ feature-portal shipped, card-lookup-qa conversation reuse)* | frontend |

**Recommended order:** A and D in parallel → B → C, with E built against A + D and
finished once B + C land. E is the ship/promotion slice.

## Implementation map

- **Contract (A):** `apps/backend/src/validation/askAiRequest.ts`, `types/index.ts`
- **Prompt + scorer (B):** `apps/backend/src/gameRulesRetrieval.ts`,
  `prompt/context.ts`, `prompt/promptAssembly.ts`, `prompt/preparation.ts`
- **Second pass (C):** `apps/backend/src/prompt/preparation.ts` (or
  `prompt/rulesSecondPass.ts`), `routes/askAi.ts`, `prompt/enrichmentDebug.ts`
- **Data (D):** `scripts/build-game-rules.mjs`,
  `apps/frontend/public/data/gameRulesCoreTopics.json`
- **Frontend (E):** `apps/frontend/src/components/RulesLookupApp.tsx`,
  `RulesTopicBrowse.tsx`, `components/portal/destinationRegistry.tsx`,
  `hooks/useAskAiSubmitOrchestration.ts`, `lib/contextFlow/flow.ts`, `types.ts`

## External prerequisites

- **feature-portal (DEC-095) — shipped.** Slice E appends one destination entry.
- **card-lookup-qa (DEC-096/097) — not yet shipped.** Owns the `mode` union Slice A
  extends and the conversation generalization Slice E extends. Prefer landing the mode
  contract and Card Lookup's conversation reuse with or before this work; each rules
  slice notes the fallback if it starts first.

See `IDEA.md` for the original idea.
