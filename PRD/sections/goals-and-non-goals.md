# goals-and-non-goals.md

## Goals

### GOAL-001
- Title: Help players understand stack interactions quickly
- Description: The primary goal is to reduce friction when players need guidance on stack interactions during gameplay.

### GOAL-002
- Title: Keep the core product fast and lightweight
- Description: The core product should optimize for speed of use, structured lightweight context, and simple implementation.

### GOAL-003
- Title: Operate the first production deployment and gather feedback
- Description: Keep the deployed core loop reliable, inexpensive, and secure while gathering real user feedback. The original core-loop hypothesis is validated (past MVP), and the first AWS production deployment is live (`DEC-084`).

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
- predefined browser-local palette personalization hosted in the feature-portal Menu (DEC-066, DEC-110, REQ-044)
- In-Depth Question and Quick Question destinations, both reusing the shipped conversation/thread behavior
- AWS production deployment with live OpenAI, automated quality-gated deploys, backend-only secret loading, and cost/scale guardrails (DEC-084)

## Intentional constraints
- duplicate-card blocking is a temporary product constraint, not a gameplay rule
- stack size is capped at 10 cards to reduce token use and abuse risk
- the product does not implement a deterministic rules engine or full board-state simulator
- plain-text answers are used before advanced formatting polish
- runtime metadata syncing is out of scope
- camera scanning is out of the **core product loop**, but is a scoped, optional, frontend-only input feature (DEC-050)

## Planned capabilities (optional, outside the core loop)
- optional on-device camera card scanning as an alternate input path into existing zone fields (DEC-050..DEC-053); see `system-map.md` "Card scanning" (status: planned)
- automatic fluid responsive presentation replacing the shipped user-selected density workaround, plus one shared chat-first conversation workspace with adaptive context, reader-safe auto-scroll, and focused motion (DEC-117, DEC-118, REQ-096..REQ-098)
- standalone **Card Trade Balancer**: a two-sided, frontend-only, ephemeral card-value comparison (per-entry printing + foil toggle + quantity, scan or manual-search input, static-snapshot USD prices) reached via a top-level navigation menu (DEC-087, DEC-088, DEC-089; REQ-064..REQ-067); see `system-map.md` "Trade balancer" and "App navigation" (status: planned)

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
- grading and multi-card-per-frame detection in card scanning (DEC-053)
- pricing and printing disambiguation remain out of the **card-scanning** feature (DEC-053), but are **in scope for the Trade Balancer** as a static-snapshot USD value aid and printing picker (DEC-087); this narrows the prior blanket pricing/printing-disambiguation exclusion — live/real-time price sync stays out of scope
- live/real-time card price sync, price history, marketplace/transaction handling, and automated "suggest cards to balance" logic in the Trade Balancer (DEC-087)
- arbitrary theme color input, per-component theme overrides, server-synced theme preferences, account-based theme settings, and dark/light mode redesign for theme customization (DEC-066)
- user-visible layout/profile overrides, saved layout preferences, UA-sniffed or JavaScript-selected device modes, separate mobile/desktop component trees, viewport locking, fixed-to-viewport chat composers, and sticky-footer redesign outside the shared conversation workspace (DEC-117, DEC-118)

## Scope Notes
TheJudge is an **MTG assistant with a suite of features** that help players — not an official judge or a deterministic/gameplay-accurate rules engine. **In-Depth Question** (the staged game-context + Ask AI feature, internally `mtg-assistant`) is the primary feature; Quick Question and other tools sit alongside it (`DEC-094`).
Some constraints are temporary and intentionally narrow.
