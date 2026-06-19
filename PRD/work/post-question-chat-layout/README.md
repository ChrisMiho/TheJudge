status: active

# Post-Question Chat Layout

This work package captures a layout refinement for the answered/follow-up question state.

## Slice table

| Slice | Status | Objective | Dependencies | Primary verification |
| --- | --- | --- | --- | --- |
| A | planned | Add a reusable read-only frozen context summary for answered-state display. | None | `npm --workspace apps/frontend run test -- App.test.tsx` |
| B | planned | Integrate the compact answered-state layout and preserve follow-up chat behavior. | Slice A | `npm run quality:check` |

## Implementation map

- `apps/frontend/src/components/EnrichmentStep.tsx` owns the answered/follow-up state and should render the compact summary before `ConversationThread`.
- `apps/frontend/src/components/ConversationThread.tsx` remains responsible only for visible chat bubbles; the frozen game context summary is separate setup content.
- A new component may live under `apps/frontend/src/components/` if that keeps summary formatting isolated from enrichment editing controls.
- `apps/frontend/src/App.test.tsx` should cover answered-state layout, frozen summary placement/expansion, read-only behavior, and preserved follow-up/start-over behavior.
- No backend, provider, prompt, or request/response contract files are in scope.

## PRD alignment

- Implements `REQ-025` and `FLOW-005` layout changes for the post-decrypt state.
- Preserves `REQ-026`, `REQ-027`, `REQ-028`, `REQ-029`, `DEC-038`, `DEC-039`, `DEC-040`, and `DEC-041`.
- Cleanup should promote shipped reality to durable PRD sections and remove this work folder.
