# Prompt assembly
Backed by: DEC-025, DEC-036, DEC-042, DEC-043, DEC-033, DEC-021

For the full section-by-section list in exact assembly order, a plain
one-line description of each, and a presence matrix across every path (game
mode, lookup with/without cards, follow-up), see
`system-map/prompt-layout-spec.md` (REQ-169). This doc stays the narrative
walkthrough; that one is the readable reference table.

## How it works

Prompt assembly turns the validated ask-AI request into one provider-facing text
prompt plus diagnostics. It first normalizes the request into a prompt context:
question fallback, player roster, active player, turn phase and optional combat step,
stack items in bottom-to-top order, and populated non-stack zones. Card entries carry
the full metadata block in every zone: oracle text, mana cost and value, type line,
colors, supertypes, subtypes, targets, per-card notes, plus owner for non-stack zones
and caster/mana spent for stack items.

The prompt starts with role and instruction framing, then the static
`MTG_PROMPT_REFERENCE` block. After that framing, the behavior-level section order is:
`GENERAL GAME CONTEXT` -> `ADDITIONAL GAME STATE` (planned, DEC-043) ->
`PHASE GUIDANCE` (DEC-036) -> populated zone sections with full card metadata in all
zones (DEC-042) -> `GAME RULES (reference)` / System 2 ->
`ADDITIONAL RELEVANT RULE EXCERPTS` / System 3 -> `OFFICIAL RULINGS` / System 1 ->
`SCOPE` -> `QUESTION`. When conversation history is present, it is inserted before
`QUESTION` and the instructions tell the model to treat follow-ups as refinements
against the frozen game state and prior answers.

System 2, System 3, and System 1 are reference context, not authority to rewrite the
submitted state. System 2 provides the curated game-rules baseline, System 3 provides
supplemental relevant rule excerpts, and System 1 provides WotC Oracle rulings for
submitted cards. Their retrieval mechanics are covered in
`system-map/game-rules-retrieval.md`; prompt assembly consumes their selected output
and places each block in the documented order.

## Data flow

Input is the validated `POST /api/ask-ai` request. Prompt preparation builds a
normalized context, collects submitted cards for rulings, selects curated game-rule
topics from the normalized game state, retrieves supplemental rules while excluding
the curated baseline rule IDs, truncates conversation history against the shared
history budget, and then renders the final prompt text.

Rendering combines the static MTG reference, normalized game context, phase guidance,
zone sections, selected rules/rulings sections, the merged scope sentence, optional
conversation history, and the final question. Diagnostics are calculated from the
rendered text and selected enrichment blocks. The prompt budget is
`EFFECTIVELY_UNLIMITED_CHARS` (1,000,000) per DEC-042, so the budget and truncation
infrastructure remains visible while current caps avoid dropping full card metadata.

In mock provider mode, preparation can also collect an enrichment-debug sidecar
(DEC-033) that reports selected curated topics, supplemental retrieval scoring
summary, and rulings inclusion/skips. That sidecar is for local/debug review only;
frontend and live provider success responses continue to rely on the core answer
contract.

## Where it lives

- `apps/backend/src/prompt/preparation.ts`
- `apps/backend/src/prompt/context.ts`
- `apps/backend/src/prompt/normalization.ts`
- `apps/backend/src/prompt/mtgReference.ts`
- `apps/backend/src/prompt/phaseGuidance.ts`
- `apps/backend/src/prompt/enrichmentDebug.ts`

## Worked example

A request asks what happens during declare blockers with two stack items, a populated
battlefield, and prior conversation history. The backend normalizes the roster,
records the stack with item 1 as bottom and the last item as top, attaches each card's
oracle text and metadata, and selects combat-aware phase guidance for the declare
blockers step.

The rendered prompt begins with TheJudge's role/instruction framing and the static MTG
reference. It then prints `GENERAL GAME CONTEXT`, the planned `ADDITIONAL GAME STATE`
slot when that field exists, `PHASE GUIDANCE`, `ZONE: STACK (BOTTOM TO TOP)`, and the
populated non-stack zones. It adds curated rules, supplemental excerpts, and official
rulings when available, then the `SCOPE` sentence listing zones with no cards or not
included. If this is a follow-up turn, `CONVERSATION HISTORY` appears before the final
`QUESTION`.

## Invariants / gotchas

- Stack order is authoritative and bottom-to-top: the first submitted stack item is
  bottom, and the last submitted stack item is top.
- `ADDITIONAL GAME STATE` is a planned DEC-043 prompt slot, represented as planned in
  the catalog until the request shape and assembly code ship it.
- Zone sections include full card metadata in every populated zone; prompt budget
  diagnostics remain in place rather than silencing size concerns.
- The static MTG reference and merged scope sentence frame the answer, but they do not
  add hidden state or a rules engine.
- Rules and rulings blocks are reference context. They do not override submitted stack
  order, zones, targets, notes, or stated game state.
- The enrichment-debug sidecar is mock-only diagnostic output and is not part of the
  live provider-facing answer contract.
