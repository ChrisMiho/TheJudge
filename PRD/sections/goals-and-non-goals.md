# goals-and-non-goals.md

## Goals

### GOAL-001
- Title: Help players understand stack interactions quickly
- Description: The primary goal is to reduce friction when players need guidance on stack interactions during gameplay.

### GOAL-002
- Title: Keep MVP1 fast and lightweight
- Description: The first version should optimize for speed of use, structured lightweight context, and simple implementation.

### GOAL-003
- Title: Validate the core product loop
- Description: The team should prove that users will search for cards, build a stack, ask a question, and use the AI response.

## Success Metrics
- user can add a card to the stack in under 5 seconds
- user can complete a full Decrypt Stack flow in under 20 seconds
- AI response latency is under 3 seconds in normal conditions
- users can retry without losing stack/question state
- users can correct card selection quickly when suggestions are ambiguous

## MVP1 In-Scope Outcomes
- typed card lookup
- autocomplete with local metadata
- card preview before add
- add-to-stack flow
- visual stack icon with count
- stack details panel with remove capability
- optional question input
- pre-stack game context capture (player count + life totals)
- optional battlefield-context step with explicit skip
- per-stack-entry context enrichment (caster/targets/notes/mana spent fallback)
- Decrypt Stack submit flow
- plain-text AI response
- mock-first integration path
- one main backend endpoint

## Explicit Non-Goals
- official judge-grade rulings
- deterministic rules engine behavior
- full board-state modeling
- controller selection
- mode selection
- multiplayer sync
- saved sessions
- account system
- billing
- camera scanning in MVP1
- runtime metadata syncing
- animation-heavy UI
- multiple product-facing backend endpoints

## Scope Notes
MVP1 is a **flow-validation MVP**, not a gameplay-accurate MVP.
Some simplifications are temporary and intentionally narrow.
