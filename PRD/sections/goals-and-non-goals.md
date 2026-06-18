# goals-and-non-goals.md

## Goals

### GOAL-001
- Title: Help players understand stack interactions quickly
- Description: The primary goal is to reduce friction when players need guidance on stack interactions during gameplay.

### GOAL-002
- Title: Keep the core product fast and lightweight
- Description: The core product should optimize for speed of use, structured lightweight context, and simple implementation.

### GOAL-003
- Title: Validate the core product loop
- Description: The team should prove that users will capture lightweight game context, add relevant zone cards when needed, ask a question, and use the AI response.

## Success Metrics
- user can add a card to the stack in under 5 seconds
- user can complete a full Decrypt Stack flow in under 20 seconds
- AI response latency is under 3 seconds in normal conditions
- users can retry without losing stack/question state
- users can correct card selection quickly when suggestions are ambiguous

## Shipped capabilities
- typed card lookup
- autocomplete with local metadata
- card preview before add
- per-zone card collection
- visual stack icon with count
- stack details panel with remove capability
- optional question input
- game context capture (player count, life totals, active player, turn phase)
- zone confirmation with phase-driven defaults
- per-card context enrichment (caster/targets/notes/mana spent fallback where relevant)
- card-gated submit flow requiring at least one selected-zone card
- Decrypt Stack submit flow
- plain-text AI response
- mock-first integration path
- one main backend endpoint

## Intentional constraints
- duplicate-card blocking is a temporary product constraint, not a gameplay rule
- stack size is capped at 10 cards to reduce token use and abuse risk
- the product does not implement a deterministic rules engine or full board-state simulator
- plain-text answers are used before advanced formatting polish
- runtime metadata syncing and camera scanning are out of scope

## Product risks
- **Prompt size vs AI latency:** Game-rules prompt enrichment (DEC-030, REQ-022) materially increases prompt size (~25–32k chars typical/worst case when all 23 curated topics ship). This is an active risk to the 3-second latency success metric, not a temporary scope tradeoff. Monitor after ship.
- **Mitigation (planned):** context-driven System 2 topic selection (DEC-045) reduces baseline prompt size for phase-irrelevant requests; ship and re-sample p50/p95 after implementation. `MAX_PROMPT_CHAR_BUDGET` remains at `EFFECTIVELY_UNLIMITED_CHARS` (DEC-042) during tuning; revisit cap values after latency/cost sampling.

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
- camera scanning
- runtime metadata syncing
- animation-heavy UI
- multiple product-facing backend endpoints

## Scope Notes
The core product is a **flow-validation assistant**, not a gameplay-accurate rules engine.
Some constraints are temporary and intentionally narrow.
