# Slice F — Prompt structure

## Status: done

## Goal

Each prompt reads in one clear order: one instruction list, a reference block per mode, rulings under their card, In-Depth topics chosen by what the player asked, and cards shown with their full stats.

## Requirements

1. Rulings (REQ-241, REQ-030): `OFFICIAL RULINGS (WotC reference)` stops being its own section; rulings sit under their card, framed as situation-specific. A card shown more than once carries its rulings once, under its first appearance.
2. Topic choice (REQ-242, REQ-220): In-Depth picks curated topics by card wording and question, not zones. Trigger terms for each formerly zone-gated topic come only from words of the topic's own title and its rules' section titles. Quick Lookup keeps its four always-on topics plus REQ-220. Target 5: on the 9 corpus cases in both versions, In-Depth keeps at least 17 of their 30 deciding rules in the prompt.
3. Instructions (REQ-243): one instruction list, a reference block per mode (`MTG REFERENCE` for game, lookup variant for Quick Lookup), one stack numbering, rules framed as binding. No instruction refers to a section absent from that mode. P5 ("use only the provided context") and P13 (instructions as a system message) stay unchanged.
4. Card blocks (REQ-245, REQ-176, REQ-030): power, toughness and loyalty shown; line breaks kept. Values are backend-only like `keywords` (REQ-180): the card-detail route's block and the frontend payload are unchanged. A multi-face card shows its faces' values joined with " // ".
5. Section orders:
   - In-Depth: preamble, instructions, reference (game), general context, additional game state, phase guidance, zone sections (each card followed by its rulings), curated rules, excerpts, combo context, scope, history, question.
   - Quick Lookup: preamble, instructions, reference (lookup), phase guidance (only when a step is named), curated rules, excerpts, cards (each followed by its rulings), combo context, history, question.
6. Multi-card lookup (REQ-074, REQ-167, FLOW-011, FLOW-023): assembly follows the new rules; enrichment reads each card's text separately.
7. No change to request or response shapes, the frontend, or any endpoint. Public API contract tests stay green.
8. Apply by intent to `PRD/sections/`: REQ-241, 242, 243, 245 (new), REQ-030, 074, 176, 220, FLOW-011, FLOW-023, `prompt-layout-spec.md`, `prompt-assembly.md`, `quick-lookup/README.md`, `in-depth/README.md`, `system-map.md` (one-line summaries of System 2 and 3).
9. Every golden prompt change reviewed and listed in the evidence log.

## Acceptance criteria

- [x] Prompt tests for both modes assert the section orders in requirement 5
- [x] No separate rulings section exists; rulings follow their card once, first appearance only
- [x] In-Depth topic tests: words from the topic title and section titles trigger it; zone alone does not; Quick Lookup keeps its four always-on topics plus REQ-220
- [x] In-Depth keeps at least 17 of 30 deciding rules on the 9 shared corpus cases
- [x] Instruction tests: one list, one stack numbering, no reference to an absent section in either mode
- [x] Card-block tests: power, toughness, loyalty, " // " for multi-face, line breaks kept; the card-detail route and frontend payload are unchanged (contract tests pass)
- [x] Gate slots REQ-241, 242, 243, 245, 030, 074, 176, 220, FLOW-011, FLOW-023 and the five section docs are applied by intent
- [x] Golden prompt changes are each reviewed and listed in the evidence log
- [x] `npm run quality:check` passes

## Verification

```bash
npm --workspace apps/backend run test
npm run test:eval
npm run quality:check
```

## Files touched

- `apps/backend/src/prompt/` builders and tests, `apps/backend/src/gameRulesTopicSelection.ts`, `cardDetail.ts` (backend-only fields)
- topic manifest data, eval goldens (reviewed)
- `PRD/sections/functional-requirements.md`, `user-flows.md`, `system-map.md`, `system-map/prompt-layout-spec.md`, `system-map/prompt-assembly.md`, `quick-lookup/README.md`, `in-depth/README.md`
