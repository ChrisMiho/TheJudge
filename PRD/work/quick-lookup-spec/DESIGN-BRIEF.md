# Design Brief — quick-lookup-spec

## What this produces

Phase A #5 of the docs-refactor gameplan: a current-state feature spec for
Quick Lookup, authored on the DEC-168 template and landed at
`PRD/sections/quick-lookup/README.md`. A feature spec is a derived,
non-authoritative view that consolidates what Quick Lookup does today out of the
existing decision log, functional-requirements, user-flows, system-map, and
screen-layout, so the owner can read one document instead of replaying a
supersession chain. This is documentation/consolidation only — no `apps/` code,
no wire-contract change, no new product decision.

Quick Lookup is the gameplan's first full-backend-path spec: its subject runs
the entire Ask AI backend (validation → branching prompt assembly → retrieval →
provider boundary), so the spec captures that flow in a dedicated section, not
just the `QuickLookupApp.tsx` UI.

## Deliverables

- `PRD/sections/quick-lookup/README.md` — the spec, whole file, on the DEC-168
  template: `Status:` draft/derived/non-authoritative marker, `Backed by:` line,
  **What it is**, **How it works** (behavior grouped by surface, each `Built:`),
  a dedicated **The full backend path** section, **Measured bounds**, **Rejected
  alternatives and deferred scope**, **Where it lives**.
- `PRD/README.md` — one Section Inventory row for `sections/quick-lookup/`
  (navigation only), matching the four prior Phase A spec rows.
- This brief.

## Binding constraints honored

- **Zero new stable IDs.** This is spec #5; specs #2–4 minted none. The spec is
  a derived view that cites existing `DEC`/`REQ`/`FLOW`/`NFR` IDs. No ID is
  added, changed, retired, reordered, or renumbered, and no DEC is added to
  authorize the spec.
- **No existing source body edited.** The only `PRD/sections/` write is the new
  file `PRD/sections/quick-lookup/README.md`. `decisions.md`,
  `decisions/*.md`, `functional-requirements.md`, `user-flows.md`,
  `system-map.md`, and `screen-layout.md` are untouched.
- **Draft and non-authoritative.** The `Status:` marker states a cited
  `DEC`/`REQ`/`FLOW` wins any conflict; `PRD/sections/decisions.md` stays
  precedence #1 and Read-First #1.
- **Q-003 and Q-004 stay open**, folded in as deferred scope, not decided.

## Sources consolidated (`Backed by`)

Current-truth decisions: DEC-020 (provider boundary / frozen contract), DEC-025
(static MTG reference block), DEC-029 (WotC rulings), DEC-042 (full metadata incl
oracle text / prompt budget), DEC-045 (core game-rules topics, game-state topic
gating), DEC-046 (System 3 supplemental retrieval), DEC-095 (feature-portal
registration), DEC-106 (`mode: "lookup"` wire contract), DEC-107 (one branching
enrichment path), DEC-108 (off-domain persona guardrail), DEC-112 (General rules
topics UX / locked pill), DEC-113 (guidance-copy placement), DEC-114
(waiting-panel swap), DEC-118 (answered-state workspace), DEC-017 / DEC-033 (mock
exposes the assembled prompt), DEC-053 (oracle-level scan identity), DEC-160
(pre-submit card image fit).

Rejected-design decisions preserved as closed doors: DEC-096 (`mode: "card"`),
DEC-097 (Card Lookup), DEC-098 (reserved `mode: "rules"`), DEC-099 (Rules
Lookup), DEC-100 (answer-seeded second-pass, deferred to Q-004).

Requirements: REQ-072 (request contract), REQ-073 (entry / optional card),
REQ-074 (prompt assembly + guardrail), REQ-075 (conversation workspace), REQ-079
(topics browse), REQ-091 (locked pill / composition), REQ-092 (submit-wait
swap), REQ-097 / REQ-098 (answered-state presentation & scrolling), REQ-011 (char
cap), REQ-022 (System 3 retrieval), REQ-024 (PHASE GUIDANCE, omitted), REQ-030
(per-card metadata formatting), REQ-129 / REQ-141 (card image fit), REQ-134
(cap/counter ship correction). REQ-076/077/078/080 are merge stubs — cited via
their surviving counterparts (REQ-073/074/075) and, for REQ-078, via Q-004, not
as live requirements.

Flows / NFRs: FLOW-006 (scan engine), FLOW-011 (the merged Quick Lookup flow),
NFR-001 (mobile-first).

## Backend path — verified from source

The full-backend-path section was written from a direct read of the actual
source, not from the requirement summaries alone:

- `apps/backend/src/validation/askAiRequest.ts` — `askAiRequestSchema` is a
  `mode`-discriminated union; absent `mode` defaults to `"game"`; the lookup
  branch is `{ mode: "lookup", question, card?, conversationHistory? }`,
  `.strict()` (so `gameContext` is rejected as an unknown key). `questionSchema`
  is `boundedText(600, 0)` — the 600-char wire bound that carries the composed
  string over the frontend's 300-char raw cap. The lookup card reference is
  oracle-level with no zone/owner/targets/context fields.
- `apps/backend/src/prompt/preparation.ts` + `promptAssembly.ts` —
  `prepareLookupPromptInput` / `buildLookupPromptText` is one path that branches
  on card presence, not a fork. Always runs: static MTG reference block,
  always-on core topics (hard-filtered, not the game-state selector),
  question-scored System 3. Card-attached only: card metadata incl oracle text
  (same per-card formatting), WotC rulings, System 3 also scored on the card's
  oracle text + type line. Game-state-only sections (zone sections, PHASE
  GUIDANCE, System 2 topic gating, zone scope sentence) are structurally absent —
  the lookup assembler never calls those builders.
- `context.ts` / `mtgReference.ts` / `phaseGuidance.ts` —
  `buildLookupPromptContext` carries only question + optional card + optional
  history, no fallback question; `MTG_PROMPT_REFERENCE` is a bounded static
  constant used in both modes; `getPhaseGuidance` is used only by the game path.
- `apps/backend/src/gameRulesRetrieval.ts` — System 3 is IDF-scored keyword
  retrieval, curated core-topic rule ids excluded, small capped result set;
  lookup query = question tokens always, card oracle/type tokens only when a card
  is attached. Always-on core set is a fixed four topics.
- `apps/backend/src/providers/*` — `AskAiProvider.generateAnswer` consumes the
  assembled prompt text and never inspects `mode`; `ASK_AI_PROVIDER` selects
  mock (default, returns the assembled prompt) or OpenAI (live). Lookup adds no
  provider behavior of its own.
- Off-domain guardrail (DEC-108) — a single instruction line in the lookup
  INSTRUCTIONS block; grep of `prompt/` confirms no classifier, validator, or
  detection branch. Goldens under `eval/fixtures/quick-lookup-{card,no-card,
  off-domain}` pin the wording.

## Material assumptions (assumption ladder)

Per `preparation-contract.md`, resolved from the first authoritative source; no
new product decision introduced.

1. **Structure of the backend-path section.** The package README left the exact
   shape to refinement. Chose a dedicated `## The full backend path (request →
   assembly → retrieval → provider → response)` H2 section, analogous to the
   scan spec's `## How scan feeds each destination` cross-cutting section.
   Evidence: DEC-168 template + the scan-spec precedent (ladder rung 3,
   established local pattern). Reversible and additive.
2. **Superseded rejected-design IDs listed in `Backed by`.** DEC-096/097/098/099/
   100 are consolidated as closed doors, so they appear in `Backed by` alongside
   the superseding IDs — matching the scan spec, which lists superseded geometry
   IDs (e.g. DEC-158) in its `Backed by`. Ladder rung 3.
3. **No `data/` corpus split.** Quick Lookup cites no external Magic-data corpus
   of its own; the shared `gameRulesCoreTopics.json` build artifact is covered by
   rules-retrieval machinery, per the gameplan's "machinery, not a feature spec"
   test. So no `Corpus:` header line and no `data/` files, unlike trade-balancer
   and scan. Ladder rung 1 (package README states this directly).

No genuine decision blocker was hit. Every ambiguity resolved from an existing
source under the ladder; no fork in current-state truth was unresolvable.

## Non-goals

No product-behavior decision. No `apps/` code change. No edit to any existing
DEC/REQ/FLOW/NFR body. No resolution of Q-003 or Q-004. No new stable ID.

## Intake

- `PRD/work/quick-lookup-spec/intake/refactor-gameplan.md` — staged
  docs-refactor gameplan. Evidence only, not authority; recorded as a citation
  and not opened, per the refinement contract's intake rule.
