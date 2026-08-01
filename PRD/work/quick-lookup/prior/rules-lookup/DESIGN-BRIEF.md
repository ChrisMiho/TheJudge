# rules-lookup — Design Brief

## Summary

A lightweight Ask AI entry for **general rules questions** — no user-staged game
state, no card. The player asks a rules question; the backend runs question-driven
rules enrichment and the AI surfaces the relevant **verbatim** Comprehensive Rules
excerpts plus an explanation. A free, answer-seeded second retrieval pass recovers
any rules the question's wording missed. A small committed local core-topics list
gives a zero-cost "just let me read it" fallback. Ships as a **feature-portal**
destination and reuses Card Lookup's conversation chrome under the same limits as
the main MTG Assistant flow.

## Scope (in)

- Feature-portal destination registration (portal owns nav, DEC-095); no bespoke menu.
- New `mode: "rules"` branch on the existing `POST /api/ask-ai` union (DEC-098):
  `{ mode: "rules", question, conversationHistory? }` — no `gameContext`, no `card`.
- Rules-mode prompt assembly (DEC-100 / REQ-077): MTG reference block (DEC-025) +
  always-on core game-rules topics (DEC-045 core set) + question-driven System 3
  supplemental (DEC-046). Omits game-state-only sections and card rulings.
- Verbatim-fidelity guard: the model quotes only from the provided rule excerpts.
- Answer-seeded second-pass retrieval (DEC-100 / REQ-078): re-query the rule index
  with the model's answer, dedup, append recovered verbatim rules to the plain-text
  `answer`. Single AI call; local re-query only.
- Small committed local core-topics browse fallback (REQ-079), built from the same
  curated `gameRulesByTopic` excerpts (one source of truth).
- Conversation follow-ups reusing shipped chrome under the main flow's limits (REQ-080).

## Scope (out / non-goals)

- Not a full Comprehensive Rules browser; not official judge authority (DEC-002/013).
- No zones, stack, phase, card, or multi-card game setup; no frozen context object.
- No separate conversation-limit policy.
- No new product-facing backend endpoint; no contract change beyond the `mode` union.
- No two-call **regenerate** in v1 (deferred; DEC-100 note) — the answer explanation
  is not rebuilt on the expanded rule set.
- No rules-validation, legality, or board-state behavior under enrichment.
- No structured rules response field — recovered rules are composed into `{ answer }`.

## Key decisions

| ID | Domain | Decision |
|----|--------|----------|
| DEC-098 | providers-and-contract | Add `mode: "rules"` branch (`{ mode, question, conversationHistory? }`) to the DEC-096 union; additive, `{ answer }`/error unchanged. |
| DEC-099 | lookup-suite | Rules Lookup feature: portal destination, conversation chrome reuse under shared limits, AI-mediated primary path, local core-topics browse fallback. |
| DEC-100 | rules-retrieval | Rules-mode enrichment (question-driven core + System 3, no game-state gating, no card rulings) with verbatim surfacing + free answer-seeded second-pass re-query appended to `answer`. Single AI call. |

Consumes existing: DEC-096 (mode union, reserved `"rules"`), DEC-095 (portal),
DEC-097 (Card Lookup conversation chrome), DEC-025/045/046 (rules enrichment),
DEC-038 (`conversationHistory`), DEC-012/030 (static committed artifacts),
DEC-020/010 (frozen contract, single endpoint), DEC-017/033 (mock prompt exposure).

## Requirements

- REQ-076 — Rules Lookup entry and rules-mode request
- REQ-077 — Rules-mode prompt assembly and verbatim rule surfacing
- REQ-078 — Answer-seeded second-pass rule retrieval
- REQ-079 — Local core-topics browse fallback
- REQ-080 — Rules Lookup conversation thread and limits

## Flows

- FLOW-012 — Look up a rules concept and ask a question
- Reuses: FLOW-010 (feature portal), FLOW-003/FLOW-005 (AI-failure / retry handling)

## Open questions

- None new. Two-call regenerate is a deferred follow-up captured in DEC-100 notes;
  core-topic curation is a build-time sign-off (DEC-030 pattern).

## Sequencing notes

- Depends on `feature-portal` (DEC-095) for entry chrome and on the `mode` contract
  (DEC-096/DEC-098). Prefer landing the mode contract and Card Lookup's conversation
  reuse (DEC-097) with or before this UI, per the lookup-suite build order.
