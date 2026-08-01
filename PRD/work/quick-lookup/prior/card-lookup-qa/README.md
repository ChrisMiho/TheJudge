---
status: active
---

# card-lookup-qa

Single-card lookup plus question and follow-ups, with the same backend card enrichment and conversation limits as main Ask AI — no user-staged game context.

- Decisions: DEC-096 (`mode` discriminator on `POST /api/ask-ai`), DEC-097 (reuse map); amends DEC-020, sibling of DEC-095 (feature-portal)
- Requirements: REQ-072, REQ-073, REQ-074, REQ-075
- Flow: FLOW-011 — out of scope: Q-003 (optional lightweight game context on card mode)
- See `DESIGN-BRIEF.md` for refined scope, `GAMEPLAN.md` for architecture + verification checklist.

## Sequence (lookup suite)

1. **Depends on** `feature-portal` (DEC-095) for entry chrome — registers as a destination, ships no nav of its own. **External prerequisite for Slice C.**
2. **Shares** Ask AI mode contract (`mode: "card"`) on existing `POST /api/ask-ai` with `rules-lookup` (`mode: "rules"`). Land the mode contract before or with this UI.
3. **Ships before** `rules-lookup` UI (card metadata and search/scan already exist on the client; highest player familiarity).

## Slices

| Slice | Objective | Depends on | Requirements |
| --- | --- | --- | --- |
| [A](slice-a-mode-contract.md) | `mode`-discriminated `AskAiRequest` (`game` default / `card`) — backend contract + validation only | — | REQ-072, DEC-096 |
| [B](slice-b-card-prompt.md) | Card-mode prompt assembly — reuse rulings + full metadata + System-3, omit game-state-only sections | A | REQ-074, DEC-097 |
| [C](slice-c-lookup-view.md) | Card Lookup view + portal entry: single-card search/scan input, presentation, conversation reuse; ship (PRD promotion + ship gates) | A, `feature-portal` (external) | REQ-073, REQ-075, FLOW-011, DEC-097, DEC-095 |

Order: A first; B and C parallel-ready after A (C also needs `feature-portal` merged, and a full mock E2E needs B). C is the ship/promotion slice.

## Implementation map

- Contract: `apps/backend/src/validation/askAiRequest.ts`, `apps/backend/src/types/index.ts`
- Prompt: `apps/backend/src/prompt/{context,promptAssembly,preparation}.ts`
- Frontend: `apps/frontend/src/components/portal/destinationRegistry.tsx`, `CardLookupApp.tsx` (new), `ZoneCardPicker.tsx` (factor input core), `hooks/useAskAiSubmitOrchestration.ts`, `lib/contextFlow/flow.ts`, `types.ts`

See `IDEA.md` for the original idea.
