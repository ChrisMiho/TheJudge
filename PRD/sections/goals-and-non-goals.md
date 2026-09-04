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
- markdown-rendered AI answers in the shared conversation thread (wire contract remains a plain string; DEC-123, REQ-102)
- mock-first integration path
- one main backend endpoint, plus the read-only card-detail retrieval route (`GET /api/cards/:oracleId`, REQ-175)
- app-wide CSS decorative-motion and visual-feedback baseline with reduced-motion support (DEC-079, REQ-059, NFR-006)
- predefined browser-local palette personalization hosted in the feature-portal Menu (DEC-066, DEC-110, REQ-044)
- In-Depth Question and Quick Question destinations, both reusing the shipped conversation/thread behavior
- shared chat-first conversation workspace with adaptive context, reader-safe auto-scroll, full-bleed thread presentation, docked pill composer, and browser-local resumable history (DEC-117, DEC-118, DEC-123..DEC-127, REQ-096..REQ-098, REQ-102..REQ-105)
- feature-portal top-left corner-rail Menu with full-height shell-docked sliding tray (visible-bounds on tall shells, matching bottom-left radius), centered brand block, and in-flow step-name eyebrow (DEC-122, DEC-133)
- AWS production deployment with live OpenAI, automated quality-gated deploys, backend-only secret loading, and cost/scale guardrails (DEC-084)

## Intentional constraints
- duplicate-card blocking is a temporary product constraint, not a gameplay rule
- stack size is capped at 10 cards to reduce token use and abuse risk
- the product does not implement a deterministic rules engine or full board-state simulator
- answer wire format stays a plain markdown string; schema-enforced answer shapes are out of scope (DEC-123)
- runtime metadata syncing is out of scope
- camera scanning is out of the **core product loop**, but is a scoped, optional, frontend-only input feature (DEC-050)

## Planned capabilities (optional, outside the core loop)
- optional on-device camera card scanning as an alternate input path into existing zone fields (DEC-050..DEC-053); see `system-map.md` "Card scanning" (status: planned)
- backend-only **Commander Spellbook combo enrichment**: a human-approved static community combo corpus used only for complete contextual matches or narrow explicit combo questions, with deterministic identity/quantity/zone matching, labeled missing pieces, and per-ingredient card state surfaced but never verified (DEC-116, DEC-161, REQ-093..REQ-095, REQ-146); see `system-map.md` "Commander Spellbook combo retrieval" (status: planned)

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
- saved sessions outside the narrowly scoped browser-local conversation history (DEC-124; capped, single-device, no accounts)
- account system
- billing
- runtime metadata syncing
- dependency-heavy or performance-harming animation systems, and motion that ignores `prefers-reduced-motion` (decorative CSS motion itself is in scope per DEC-079, NFR-006; this non-goal narrows the prior blanket "animation-heavy UI" exclusion)
- arbitrary/expanding product-facing endpoints beyond the answer endpoint and the single read-only card-detail retrieval route (REQ-175)
- grading and multi-card-per-frame detection in card scanning (DEC-053)
- pricing and printing disambiguation remain out of the **card-scanning** feature (DEC-053), but are **in scope for the Trade Balancer** as a static-snapshot USD value aid and printing picker (DEC-087); this narrows the prior blanket pricing/printing-disambiguation exclusion — live/real-time price sync stays out of scope
- live/real-time card price sync, price history, marketplace/transaction handling, and automated "suggest cards to balance" logic in the Trade Balancer (DEC-087)
- arbitrary theme color input outside the Colorless-only custom RGB exception in DEC-119/REQ-099, per-component theme overrides, server-synced theme preferences, account-based theme settings, and dark/light mode redesign for theme customization (DEC-066, DEC-119)
- user-visible layout/profile overrides, saved layout preferences, UA-sniffed or JavaScript-selected device modes, separate mobile/desktop component trees, viewport locking, fixed-to-viewport chat composers, and sticky-footer redesign outside the shared conversation workspace (DEC-117, DEC-118)
- visible Known Combos panels, a combo browser/portal destination, find-my-combos deck analysis, bracket estimation, runtime Commander Spellbook calls, a public combo mirror, and deterministic combo legality/executability validation (DEC-116)
- automated answer-quality gating in `npm run quality:check`: combo enrichment's effect on answers is measured by an opt-in, human-reviewed live-provider A/B that never blocks a build, and a general answer-quality baseline across the whole fixture corpus stays separate scope (DEC-161)

## Scope Notes
TheJudge is an **MTG assistant with a suite of features** that help players — not an official judge or a deterministic/gameplay-accurate rules engine. **In-Depth Question** (the staged game-context + Ask AI feature, internally `mtg-assistant`) is the primary feature; Quick Question and other tools sit alongside it (`DEC-094`).
Some constraints are temporary and intentionally narrow.
