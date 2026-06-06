status: ideation

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

## Sub-slices (to be defined during refinement)

- **Slice A** — PRD decision + API contract: optional `conversationHistory` on `POST /api/ask-ai`
- **Slice B** — Backend prompt: `CONVERSATION HISTORY` section, budget caps, validation
- **Slice C** — Frontend conversation hook: frozen context snapshot, history assembly, follow-up submit
- **Slice D** — Frontend chat UI: thread, follow-up composer, read-only context, start-over
- **Slice E** — Tests + closeout: contract/prompt/App tests, optional prompt-preview fixture

## Related PRD sections

- `sections/decisions.md` — DEC-020, DEC-021 (contract freeze; amendment needed)
- `sections/integrations-and-data.md` — `POST /api/ask-ai` payload and response contract
- `sections/user-flows.md` — FLOW-001 (decrypt), FLOW-003 (retry)
- `sections/goals-and-non-goals.md` — one endpoint, no saved sessions
- `sections/functional-requirements.md` — REQ-019
- `apps/frontend/src/components/EnrichmentStep.tsx` — current post-answer terminal UX
- `apps/backend/src/prompt/normalization.ts` — prompt assembly

## Docs in this folder

- `IDEA.md` — problem, desired outcome, non-goals
- `DESIGN-BRIEF.md` — technical scope, API shape, UX, slices, risks (draft for refinement)
