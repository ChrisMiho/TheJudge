status: active

# Post-Decrypt Follow-Up Chat

Parent work package for ephemeral multi-turn chat after a successful Decrypt Stack response.

## Problem summary

After Decrypt Stack, users currently hit a dead end: one plain-text answer, no way to ask follow-ups, clarify context, or correct a misunderstanding without starting over.

## Confirmed product choices (from ideation)

| Decision | Choice |
| --- | --- |
| Context after decrypt | **Frozen** — zones/cards/enrichment locked; follow-ups are text-only |
| Thread UX | **Full chat thread** — first visible message is the assistant's initial answer, not the user's decrypt question |
| Persistence | **Ephemeral in-session only** — aligns with "no saved sessions" non-goal |

## Implementation map

| Slice | Name | Status | Depends on |
| --- | --- | --- | --- |
| A | API Contract (types + Zod + validation tests) | done | — |
| B | Backend Prompt Assembly | done | A |
| C | Frontend Conversation Hook | done | A |
| D | Frontend Chat UI | done | C |
| E | Tests + Closeout | done | A, B, C, D |

Slice A is the unblocker. Once A lands, slices B and C are parallel-ready; D requires C, and E requires all implementation slices.

## Related PRD sections

- `sections/decisions.md` — DEC-020, DEC-021, DEC-038 through DEC-041
- `sections/integrations-and-data.md` — `POST /api/ask-ai` payload and response contract
- `sections/user-flows.md` — FLOW-001 (decrypt), FLOW-003 (retry), FLOW-005 (follow-up chat)
- `sections/goals-and-non-goals.md` — one endpoint, no saved sessions
- `sections/functional-requirements.md` — REQ-019, REQ-025 through REQ-029
- `apps/frontend/src/components/EnrichmentStep.tsx` — current post-answer terminal UX
- `apps/backend/src/prompt/normalization.ts` — prompt assembly

## Docs in this folder

- `IDEA.md` — problem, desired outcome, non-goals
- `DESIGN-BRIEF.md` — technical scope, API shape, UX, slices, risks
- `GAMEPLAN.md` — architecture, data flow, file map, verification checklist
- `slice-a-api-contract.md` — backend types + Zod + validation tests
- `slice-b-backend-prompt.md` — CONVERSATION HISTORY section, budget cap, diagnostics
- `slice-c-frontend-hook.md` — frozen context, history assembly, follow-up submit paths
- `slice-d-frontend-ui.md` — chat thread, composer, frozen summary, start over
- `slice-e-tests-closeout.md` — App.test.tsx update, prompt-preview fixture, ship gates
