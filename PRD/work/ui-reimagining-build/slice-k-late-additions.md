# Slice K — Late additions: dictation, Copies on a Stack card

## Status: done

## Goal

The two owner-approved extras land last, once everything they build on
already exists: speaking a question into the send pill, and marking Copies
on a Stack card in its context sheet.

## Dependencies

Slice C (the send pill dictation attaches to), slice E (the context sheet
Copies attaches to).

## Requirements

Realises these `GATE-QUESTIONS.md` ids, applied to `PRD/sections/` by intent
together with the code:

1. REQ-212 — a microphone control on the send pill lets the player speak a
   question into the box (dictation), using the browser's native speech
   recognition; no new dependency.
2. REQ-211 — Copies on a Stack card: a numeric field in the Stack card's
   context sheet, sent as a new prompt field (the one change in this slice
   that is not presentation-only, per `DESIGN-BRIEF.md` `## What it
   changes`).

## Files touched

- `apps/frontend/src/components/ComposerPill.tsx` (+ `.test.tsx`) —
  microphone control, dictation wiring.
- `apps/frontend/src/components/EnrichmentStep.tsx` (+ `.test.tsx`) —
  Copies field on Stack cards only.
- `apps/backend/src/validation/askAiRequest.ts`, `apps/backend/src/prompt/`
  — Copies reaches the prompt as a new field (REQ-211); dictation is
  frontend-only, no backend change.
- `PRD/sections/functional-requirements.md`,
  `PRD/sections/integrations-and-data.md` (if the new prompt field is
  documented there) — apply REQ-212 and REQ-211 by intent.

## Tests

- `ComposerPill.test.tsx` — mic control triggers dictation, transcribed text
  lands in the box.
- `EnrichmentStep.test.tsx` — Copies field only on Stack cards, value reaches
  the request.
- Backend prompt/validation test — new Copies field accepted, reaches the
  prompt text; golden prompt fixture updated (not byte-identical here,
  since REQ-211 is a real prompt change, unlike every prior slice's A9
  guarantee).

## Acceptance criteria

- [x] K1. `npm run quality:check` passes.
- [x] K2. `npm --workspace apps/frontend run test` and
      `npm --workspace apps/backend run test` pass.
- [x] K3. The send pill has a microphone control; speaking fills the
      question box with the recognised text.
- [x] K4. A Copies field appears in the context sheet only for Stack cards.
- [x] K5. Copies reaches `AskAiRequest` and the assembled prompt as a named
      field.
- [x] K6. `PRD/sections/` carries REQ-212 and REQ-211 by intent.
- [x] K7 (manual). Browser scenario: tap the mic, speak a short question
      (or simulate via the Web Speech API test hook), confirm the box
      fills; submit and confirm the ruling answers the spoken question.
- [x] K8 (manual). Browser scenario at 390×844: set Copies to 3 on a Stack
      card, submit, confirm the backend-received request (via network
      inspection or a mock-mode log) carries Copies: 3.
- [x] K9 (manual). Cleanup evidence recorded: browser closed, owned servers
      stopped, ports released, capture output path named.

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
npm --workspace apps/backend run test
```

## Files touched

(see above)

## Ship gates

- [x] Slice acceptance criteria satisfied and verified, for every slice
      A through K.
- [x] Tests updated; `npm run quality:check` green for touched areas.
- [x] Public contract unchanged unless a slice scoped a change (REQ-167's
      cap bound, REQ-210's every-zone Mana spent field, REQ-211's Copies
      field — the three named `AskAiRequest`/prompt changes in
      `DESIGN-BRIEF.md` `## What it changes`; everything else leaves
      `AskAiRequest`, the prompts, the backend routes, card data and the
      data pipeline exactly as they are).
- [x] No secrets committed.
- [x] Durable outcomes promoted; `PRD/work/ui-reimagining-build/` ready to
      delete.

### PRD promotion checklist (execution happens in `thejudge-cleanup`)

- [x] Every one of the 57 `GATE-QUESTIONS.md` ids (54 accept, 3 edit: REQ-210,
      REQ-206, REQ-214) is present in `PRD/sections/` by intent — confirm
      against the GAMEPLAN's id → slice table, not by re-reading the diff.
- [x] REQ-206…REQ-215 (the nine new ids) are entered after REQ-205 in numeric
      order in `PRD/sections/functional-requirements.md`.
- [x] The amendment-set disposition table in `DESIGN-BRIEF.md` is fully
      applied — every "no change" row is verified unchanged, every other row
      verified edited.
- [x] `system-map.md` lines naming the old rail, drawer, or labels are
      updated by whichever slice changed that code (`A23`), not left for
      cleanup to invent.
- [x] Mock mode works on every screen (final pass, after slice K).
- [x] The receipt names every slice's reviewable screenshot location
      (`docs/design/ui-reimagining/build-screenshots/<letter>/`) so the
      owner can find them after this package folder is deleted.
