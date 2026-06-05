# overview.md

## Summary
MTG Stack Assistant is a mobile-first web application for Magic: The Gathering players.

Its purpose is to help users:
- search for cards quickly
- capture relevant game context before asking a rules question
- add selected cards to relevant zones, including the stack when applicable
- ask a contextual question about the game state or stack
- receive a plain-text AI explanation of the likely interaction

## Product Positioning
This product is:
- an assistant
- a stack-focused gameplay aid
- a flow-validation tool in its current core product form

This product is not:
- an official judge
- a deterministic rules engine
- a full board-state simulator

## Current Product Status
The core product validates one primary hypothesis:

**Players will use a lightweight stack assistant if it is fast to use during real gameplay.**

The shipped baseline includes staged zone flow, `GameContext`, and plain-text answers. Local development uses `ASK_AI_PROVIDER=mock` by default, while live answer generation is available through `ASK_AI_PROVIDER=openai` under `DEC-020`.

The product intentionally keeps context structured but lightweight:
- game context (player count, life totals, active player when known, and turn phase)
- selected zone checklist with phase-driven defaults
- selected cards grouped by zone, with ordered stack positioning when stack is populated
- per-card context fields (caster, context targets, optional notes, optional mana spent with fallback for stack cards)
- optional user question
- no full legality validation

Intentional constraints are tracked in `goals-and-non-goals.md`.

## Product Principles
- rely on explicit user-provided context rather than inferred hidden state
- do not infer hidden state
- keep the backend intentionally small
- validate usefulness before adding complexity
- separate product scope from agent workflow rules

## Key Constraints
- mobile-first UI
- single main backend endpoint
- plain-text response
- static local metadata file
- mock-default local provider mode with optional live OpenAI provider mode
