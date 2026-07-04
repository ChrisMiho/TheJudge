# overview.md

## Summary
TheJudge is a mobile-first web application for Magic: The Gathering players — an MTG assistant with a suite of features that help at the table.

Its primary feature, **MTG Assistant**, helps users:
- search for cards quickly
- capture relevant game context before asking a rules question
- add selected cards to relevant zones, including the stack when applicable
- ask a contextual question about the game state or stack
- receive a plain-text AI explanation of the likely interaction

Other features (optional or planned) sit alongside MTG Assistant — for example card scanning as an alternate input path, browser-local personalization, and a Card Trade Balancer.

## Product Positioning
This product is:
- an MTG assistant with a suite of player-help features
- a stack-focused gameplay aid via the MTG Assistant feature
- not limited to a single rules-only loop

This product is not:
- an official judge
- a deterministic rules engine
- a full board-state simulator

## Current Product Status
The primary MTG Assistant loop is considered validated (past MVP):

**Players will use a lightweight MTG assistant if it is fast to use during real gameplay.**

The shipped baseline includes the MTG Assistant staged zone flow, `GameContext`, plain-text answers, card scanning, and personalization. The app is deployed to production on AWS-provided URLs and runs the live OpenAI provider (`DEC-084`); the focus now is gathering real user feedback and refining the suite. Local development continues to use `ASK_AI_PROVIDER=mock` by default under `DEC-020`.

MTG Assistant intentionally keeps context structured but lightweight:
- game context (player count, life totals, active player when known, and turn phase)
- selected zone checklist with phase-driven defaults
- selected cards grouped by zone, with ordered stack positioning when stack is populated
- per-card context fields (caster, context targets, optional notes, optional mana spent with fallback for stack cards)
- optional user question
- no full legality validation

Beyond MTG Assistant, a standalone **Card Trade Balancer** is a planned optional feature: a frontend-only, ephemeral two-sided card-value comparison (static-snapshot USD prices, per-entry printing + foil + quantity), reached via a top-level navigation menu that switches between it and the MTG Assistant flow (DEC-087, DEC-089). It adds no backend endpoint or prompt/contract change.

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
