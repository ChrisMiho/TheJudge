# Slice E — In-depth details: context sheet, Targets, Mana spent, review

## Status: planned

## Goal

The Context station becomes one compact sheet per card: a single Targets
picker that maps onto today's four target kinds, the note folded, and Mana
spent prefilled with the printed cost — editable on any zone's card, per the
owner's REQ-210 edit. The review lists each card's context in words before
the question box.

## Dependencies

Slice D (the Cards station this station follows on the rail; carried cards
must already be placed before Context opens).

## Requirements

Realises these `GATE-QUESTIONS.md` ids, applied to `PRD/sections/` by intent
together with the code:

1. REQ-017 — the per-card context form becomes one compact sheet. Targets
   stay on Hand and Library cards, unlike the mockup (`A8`).
2. REQ-021 — one Targets picker whose picks map onto today's four target
   kinds (player / card / none / other); the request shape is unchanged
   (`A7`). "Just on the board" / "All players" / "Something else" ride
   `other` with that text.
3. REQ-100 — one "More details for all players" toggle.
4. REQ-045 — the enrichment view-mode toggle is retired (folded into the one
   compact sheet).
5. REQ-058 — card identity rings replace the two enrichment modes as the
   sheet's own visual cue.
6. REQ-210 (**edit**, owner-edited) — Mana spent can be set on any zone's
   card, not only the Stack and Battlefield; prefilled with the printed
   cost; an untouched box sends nothing, so today's prompts stay
   byte-identical (`A9`).
7. REQ-136 — View Context clearance is measured against the new ☰ header
   (replacing the old rail-clearance measurement).

The review step lists each card's context in words, then the question box;
the chat is the same as Ask a Question's, with View Context beside the
title.

## Files touched

- `apps/frontend/src/components/EnrichmentStep.tsx` (+ `.test.tsx`,
  `.ambient-accent.test.tsx`, `.card-state-cues.test.tsx`) — collapsed into
  one compact sheet; Mana spent field extended to every zone.
- `apps/frontend/src/components/AdaptiveContextDialog.tsx` (+ `.test.tsx`) —
  Targets picker, folded note.
- `apps/frontend/src/components/FrozenGameContextDetails.tsx` (+
  `.test.tsx`) — review step, words-based context list.
- `apps/frontend/src/components/ZoneConfirmStep.tsx` (+ `.test.tsx`) — "More
  details for all players" toggle.
- `PRD/sections/in-depth/README.md`, `PRD/sections/functional-requirements.md`
  — apply REQ-017, REQ-021, REQ-100, REQ-045, REQ-058, REQ-210, REQ-136 by
  intent.

## Tests

- `EnrichmentStep.test.tsx` and its two sibling specs — one compact sheet,
  Mana spent on every zone, prefill with printed cost.
- `AdaptiveContextDialog.test.tsx` — Targets mapping onto the four kinds,
  Hand/Library targeting retained.
- Golden prompt fixture test: an untouched Mana spent box sends nothing;
  only an edited box changes the prompt line (REQ-210, `A9`).

## Acceptance criteria

- [ ] E1. `npm run quality:check` passes.
- [ ] E2. `npm --workspace apps/frontend run test` passes.
- [ ] E3. The Context station shows one compact sheet per card (no separate
      enrichment view-mode toggle); card identity rings are the sheet's
      visual cue.
- [ ] E4. The Targets picker's picks map onto today's four `AskAiRequest`
      target kinds; Hand and Library cards can still be targeted.
- [ ] E5. Mana spent is editable and prefilled with the printed cost on
      every zone's card, not only Stack/Battlefield.
- [ ] E6. One "More details for all players" toggle exists on the review
      step.
- [ ] E7. View Context's clearance check is measured against the ☰ header.
- [ ] E8. `PRD/sections/` carries REQ-017, REQ-021, REQ-100, REQ-045,
      REQ-058, REQ-210, REQ-136 by intent.
- [ ] E9 (manual). Golden prompt fixture: an untouched Mana spent box on any
      zone sends nothing (prompt byte-identical to today's); an edited box
      changes only that card's Mana spent line.
- [ ] E10 (manual). Browser scenario at 390×844: open Context for a
      Graveyard card (not Stack/Battlefield), edit Mana spent, confirm the
      value is sent in the request.
- [ ] E11 (manual). Cleanup evidence recorded: browser closed, owned servers
      stopped, ports released, capture output path named.

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
```

## Files touched

(see above)
