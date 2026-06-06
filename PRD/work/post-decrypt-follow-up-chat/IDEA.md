# Idea: Post-Decrypt Follow-Up Chat

## Problem

After a user submits **Decrypt Stack**, TheJudge returns a single plain-text answer and the enrichment step becomes terminal. Submit controls, the optional question field, and navigation back to zones are hidden. There is no way to:

- Ask follow-up questions about the ruling
- Clarify game-state details the model may have misread
- Correct the assistant when it misunderstood the interaction

Users must mentally carry the answer forward or abandon the flow and rebuild context from scratch.

## Desired Outcome

After the first successful decrypt, users can continue a lightweight chat with the agent:

1. The UI shows a **conversation thread** whose **first message is the assistant's ruling** (not the user's initial decrypt question or fallback prompt).
2. Users can send **text follow-ups** to clarify, question, or correct the assistant.
3. **Game context is frozen** after the first decrypt — zones, cards, and enrichment fields are locked; follow-ups do not allow board-state edits in v1.
4. Conversation state lives **only in the current browser session** — no server-side threads, no saved sessions.

Each follow-up reuses the frozen `gameContext` and sends prior turns as structured history so the model can reason about corrections in context.

## Non-Goals

- Editing zones, cards, or enrichment during follow-up chat (v1)
- Server-side conversation IDs or persistence across page reloads
- New product-facing backend endpoints
- OpenAI native multi-message `input` array refactor (v1 keeps single `promptText`)
- Re-decrypt with updated context without starting over
- Account system, billing, or cross-device sync

## Decomposition Intent

Ship as incremental slices: contract + prompt first, then frontend orchestration, then chat UI, then test closeout. Each slice should be independently verifiable before the next.
