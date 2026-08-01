---
status: active
---

# quick-lookup

One portal destination for short MTG asks: optional single-card context or freeform Magic question, reuse-first Ask AI enrichment, MTG-only guardrail. Supersedes the former separate `card-lookup-qa` and `rules-lookup` packages.

See `IDEA.md` for problem/outcome, `DESIGN-BRIEF.md` for scope, and `GAMEPLAN.md` for architecture.

## Decisions & requirements

- DEC-106 (`mode` discriminator), DEC-107 (Quick Lookup unification), DEC-108 (off-domain guardrail)
- REQ-072/073/074/075/079, FLOW-011
- Out of scope: Q-003 (optional game context on the card branch), Q-004 (answer-seeded second-pass retrieval)

## Slices

| Slice | Objective | Depends on | Status |
| --- | --- | --- | --- |
| [A](slice-a-mode-contract.md) | Lookup-mode request contract: `mode: "game" \| "lookup"` union, optional card reference (REQ-072 / DEC-106) | — | done |
| [B](slice-b-lookup-prompt-assembly.md) | Lookup-mode prompt assembly, query-based System-3 refactor, off-domain guardrail (REQ-074 / DEC-107 / DEC-108) | A | done |
| [C](slice-c-core-topics-artifact.md) | Core-topics browse artifact, derived from `gameRulesByTopic.json` (REQ-079) | — | done |
| [D](slice-d-quick-lookup-view.md) | Quick Lookup entry: portal destination, optional single-card input, core-topics empty state (REQ-073) | A, C | done |
| [E](slice-e-conversation-thread.md) | Conversation thread + generalized submit orchestration, ship slice (REQ-075 / FLOW-011) | A, B, D | done |

A and C are independent foundations (parallel-ready); B and D depend on A (and D on C) and can run in parallel with each other; E lands last and is the ship/promotion slice.

## Implementation map

| Area | Path |
| --- | --- |
| Request contract + card reference schema | `apps/backend/src/validation/askAiRequest.ts`, `apps/backend/src/types/index.ts` |
| Lookup prompt context + assembly | `apps/backend/src/prompt/context.ts`, `apps/backend/src/prompt/promptAssembly.ts`, `apps/backend/src/prompt/preparation.ts` |
| Query-based System-3 scorer | `apps/backend/src/gameRulesRetrieval.ts` |
| Eval harness + fixtures | `apps/backend/src/eval/contextEvaluationHarness.ts`, `apps/backend/src/eval/fixtures/` |
| Core-topics data build | `scripts/build-game-rules.mjs`, `apps/frontend/public/data/gameRulesCoreTopics.json` |
| Quick Lookup view | `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx` |
| Destination registry | `apps/frontend/src/components/portal/destinationRegistry.tsx` |
| Submit orchestration + payload builder | `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`, `apps/frontend/src/lib/contextFlow/flow.ts` |
| Reused chrome (not touched, only consumed) | `ConversationThread.tsx`, `CardSelectionPreview.tsx`, `CardPresentation.tsx`, `ScanCameraSurface.tsx`, `useScanCapture.ts`, `useAutocompleteSuggestions.ts` |

## Prior context (superseded)

`prior/card-lookup-qa/` and `prior/rules-lookup/` are retained planning artifacts only — not active slices. They informed this GAMEPLAN's reuse maps and architecture but describe a two-destination split this work reconciles into one. Cleanup of `PRD/work/quick-lookup/` deletes this whole tree including `prior/`.

`PRD/work/suite-build-order/README.md` should point at `quick-lookup` instead of the old slugs — verify during Slice E's PRD promotion step.
