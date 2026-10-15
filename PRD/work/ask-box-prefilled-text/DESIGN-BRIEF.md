# Design brief — Ask box shows an old question instead of the hint

**Decide:** one slot in `GATE-QUESTIONS.md` (REQ-206, the In-depth carry). No
new stable ID. No blocker.

## The answer in one paragraph

The Ask box is not showing a styled-up hint. It holds a real, old question: the
player's own question saved as Ask a Question's **Draft** (the browser-local
copy of an unsent question that REQ-108 restores on every visit and reload).
Because the box holds text, the In-depth button folds down to its ◈ glyph,
which is exactly what REQ-206 tells it to do when the box holds text. The
reproducible way to get there is the **In-depth** button. A player types a
question and taps In-depth. The question never arrives in In-depth when no
card is attached, and it is never removed from Ask a Question. So it comes
back on every later visit, even after the player got an answer in In-depth.
On a clean first visit nothing is wrong, on the dev build or the live site.

## What was measured

Full record: `evidence/measurements.md`. Screenshots (local only):
`.playwright-mcp/`.

- **Clean load, desktop 1440x900 and phone 390x844, dev and live:** the box is
  empty, shows only the hint, has no focus, and on desktop the In-depth button
  shows "◈ In-depth" (96px wide). It does not reproduce.
- **Hint colour:** the hint is `#a1a1aa` at 80% opacity, typed text is
  `#e2e8f0`. Every theme uses the same token. The hint is clearly dimmer than
  typed text, so colour is not the cause.
- **Type a question → tap In-depth → Back, or → reload:** the box holds the
  question as real text, not focused, `data-fill="some"`, the In-depth label
  is hidden (35px). Same on dev and live, desktop and phone.
- **Type a question → tap In-depth → walk to the end → get an In-depth answer
  → Menu → Ask a Question, or → reload:** the old question is still there, and
  Question History lists it as an **Ask a Question · Draft** row. The In-depth
  question box had opened **empty**, and the answer was for In-depth's silent
  fallback question, not the player's.
- **Type then clear:** the box empties and the label comes back once the box
  loses focus. No bug.

Live and dev behaved identically in every case (live bundle
`index-CGZiOZPC.js`; dev at `origin/main` `97c8ea8a`).

## Root cause

Two code facts combine. Both are on the In-depth carry: the **Add in-depth
details** button (the ◈ In-depth chip) that moves the player's cards and
question from Ask a Question into In-depth details.

1. **A question-only carry is dropped.** `MtgAssistantApp.tsx` ~236 returns
   early when the carry has no card (`carry.cards.length === 0`), throwing
   away the question too. REQ-206 says the button carries "every attached card
   and the typed question". So In-depth opens with an empty question box, and
   the player's question stays behind in Ask a Question. This is a plain bug
   against existing requirement text.
2. **Nothing removes a carried question from Ask a Question.** Ask a
   Question's Draft clears only on its own first answer, or when the player
   leaves with the box and stage empty (`QuickLookupApp.tsx` ~153, ~222). An
   In-depth answer clears only In-depth's own Draft (`MtgAssistantApp.tsx`
   ~359). REQ-108 says a Draft clears "on first successful answer for the
   attempt", but the code only counts answers given on the same page. So
   after a carry, the same question lives in two places, and the Ask a
   Question copy never goes away.

The shrunk button is a consequence, not a second bug. REQ-206 folds the chip to
◈ "once the question field is focused or the box holds text", and on any screen
under 480px it is ◈-only always.

## Intended behaviour that stays as it is

- **Phone:** the In-depth button is ◈-only at rest on any screen narrower than
  480px. That is REQ-206's "`<480px` always-icon-only rule is unchanged"
  (acceptance criterion on the question box, `functional-requirements.md`
  REQ-206). It looks minimized on a 390px phone even with an empty box, by
  design.
- **An unsent question the player typed and left behind** (Menu away, reload)
  comes back. That is REQ-108: "mounting the destination with a stored Draft
  (page reload, or Menu return to that destination) auto-hydrates mid-flight
  UI from Draft". If the owner's text is a question they typed and never sent
  or carried, it is this rule working as written. Changing it, for example
  expiring old Drafts or adding a clear (✕) control to the box, would be a new
  decision and is not proposed here.

## Player-facing outcome

- Tapping **In-depth** with a typed question and no card brings that question
  into In-depth's question box, the same as it already does when a card is
  attached.
- Once In-depth answers a carried question, Ask a Question is empty again on
  the player's next visit and after a reload. The box shows only the faint
  hint, and on desktop the button reads "◈ In-depth". The carried cards leave
  the Ask a Question stage too.
- Tapping In-depth by mistake and pressing Back still finds the question
  waiting in Ask a Question, because nothing is cleared until In-depth has
  actually answered.
- If the player changes Ask a Question's question or cards after the carry,
  those changes are new work and are kept.

## Acceptance criteria

1. **Question-only carry arrives.** With no card attached, type
   `How does ward work?` in Ask a Question and tap In-depth. When the walk
   reaches the question box (Context → Finish), the box holds
   `How does ward work?`. A request sent from there carries that question, not
   the "Explain the interaction with the provided game state" fallback.
2. **The carried question leaves Ask a Question after the In-depth answer.**
   Type a question (with or without cards), tap In-depth, finish the walk and
   get an answer. Then open Ask a Question from the Menu: the textarea `value`
   is `""`, `data-fill="0"`, no card is on the stage, and the stored key
   `thejudge.conversationDraft.lookup` is absent. Reloading gives the same
   result. Question History shows no Ask a Question Draft row.
3. **Survives a reload mid-walk.** Same as criterion 2, but reload the page
   once while In-depth is mid-walk (after the carry, before the answer). After
   the answer, Ask a Question is still empty and its Draft is gone.
4. **Back before an answer keeps the question.** Type a question, tap
   In-depth, tap Back. Ask a Question still holds the question (today's
   behaviour, unchanged).
5. **Later edits are kept.** Carry a question, go back to Ask a Question and
   change the text or the cards, then return to In-depth and get the answer.
   Ask a Question keeps the edited text and cards.
6. **Desktop at rest (1440x900), empty and unfocused:** the textarea `value`
   is `""`, the hint is "What would you like to know?", `data-fill="0"`, the
   box does not have focus, and the In-depth button shows the glyph and the
   word: "◈ In-depth", its label element computed `display: block`, the
   button about 96px wide. Focusing the box or typing still folds it to ◈
   (REQ-206, unchanged).
7. **Phone at rest (390x844), empty and unfocused:** the textarea `value` is
   `""`, the hint is "Your question…", `data-fill="0"`, no focus, and the
   In-depth button shows ◈ only (label `display: none`, about 35px), per
   REQ-206's under-480px rule. No change from today.
8. **No regressions:** a plain unsent question left by Menu-leave or reload
   still comes back (REQ-108); Ask a Question's own answer still clears its
   Draft; **✎ Edit cards** still returns cards and question; **↺ Start over**
   still empties everything.

## Touched files (expected)

- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`: accept a
  question-only carry (keep the card-placement path for card carries). On the
  carried attempt's first successful answer, hand the "carry answered" signal
  back to Ask a Question. Record that the attempt came from a carry in its own
  Draft, so a mid-walk reload keeps it (criterion 3).
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`:
  remember what was carried. On the signal, clear the question, the cards and
  the `lookup` Draft only if they are unchanged since the carry.
- `apps/frontend/src/lib/portal/seedContext.tsx`: the existing one-slot
  cross-destination mailbox pattern (`queueLookupCarry`/`consumeLookupCarry`)
  gains the return signal.
- `apps/frontend/src/lib/conversationHistory/persistence.ts`: only if the
  carry provenance needs a field on the stored Draft types.
- Tests: `MtgAssistantApp.carry-placement.test.tsx` (question-only carry),
  `App.mid-flight-draft.test.tsx` (criteria 2-5), `seedContext.test.tsx`.
- `PRD/sections/functional-requirements.md` (REQ-206) and
  `PRD/sections/quick-lookup/README.md`, applied at build from the approved
  `GATE-QUESTIONS.md`.

No CSS change. The REQ-206 fold rule (`flow.css` 281-289), the hint tiers
(`ComposerPill.tsx`), and the hint colour stay as they are.

## Non-goals

- No change to the hint wording, the hint colour, the hint tiers, or the
  In-depth fold rule.
- No change to REQ-108's restore of an unsent, uncarried question.
- No clean-up of Drafts already sitting in players' browsers from before the
  fix. Those were saved without a record that they were carried, so they stay
  until the player sends or deletes them. The owner can clear one by emptying
  the box and leaving the page, or by sending it.
- No change to the follow-up composer or to In-depth's own question box beyond
  receiving a question-only carry.

## Material assumptions (assumption ladder)

| # | Question | Resolved by | Evidence |
| --- | --- | --- | --- |
| 1 | Is the owner seeing a real value or a bright hint? | Measurement (rung 2) | On desktop the label hides only on focus or text; nothing focuses the box on load; the hint is measurably dimmer. A desktop shrunk button therefore means real text. |
| 2 | Should a question-only carry bring the question? | REQ-206 text (rung 1) | "carrying every attached card and the typed question (or its silent fallback)". The early return is a bug. |
| 3 | When should a carried question leave Ask a Question? | REQ-108 (rung 1) + preserve visible behaviour (rung 5) + smallest reversible scope (rung 4) | REQ-108: a Draft clears "on first successful answer for the attempt". Clearing at the answer, not at the tap, keeps Back-after-a-mistaken-tap working. Proposed as a REQ-206 amendment so the owner rules on it. |
| 4 | What if the player edits Ask a Question after carrying? | Rung 5 | Edits are new staging; REQ-108 keeps staged work. Clear only when unchanged. |
| 5 | Is the phone's ◈-only button part of the bug? | REQ-206 text (rung 1) | "the `<480px` always-icon-only rule is unchanged". By design. |

The alternative of clearing Ask a Question the moment In-depth is tapped was
considered and not chosen: it would lose the question if the player taps
Back, and REQ-108 ties clearing to an answer.

## PRD alignment and proposed product truth

- **REQ-206 (amended):** add one acceptance criterion: a question-only carry
  brings the question, and once In-depth answers a carried attempt, Ask a
  Question's unchanged carried question and cards and its Draft are cleared.
  Plus a tests line and a dated note. Diff in `GATE-QUESTIONS.md`.
- **`PRD/sections/quick-lookup/README.md`:** the Entry bullet about the Add
  in-depth details pill gains the same hand-off sentence. It is part of the
  REQ-206 slot.
- **REQ-108:** unchanged. Its existing "cleared on first successful answer for
  the attempt" covers the new behaviour; the REQ-206 amendment says how it
  applies to a carried attempt.
- No new REQ, FLOW, screen, or decision-log entry.

## Verification for the build

- Unit and integration tests for criteria 1-5 and 8 (Vitest, jsdom).
- Live browser check at 1440x900 and 390x844 on the dev build, first with
  clean storage and then on paths B and C from `evidence/measurements.md`,
  recording the same columns (value, hint, focus, `data-fill`, label).
  Criteria 6 and 7 are checked there.
- `npm run typecheck` and `npm test` green.

## Other finding (out of scope for this package)

The owner noticed, while watching this session, that the In-depth Context step
(where a player adds details to each card) looked badly spaced. It is recorded
here as evidence only. Its fix is not part of this package, and no product
truth is proposed for it; the owner decides separately whether it becomes its
own package.

What was measured, identical on dev and live at 1440x900 and 390x844 (full
table in `evidence/measurements.md` section 4):

- **Card counter pill** ("1 / 1 cards", `EnrichmentStep.tsx:333`, CSS
  `apps/frontend/src/index.css:1783`): the pill is 30px tall with
  `align-items: baseline`, so its text sits 1px from the top and 14px from the
  bottom. It hugs the top edge instead of sitting centred.
- **Note field** (after tapping ＋ Add a note, `EnrichmentStep.tsx` ~515,
  `rows={2}`): 54px tall while its hint needs 108px, so the hint's third line
  is cut through the middle of the letters.
- No sideways page scroll at either width; `.ctx-head` overflows by 4px at
  390px with no visible effect.

Steps to reach it: `/in-depth` → Continue → Continue → Add a card to
Battlefield → `Sol Ring` → Add card → Continue → ＋ Add a note. This session's
screenshots do not show anything worse than these two faults; the owner may
have caught a moment the session did not capture.
