# Quick Lookup — Design Brief

## Summary

One reuse-first Ask AI entry replacing the two separately-refined, never-shipped `card-lookup-qa` and `rules-lookup` packages. The player optionally attaches a single card (typed search or camera scan) and asks a question, or asks a freeform Magic question with no card — both on the same feature-portal destination, same conversation chrome, same conversation limits as the main flow. The backend runs one prompt-assembly path: question-driven rules retrieval always runs; per-card enrichment (rulings, full metadata incl. oracle text, card-scored System 3) layers in only when a card is attached. Off-domain questions get a "confused rules lookup" persona response instead of a direct answer or a generic refusal. Shipped on the existing `POST /api/ask-ai` via a `mode: "lookup"` branch, reached through the feature portal.

## Scope (v1)

- Unified `mode: "lookup"` on `AskAiRequest`, replacing the reserved-but-unshipped `mode: "card"` / `mode: "rules"` split; `card` is optional (REQ-072 / DEC-106).
- Quick Lookup entry as a single feature-portal destination; optional single-card input via existing typed search **and** camera scanner, or skip straight to a question; empty state shows the local core-topics browse fallback (REQ-073 / REQ-079 / DEC-107).
- Lookup-mode backend prompt assembly: always-on question-driven rules retrieval, per-card enrichment added when a card is present, game-state-only sections always omitted (REQ-074 / DEC-107).
- Off-domain / non-MTG guardrail: prompt-instruction-only "confused rules lookup" persona — the model responds as though it searched the rules and found nothing on that "mechanic," and asks whether the user meant something else or misspelled a term (REQ-074 / DEC-108).
- Q&A reusing the shipped conversation thread / follow-up composer / inline processing / start-over, with the attached card (if any) frozen and shared conversation limits (REQ-075 / FLOW-011).

## Non-goals

- No user-staged zones, stack, phase, or other board state.
- No multi-card game setup; at most one card is the context.
- No separate conversation-limit policy from the main MTG Assistant flow.
- No new product-facing backend endpoint (DEC-010) and no `GameContext` change.
- No printing-level identity in the prompt or rulings (scan art stays presentation-only, DEC-053).
- No optional game context on the card branch in v1 (tracked as Q-003).
- Not a full Comprehensive Rules browser; not official judge authority (DEC-002 / DEC-013).
- No answer-seeded second-pass rules retrieval in v1 — tabled during this refinement so it can get a dedicated tuning pass as its own future feature (tracked as Q-004).
- No duplicated enrichment implementations — one branching prompt-assembly path, not two forked modes.

## Key decisions

- **DEC-106** — `AskAiRequest.mode` redefined as `"game" | "lookup"`; `mode: "lookup"` carries `{ question, card?, conversationHistory? }` with an optional card. Replaces DEC-096's `mode: "card"` branch and retires DEC-098's reserved `mode: "rules"` slot before either shipped.
- **DEC-107** — Quick Lookup is a single feature-portal destination (DEC-095) unifying what Card Lookup (DEC-097) and Rules Lookup (DEC-099) would have shipped separately: optional card input, always-on question-driven rules retrieval, per-card enrichment layered in when a card is attached, shared conversation chrome/limits, no forked enrichment implementations.
- **DEC-108** — Off-domain questions get a prompt-instructed "confused rules lookup" persona (not found in the rules, check spelling) rather than a generic capability refusal; no new backend detection code.

## Reconciliation of prior promoted truth

`card-lookup-qa` and `rules-lookup` were refined and promoted into `PRD/sections/` (DEC-096–100, REQ-072–080, FLOW-011/012) before either shipped. This refinement reconciles that truth rather than adding a third parallel copy:

- **DEC-096, DEC-098, DEC-097, DEC-099, DEC-100** → `Status: superseded`, bodies kept (this repo's actual convention, not DEC-lifecycle's literal one-line-tombstone ideal), `Notes:` point to DEC-106 / DEC-107.
- **REQ-072, REQ-073, REQ-074, REQ-075** → rewritten in place under their existing IDs (same convention as REQ-067's DEC-089→DEC-095 merge) to describe the unified Quick Lookup behavior.
- **REQ-079** (core-topics fallback) → dependency swapped from DEC-099 to DEC-107; content otherwise unchanged, since it was never rules-lookup-specific.
- **REQ-076, REQ-077, REQ-078, REQ-080** → replaced with one-line "merged into REQ-0XX" / "descoped, tracked as Q-004" stubs so the IDs stay resolvable without duplicating content.
- **FLOW-011** rewritten in place as the unified flow; **FLOW-012** → one-line stub pointing to FLOW-011.
- **Q-003** reworded for `mode: "lookup"`'s card branch (DEC-107) instead of `mode: "card"` (DEC-097); substance unchanged.
- **New Q-004** tracks the answer-seeded second-pass retrieval (formerly DEC-100) as a deferred, dedicated future feature per explicit user direction during this refinement.
- `PRD/work/suite-build-order/README.md` now points at `quick-lookup` instead of the two old slugs.

## Reuse map (what this feature repackages)

| Existing capability | Reused for Quick Lookup |
|---|---|
| Card search + autocomplete (REQ-001/REQ-002) | Optional single-card input |
| Camera scanner (FLOW-006, DEC-050/DEC-053) | Optional scan input (resolves to one card, not a zone add) |
| Feature portal (DEC-095) | Single entry chrome / destination registry |
| Per-card enrichment: rulings (DEC-029), full metadata incl. oracle text (REQ-030/DEC-042), System-3 supplemental rules (DEC-046/REQ-022) | Layered in when a card is attached |
| Core game-rules topics + System 3 (DEC-045/DEC-046) | Always-on question-driven rules retrieval |
| Committed core-topics browse artifact (REQ-079) | Empty-state fallback |
| Conversation thread + composer + inline processing + start over (REQ-025/026/027/028/029) | Q&A thread, card frozen if attached |
| Provider boundary + mock/OpenAI contract (DEC-020/DEC-017/DEC-038) | Unchanged; lookup mode rides the same `{ answer }` contract |

## Requirements & flows

- REQ-072 — Ask AI lookup-mode request contract
- REQ-073 — Quick Lookup entry and optional single-card input
- REQ-074 — Quick Lookup prompt assembly and domain guardrail
- REQ-075 — Quick Lookup conversation thread
- REQ-079 — Local core-topics browse fallback (dependency updated, content unchanged)
- FLOW-011 — Look up a card or ask a rules question in Quick Lookup
- Q-003 — Future optional lightweight game context on the card branch (out of scope)
- Q-004 — Future dedicated answer-seeded second-pass retrieval feature (out of scope)

## Dependencies & sequencing

- **feature-portal** (DEC-095) — Quick Lookup registers as a destination; land the portal first.
- **Ask AI lookup-mode contract** (DEC-106 / REQ-072) — land with or before this UI.

## Naming note

The wire token `mode: "lookup"` names the *lookup path* ("optionally one card, otherwise just a question, no game state"), distinct from `mode: "game"` (staged game state). The user-facing destination label is **Quick Lookup**.
