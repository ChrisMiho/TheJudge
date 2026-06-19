# Post-Question Chat Layout Design Brief

## Scope

Refine the post-decrypt answered state so the follow-up chat uses less vertical space and presents frozen game context as setup for the conversation. The screen should keep the brand header to `TheJudge`, remove redundant answered-state headings, place the frozen context summary above the conversation thread, and keep the follow-up composer below the thread.

## Approved design

- The answered/follow-up state header shows only `TheJudge`; redundant subtitle copy such as `Stack Assistant` and the separate `Conversation` heading are removed from this state.
- A compact read-only frozen context summary appears above the conversation thread.
- The compact summary highlights turn phase, active player when known, and populated zones with card names.
- The summary includes a disclosure arrow/control that expands to show the full frozen game context, including setup, zones, cards, and enrichment details.
- The expanded content remains read-only because game context is frozen for the active conversation.

## Decisions

- This is a frontend presentation change only.
- Existing frozen-context semantics from `DEC-040` remain unchanged.
- The post-decrypt conversation continues to start with the assistant's answer as the first visible message.

## Non-goals

- No AI response formatting changes.
- No backend prompt, request, response, provider, or conversation-history contract changes.
- No new editing path for frozen game context during an active conversation.
- No redesign of the pre-decrypt zone collection or enrichment flow.

## PRD references

- Updates `REQ-025` with the slimmer post-decrypt layout and expandable frozen-context summary.
- Updates `FLOW-005` so the frozen context appears before the thread and can be expanded before or during follow-up use.
- Preserves `REQ-026`, `REQ-027`, `REQ-028`, `REQ-029`, `DEC-038`, `DEC-039`, `DEC-040`, and `DEC-041` behavior.
