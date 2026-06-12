---
name: prompt-game-state-enrichment
description: Adds gameStateNotes freeform field to GameContext and improves contextNotes UI guidance for transient card state
metadata:
  type: project
---

# DESIGN-BRIEF — prompt-game-state-enrichment

## Scope

Add one freeform optional field (`gameStateNotes`) to `GameContext` and a corresponding backend prompt section (`ADDITIONAL GAME STATE`) for cross-card, transient game-state context the LLM cannot infer from submitted card oracle text. Improve `contextNotes` UI placeholder copy on stack items to guide users toward per-card transient annotations.

## Problem being solved

AI feedback identified 6 categories of missing prompt context:

1. Active continuous and replacement effects
2. Target legality flags (protection, hexproof, shroud, uncounterable)
3. Current priority holder during stack resolution
4. Alternative or additional casting costs used (kicker, buyback, X value)
5. Board state specifics (counters, tapped status)
6. Pending delayed triggered abilities

Categories 2, 4, and 5 — when tied to a specific submitted card — are already addressable via the existing `contextNotes` field on `ZoneCardItem`. The gap is categories that are cross-card or not attributable to a single submitted card: global replacement effects, priority holder, pending delayed triggers, casting restrictions.

## Decisions

- **DEC-043** — `gameStateNotes` is a single freeform string on `GameContext`, not structured sub-fields per category. Live gameplay entry speed is the dominant constraint; freeform captures all 6 categories without form friction.

## Requirements

- **REQ-031** (new) — `gameStateNotes?: string` on `GameContext`; backend emits `ADDITIONAL GAME STATE` section after `GENERAL GAME CONTEXT` and before `PHASE GUIDANCE` when non-empty after trim; section omitted entirely when absent or blank; no character length cap (control-character guardrails only); UI surface is a collapsible dropdown within the context collection step — collapsed by default, expanding reveals the optional textarea with example placeholder copy.
- **REQ-017** (amended) — `contextNotes` UI for stack items gains placeholder copy that names transient card-level annotations: kicker or buyback paid, X value used, counters added this turn, tapped status, gained abilities this turn.

## Non-goals

- No structured sub-fields (`priorityHolder`, `activeEffects[]`, `pendingTriggers[]`)
- No new per-card fields beyond existing `contextNotes`
- No prompt-format redesign
- No real-time CR retrieval
- No wizard flow redesign

## PRD sections updated

- `sections/decisions.md` — DEC-043 added
- `sections/functional-requirements.md` — REQ-031 added; REQ-017 amended
- `sections/integrations-and-data.md` — `GameContext` model updated; prompt assembly rules updated

## Open questions

None.
