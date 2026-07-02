# goals-and-non-goals.md

## Goals

### GOAL-001
- Title: Help players understand stack interactions quickly
- Description: The primary goal is to reduce friction when players need guidance on stack interactions during gameplay.

### GOAL-002
- Title: Keep the core product fast and lightweight
- Description: The core product should optimize for speed of use, structured lightweight context, and simple implementation.

### GOAL-003
- Title: Reach production readiness for a first deployment
- Description: Refine and harden the existing core loop (lightweight game context capture, zone cards when needed, question, and AI response) to production-ready quality so the app can be deployed and gather real user feedback. The original core-loop hypothesis is considered validated (past MVP); the focus is now refinement toward deployment, not proving the loop (`DEC-080`).

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
- app-wide CSS decorative-motion and visual-feedback baseline with reduced-motion support (DEC-079, REQ-059, NFR-006)

## Intentional constraints
- duplicate-card blocking is a temporary product constraint, not a gameplay rule
- stack size is capped at 10 cards to reduce token use and abuse risk
- the product does not implement a deterministic rules engine or full board-state simulator
- plain-text answers are used before advanced formatting polish
- runtime metadata syncing is out of scope
- camera scanning is out of the **core product loop**, but is a scoped, optional, frontend-only input feature (DEC-050)

## Planned capabilities (optional, outside the core loop)
- optional on-device camera card scanning as an alternate input path into existing zone fields (DEC-050..DEC-053); see `system-map.md` "Card scanning" (status: planned)
- frontend-only theme palette customization as browser-local personalization, using predefined swatches rather than arbitrary color input (DEC-066, REQ-044); see `system-map.md` "Frontend personalization" (status: planned)
- optional global Chunky / Slim layout density as browser-local personalization in the theme panel (DEC-075, REQ-055); see `system-map.md` "Frontend personalization"

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
- runtime metadata syncing
- dependency-heavy or performance-harming animation systems, and motion that ignores `prefers-reduced-motion` (decorative CSS motion itself is in scope per DEC-079, NFR-006; this non-goal narrows the prior blanket "animation-heavy UI" exclusion)
- multiple product-facing backend endpoints
- printing disambiguation, grading, pricing, or multi-card-per-frame detection in card scanning (DEC-053)
- arbitrary theme color input, per-component theme overrides, server-synced theme preferences, account-based theme settings, and dark/light mode redesign for theme customization (DEC-066)
- server-synced layout-density preferences, account-based density settings, viewport locking, and sticky-footers redesign for layout compaction (DEC-075, DEC-076)

## Scope Notes
The core product is a **rules assistant** that helps players navigate MTG rules, not an official judge or a deterministic/gameplay-accurate rules engine.
Some constraints are temporary and intentionally narrow.
