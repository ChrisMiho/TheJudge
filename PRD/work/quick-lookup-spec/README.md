---
status: ideation
---

# quick-lookup-spec

Write the current-state feature spec for Quick Lookup — Phase A #5 of the
docs-refactor gameplan. Land it at `PRD/sections/quick-lookup/README.md` on
the DEC-168 template (the pattern `sections/life-tracker/README.md`,
`sections/user-feedback/README.md`, `sections/trade-balancer/README.md`, and
`sections/scan/README.md` already established for Phase A #1–#4). Quick
Lookup is the gameplan's first full-backend-path spec: it runs the entire
Ask AI backend (prompt assembly, retrieval, provider boundary), so the spec
must capture that flow, not just the `QuickLookupApp.tsx` UI. Consolidates
current behavior only; kept draft and non-authoritative, with
`decisions.md` staying precedence #1.

## Backing sources (evidence, not yet read into a spec)

- `PRD/sections/decisions/lookup-suite.md` — the domain file. DEC-097 (Card
  Lookup, superseded) and DEC-099 (Rules Lookup, superseded) are the
  rejected two-destination design; DEC-107 (confirmed) is the current
  one-destination Quick Lookup shape; DEC-108 (off-domain "confused rules
  lookup" persona guardrail), DEC-112 (General rules topics
  rename/reorder/pill-lock UX), DEC-113 (guidance-copy placement), DEC-114
  (initial-submit waiting-panel swap) refine it further, all confirmed
- `PRD/sections/decisions/providers-and-contract.md` — DEC-106 (`mode:
  "game" | "lookup"` wire contract; `mode: "lookup"` carries `{ question,
  card?, conversationHistory? }`, replacing DEC-096's `mode: "card"` and
  retiring DEC-098's reserved `mode: "rules"` slot) and DEC-020 (provider
  modularity / mock-default / OpenAI live-provider boundary that every
  mode, including lookup, runs through)
- `PRD/sections/functional-requirements.md` — REQ-072 (mode/wire contract),
  REQ-073 (entry layout: optional card-attach, then Question field, then
  General rules topics), REQ-074 (branching prompt assembly + off-domain
  guardrail), REQ-075 (conversation thread reuse), REQ-079 (General rules
  topics local browse fallback), REQ-091 (locked-phrase pill composition,
  amended by REQ-134's raw-text cap/counter correction), REQ-092 (initial-
  submit waiting-panel swap). REQ-076/077/078/080 are merge stubs — each
  reads "merged into REQ-0xx" and points at its surviving counterpart; cite
  the survivor, not the stub, in the spec.
- `PRD/sections/user-flows.md` — FLOW-011 ("Look up a card or ask a rules
  question in Quick Lookup"), the merged flow absorbing former FLOW-012;
  also the combo-retrieval branch (lookup mode requires explicit combo
  intent **and** an attached card, cross-referenced against the Commander
  Spellbook system-map entry below)
- `PRD/sections/system-map.md` — the "## Quick Lookup" block (unified
  short-form destination, `mode: "lookup"` branch, always-on rules
  retrieval, per-card enrichment layering, shared `ConversationWorkspace`,
  General rules topics disclosure, raw-text cap/counter, waiting-panel
  swap) with its `Lives in:` line naming both frontend and backend paths;
  also the `## Ask AI conversation workspace`, `## Adaptive context
  overlay`, `## Commander Spellbook combo enrichment` (lookup-mode combo
  branch), and `## Feature portal & navigation` entries (routing:
  `/quick-lookup`, `React.lazy` boundary, shared scan `manualChunks` group)
  that Quick Lookup's UI participates in without owning
- `PRD/sections/screen-layout.md` — "#### Quick Question — pre-submit" (card
  image fit/containment bound, REQ-129/REQ-141/DEC-160) and "#### Quick
  Question — answered workspace" (shared conversation-workspace rules)
- `PRD/sections/open-questions.md` — Q-003 (optional lightweight game
  context on the `card` field, deferred) and Q-004 (answer-seeded
  second-pass retrieval, deferred to a dedicated future feature); both stay
  open, not decided by this spec
- `apps/backend/src/providers/README.md` — the provider boundary's own
  doc: interface contract (`AskAiProvider.generateAnswer`), mock-default
  behavior, `ASK_AI_PROVIDER` flag, OpenAI runtime config
  (`OPENAI_MODEL`/`OPENAI_TIMEOUT_MS`/`OPENAI_MAX_RETRIES`)

## The full backend path (the part beyond the UI)

Quick Lookup is the gameplan's first spec whose subject runs the entire Ask
AI backend rather than a frontend-only surface. Evidence of the path to
capture, in request order:

- **Validation** — `apps/backend/src/validation/askAiRequest.ts`; the
  `mode: "lookup"` branch of the discriminated union (DEC-106), including
  the `questionSchema` 600-character bound (REQ-134's ship correction,
  distinct from the frontend's 300-character raw-text display cap)
- **Prompt assembly** — `apps/backend/src/prompt/`: `preparation.ts` and
  `promptAssembly.ts` (the branching path DEC-107 specifies: always-on
  question-driven rules retrieval; per-card enrichment — WotC rulings
  (DEC-029), full metadata including oracle text (DEC-042/REQ-030) —
  layered in only when a card is attached; game-state-only sections always
  omitted since lookup mode never carries game state), `context.ts`,
  `mtgReference.ts` (the static MTG reference block, DEC-025), and
  `phaseGuidance.ts` (confirming what lookup mode omits)
- **Retrieval** — `apps/backend/src/gameRulesRetrieval.ts`; System 3
  supplemental rules retrieval (DEC-046), scored on the question alone or
  on question + card when one is attached; always-on core game-rules
  topics (DEC-045 core set)
- **Provider boundary** — `apps/backend/src/providers/`: `askAiProvider.ts`
  (interface), `createAskAiProvider.ts` (mock/OpenAI selection via
  `ASK_AI_PROVIDER`), `mockAskAiProvider.ts` (default, exposes the
  assembled prompt for inspection per DEC-017/DEC-033), and
  `openAiResponsesProvider.ts` (live path, DEC-020) — identical for lookup
  mode and game mode; Quick Lookup adds no provider-boundary behavior of
  its own
- **Off-domain guardrail** — DEC-108's "confused rules lookup" persona is
  prompt-instruction-only, enforced inside prompt assembly, not a separate
  validation or classification step
- Golden regression coverage: `apps/backend/src/eval/fixtures/quick-lookup-*`
  (card / no-card / off-domain fixtures with their context and prompt
  goldens, from the original build receipt)

The later spec must give this path its own section (or equivalent
structure) — request → branching prompt assembly → retrieval → provider
call → response — rather than describing Quick Lookup only as a UI screen
with a one-line "backend does the rest" gloss. The exact shape is an
authoring decision for refinement, not decided here.

## Rejected alternatives (the reconciliation the spec must not silently drop)

Quick Lookup did not ship as designed. Card Lookup (DEC-097) and Rules
Lookup (DEC-099) were refined and confirmed as two separate feature-portal
destinations, each with its own wire mode and its own forked backend
enrichment path, before either shipped. Quick-lookup refinement reconciled
them into one destination, one wire mode (`mode: "lookup"`, DEC-106), and
one branching (not forked) enrichment path (DEC-107) — a real measured
rejection (duplicated surface area for no product benefit, drift risk
between two prompt-assembly implementations), not a superseded-decision
technicality. The DEC-168 template's "rejected alternatives and measured
bounds" field is a direct fit: it should carry the two-destination design
as the rejected alternative, and preserve why (framed in DEC-107's Context)
rather than only footnoting DEC-097/DEC-099 as "superseded."

## Reference implementation

`PRD/sections/life-tracker/README.md`, `PRD/sections/user-feedback/README.md`,
`PRD/sections/trade-balancer/README.md`, and `PRD/sections/scan/README.md`
(all DEC-168) are the worked templates: `Status:` / `Backed by:` header,
**What it is**, **How it works**, **Measured bounds**, **Rejected
alternatives and deferred scope**, **Where it lives**. `trade-balancer`
shows the corpus/behavior `data/` split shape (not expected to apply here —
Quick Lookup cites no external Magic-data corpus of its own, only the
shared `apps/frontend/public/data/gameRulesCoreTopics.json` build artifact
already covered by rules-retrieval machinery, per the gameplan's
"machinery, not a feature spec" test). `scan` shows the cross-destination
structure precedent for a feature reached from more than one screen —
Quick Lookup does not need that shape (it is one destination), but does
need the analogous "full backend path" structure this package identifies
above.

## Non-goals

No product-behavior decisions here. No `apps/` code change. No edit to
`PRD/sections/decisions/lookup-suite.md`, `providers-and-contract.md`, or
any other existing DEC/REQ/FLOW/NFR body. No resolution of Q-003 or Q-004.
No decision on the exact structure of the full-backend-path section.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/quick-lookup-spec

## Next step

`/thejudge-refinement PRD/work/quick-lookup-spec/`
