# Slice C — Ask a Question: door, stage, pill composer, ruling view, carry

## Status: planned

## Goal

Quick Question and In-Depth Question become one Menu door, **Ask a
Question**: attached cards on a lit stage, one pill-shaped question box with
the send inside it, and a ruling view that shows the player's own question
first. Attaching "in-depth details" carries the cards (and a typed question,
if In-depth's box is empty) into the In-depth details flow.

## Dependencies

Slice A (frame, Menu, tokens), slice B (shared sheet, used by card detail
inside the stage and by ✎ Edit cards' picker).

## Requirements

Realises these `GATE-QUESTIONS.md` ids, applied to `PRD/sections/` by intent
together with the code:

1. REQ-206 (**edit**, owner-edited) — one Menu door recomposing today's
   `/quick-lookup` route (`mode: "lookup"`): attached cards on a lit stage
   (front card full size, a neighbour peeking each side), **Add card** and
   **Scan** beside the title, pill composer. **Add in-depth details** carries
   attached cards into `/in-depth` (`mode: "game"`). Owner edit: the Draft
   begins the moment the first card is attached — not only once a question is
   typed — so carried-but-unplaced cards survive a reload (`A4`, `A5`).
2. REQ-167 — the card cap rises from 5 to 10 (the only validation-bound
   change to `AskAiRequest`).
3. REQ-025 — the player's own question opens the conversation thread
   (REQ-025), shown first, before the ruling.
4. REQ-075 — the ruling view: question first, ruling in a solid bubble under
   the colour's seal, a Cards strip at the top, card names in the ruling as
   tappable chips matched against the conversation's attached cards (`A18`),
   **✎ Edit cards** / **↺ Start over** beside the title.
5. REQ-029 — ↺ Start over lands on a clean Ask a Question page, roster
   preserved (`A14`).
6. REQ-132, REQ-012, REQ-121 — no separate Send Request button; the send
   pill inside the composer is the submit action, with no text label and a
   300-character ring traced round it.
7. FLOW-005, FLOW-011 — the follow-up and Ask-a-Question flows show the
   first question and route through the one door.

The General rules topics disclosure and the locked topic pill stay
unchanged (`A6`).

## Files touched

- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx` (+
  `.test.tsx`) — recomposed into the Ask a Question door: stage, Add
  card/Scan, pill composer, ruling view.
- New `apps/frontend/src/components/ComposerPill.tsx` (+ `.test.tsx`) —
  pill-shaped composer, send inside, 300-char ring (ports REQ-132/012/121
  out of `ComposerSubmitButton.tsx`).
- `apps/frontend/src/components/ComposerSubmitButton.tsx` — retired or
  folded into `ComposerPill`.
- `apps/frontend/src/components/ConversationThread.tsx` (+ `.test.tsx`) —
  question-first ordering, card-name chip matching.
- `apps/frontend/src/components/CardSelectionPreview.tsx` — lit-stage
  presentation (front card full, neighbours peeking).
- `apps/frontend/src/lib/portal/seedContext.tsx` — extended carry: cards
  attach to the Draft the moment the first card lands, not only on typed
  text (REQ-206 owner edit).
- `apps/frontend/src/lib/conversationHistory/persistence.ts` — Draft shape
  unchanged (`A4`); verify the carry writes to it correctly.
- `PRD/sections/quick-lookup/README.md`, `PRD/sections/functional-requirements.md`,
  `PRD/sections/user-flows.md` — apply REQ-206, REQ-167, REQ-025, REQ-075,
  REQ-029, REQ-132, REQ-012, REQ-121, FLOW-005, FLOW-011 by intent.

## Tests

- `QuickLookupApp.test.tsx` — stage, cap at 10, carry hand-off, Start over.
- New `ComposerPill.test.tsx` — send-inside-pill, no text label, 300-char
  ring, submit on Enter/tap.
- `ConversationThread.test.tsx` — question shown first, card-name chips.
- Golden prompt fixture test (byte-identical check for everything except the
  REQ-167 cap bound) per `DESIGN-BRIEF.md` A9.

## Acceptance criteria

- [ ] C1. `npm run quality:check` passes.
- [ ] C2. `npm --workspace apps/frontend run test` passes.
- [ ] C3. The Menu lists one "Ask a Question" door; the stage shows the
      front card full size with a neighbour peeking each side; Add card and
      Scan sit beside the title.
- [ ] C4. The card cap is 10, not 5; attaching an 11th card is rejected the
      same way the 6th is today.
- [ ] C5. The ruling view shows the player's own question before the
      ruling; card names in the ruling render as tappable chips matched only
      against the conversation's attached cards.
- [ ] C6. **Add in-depth details** carries every attached card (and the
      typed question, only when In-depth's box is empty) into `/in-depth`;
      the Draft is written the moment the first card attaches, so a reload
      before any card is placed still shows the carried cards.
- [ ] C7. ↺ Start over returns to a clean Ask a Question page with the
      player roster intact.
- [ ] C8. The composer's send control is a pill with the send inside it, no
      text label, and a 300-character ring that traces round it.
- [ ] C9. `PRD/sections/` carries REQ-206, REQ-167, REQ-025, REQ-075,
      REQ-029, REQ-132, REQ-012, REQ-121, FLOW-005, FLOW-011 by intent.
- [ ] C10 (manual). Golden prompt fixtures are byte-identical to today's for
      every unchanged field; only the REQ-167 cap bound differs.
- [ ] C11 (manual). Browser scenario observed at 390×844: attach a card,
      reload before typing or adding in-depth details — the card survives
      the reload (REQ-206 owner edit, A4).
- [ ] C12 (manual). Cleanup evidence recorded: browser closed, owned servers
      stopped, ports released, capture output path named.

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
```

## Files touched

(see above)
