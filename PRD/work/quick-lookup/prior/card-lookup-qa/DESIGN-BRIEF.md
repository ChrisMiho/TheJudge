# Card Lookup — Design Brief

## Summary

A reuse-first lightweight Ask AI entry: the player looks up **one** card (typed search or camera scan), reads its oracle text, asks a question, and gets an answer in the same conversation chrome the main flow uses — with the **single card frozen** as context and no user-staged game state. The backend runs the **same per-card enrichment** the main flow already applies. Shipped on the existing `POST /api/ask-ai` via a `mode` discriminator, and reached through the feature portal.

## Scope (v1)

- New `mode` discriminator on `AskAiRequest`; `mode: "card"` carries a single-card reference and no `gameContext` (REQ-072 / DEC-096).
- Card Lookup entry as a feature-portal destination; single-card input via existing typed search **and** camera scanner (REQ-073 / DEC-097).
- Card-mode backend prompt assembly reusing existing rulings + full-metadata + System-3 enrichment helpers, omitting game-state-only sections (REQ-074).
- Q&A reusing the shipped conversation thread / follow-up composer / inline processing / start-over, with the single card frozen and shared conversation limits (REQ-075 / FLOW-011).

## Non-goals

- No user-staged zones, stack, phase, or other board state.
- No multi-card game setup; exactly one card is the context.
- No separate conversation-limit policy from the main MTG Assistant flow.
- No new product-facing backend endpoint (DEC-010) and no `GameContext` change.
- No printing-level identity in the prompt or rulings (scan art stays presentation-only, DEC-053).
- No optional game context on card mode in v1 (tracked as Q-003).

## Key decisions

- **DEC-096** — `mode` discriminator on the existing endpoint; `game` (default, back-compat) vs `card` (single card, no `gameContext`). Additive amendment to the DEC-020 frozen contract, same pattern as DEC-038. The union is the extensible scaffold for a possible future contextual card lookup (Q-003).
- **DEC-097** — Card Lookup is a feature-portal destination (portal owns nav, DEC-095), reuses existing search + scanner as single-card input, reuses conversation chrome with the single card frozen and shared limits, and reuses the same backend per-card enrichment helpers while omitting game-state-only prompt sections.

## Reuse map (what this feature repackages)

| Existing capability | Reused for Card Lookup |
|---|---|
| Card search + autocomplete (REQ-001/REQ-002) | Typed single-card input |
| Camera scanner (FLOW-006, DEC-050/DEC-053) | Scan single-card input (resolves to one card, not a zone add) |
| Feature portal (DEC-095) | Entry chrome / destination registry |
| Per-card enrichment: rulings (DEC-029), full metadata incl. oracle text (REQ-030/DEC-042), System-3 supplemental rules (DEC-046/REQ-022) | Card-mode prompt enrichment |
| Conversation thread + composer + inline processing + start over (REQ-025/026/027/028/029) | Q&A thread with single card frozen |
| Provider boundary + mock/OpenAI contract (DEC-020/DEC-017/DEC-038) | Unchanged; card mode rides the same `{ answer }` contract |

## Requirements & flows

- REQ-072 — Ask AI request mode discriminator
- REQ-073 — Card Lookup entry and single-card input
- REQ-074 — Card-mode prompt assembly
- REQ-075 — Card Lookup conversation thread
- FLOW-011 — Look up one card and ask a question
- Q-003 — Future optional lightweight game context on card mode (out of scope)

## Dependencies & sequencing

- **feature-portal** (DEC-095) — Card Lookup registers as a destination; land the portal first.
- **Ask AI mode contract** (DEC-096 / REQ-072) — land with or before this UI.
- Ships before `rules-lookup` UI, which reuses this feature's conversation chrome and adds `mode: "rules"`.

## Naming note

The wire token `mode: "card"` names the *lookup mode* ("one card, no game state"), distinct from `mode: "game"` (staged game state) and the reserved `mode: "rules"`. The user-facing label is **Card Lookup**. Kept as `"card"` to match the sibling suite docs (feature-portal, rules-lookup).
