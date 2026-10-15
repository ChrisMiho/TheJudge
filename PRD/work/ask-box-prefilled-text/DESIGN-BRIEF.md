# Design brief — Ask box shows an old question instead of the hint

**Decide:** three slots in `GATE-QUESTIONS.md`. REQ-206 (what the In-depth
button hands off, what a second tap does to In-depth's question box, and what
Ask a Question clears after the In-depth answer).
REQ-108 and FLOW-017 (the saved unsent question follows the box as the player
edits, so clearing it sticks). No new stable ID. No blocker.

## The answer in one paragraph

The Ask box is not showing a styled-up hint. It holds a real, old question: the
player's own question saved as Ask a Question's **Draft** (the browser-local
copy of an unsent question that REQ-108 restores on every visit and reload).
Because the box holds text, the In-depth button folds down to its ◈ glyph,
which is exactly what REQ-206 tells it to do when the box holds text. Two
player paths put the old question back. First, the **In-depth** button: the
question never arrives in In-depth when no card is attached, and it is never
removed from Ask a Question, so it returns on every later visit. Second,
**clear and reload**: the Draft is only saved at a few moments (leaving by the
Menu, attaching or removing a card), so once one exists, emptying the box and
reloading brings the old question back. On a clean first visit nothing is
wrong, on the dev build or the live site.

## What was measured

Full record: `evidence/measurements.md`. Screenshots (local only):
`.playwright-mcp/`. Live and dev behaved identically in every case (live bundle
`index-CGZiOZPC.js`; dev code identical to `origin/main` `97c8ea8a`), at both
1440x900 and 390x844.

- **Clean load:** the box is empty, shows only the hint, has no focus, and on
  desktop the In-depth button shows "◈ In-depth" (96px wide). It does not
  reproduce.
- **Hint colour:** the hint is `#a1a1aa` at 80% opacity, typed text is
  `#e2e8f0`. Every theme uses the same token. Colour is not the cause.
- **Type → tap In-depth → Back, or → reload:** the box holds the question as
  real text, not focused, `data-fill="some"`, the In-depth label hidden (35px).
- **Type → tap In-depth → get an In-depth answer → Menu → Ask a Question, or
  → reload:** the old question is still there, and Question History lists it as
  an **Ask a Question · Draft** row. The In-depth question box had opened
  **empty**, and the answer was for In-depth's silent fallback question.
- **Clear then reload (the owner's second report, measurements section 5):**
  once a Draft exists, from a Menu trip or from attaching a card, emptying the
  box leaves the stored Draft untouched, and a reload restores the old
  question. Replacing the question and reloading also restores the older one.
  With no Draft ever saved, type, clear, reload comes back empty.
- **Type then reload, no Menu trip:** the typed question is lost on reload,
  although REQ-108 lists reload as an exit the Draft covers.
- **Reload mid-walk in In-depth details:** the carried card and question are
  gone from In-depth after the reload; In-depth's own Draft was never written.
- **Type then clear, no reload:** the box empties and the label comes back once
  the box loses focus. Fine on its own.
- **A second tap on In-depth (measurements section 6, dev 1440):** with a card
  attached, the new question replaces whatever In-depth's question box held,
  even text typed there; a blank Ask box sends "Tell me about Sol Ring." in
  its place. With no card, the second tap is dropped and In-depth keeps its
  old question. The walk stays at its station and placed cards stay placed.

## Root cause

Three code facts. The first two are on the **In-depth carry**: the **Add
in-depth details** button (the ◈ In-depth chip) that moves the player's cards
and question from Ask a Question into In-depth details. The third is the Draft
itself.

1. **A question-only carry is dropped.** `MtgAssistantApp.tsx` ~236 returns
   early when the carry has no card (`carry.cards.length === 0`), throwing
   away the question too. REQ-206 says the button carries "every attached card
   and the typed question". So In-depth opens with an empty question box, and
   the player's question stays behind in Ask a Question. A plain bug against
   existing requirement text.
2. **Nothing removes a carried question from Ask a Question.** Ask a
   Question's Draft clears only on its own first answer (`QuickLookupApp.tsx`
   ~153). An In-depth answer clears only In-depth's own Draft
   (`MtgAssistantApp.tsx` ~359). So after a carry the same question lives in
   two places, and the Ask a Question copy never goes away.
3. **The Draft is a snapshot taken at a few moments, so it falls behind the
   box.** `snapshotMidFlightDraft` (`QuickLookupApp.tsx` ~214) writes the
   Draft, or removes it when nothing is staged. It runs only on Menu-leave
   (234), on opening a saved conversation (183), and on attaching or removing
   a card (252). Typing in the box or emptying it runs none of these, and no
   page-hide save exists anywhere in the frontend. So an emptied or replaced
   question is never written, and the mount restore (~167) brings back the
   older one after a reload. In-depth details has the same design
   (`MtgAssistantApp.tsx` ~372, run only at Menu-leave ~413 and on opening a
   saved conversation ~795), which is why a reload mid-walk loses the carried
   walk that REQ-206 promises survives a reload.

The shrunk button is a consequence, not a separate bug. REQ-206 folds the chip
to ◈ "once the question field is focused or the box holds text", and on any
screen under 480px it is ◈-only always.

## The three rules this package proposes

Each rule is stated once here and repeated word for word in the proposal.

**The carry hand-off rule (REQ-206 slot).** In player terms: after In-depth
answers, Ask a Question empties only if the player has not touched it since
tapping In-depth. Exact wording:

> When In-depth details gives its first successful answer for a carried
> attempt, Ask a Question compares what it holds with what it held at the
> latest tap: if the question, ignoring leading and trailing spaces, and the
> set of attached cards both match, it clears the question, the cards and its
> Draft; if either differs in any way, including a box emptied or a card added
> or removed since the tap, it clears nothing.

What "changed" means, precisely:

- It is a comparison of two states, taken at the moment of the In-depth answer:
  what Ask a Question holds now, against the snapshot of what Ask a Question
  held at the **latest** In-depth tap. It is not a record of edit events, so
  an edit that is later undone back to the snapshot counts as unchanged.
- **The snapshot is Ask a Question's own box and cards, not the question sent
  to In-depth.** These differ when the box is blank and a card is attached:
  the tap then sends Ask a Question's silent card fallback ("Tell me about Sol
  Ring.", measurements section 6), while the snapshot records an empty box.
  So a cards-only carry left alone still clears.
- **Question:** compared after trimming leading and trailing spaces and line
  breaks. A spaces-only edit is unchanged. Any other difference is a change.
- **Cards:** compared as a set of card identities (the card's id), order
  ignored. Adding, removing or swapping a card is a change.
- **Emptied box:** if the box held a question at the tap and is now empty,
  that is a change. The cards then stay, and so does the Draft (which, under
  the REQ-108 rule below, already holds just the cards).
- **All or nothing:** a change to either the question or the cards keeps
  **both**. The untouched half is not cleared on its own.
- **Only Ask a Question is compared.** Editing the question inside In-depth
  details is never a change; it neither blocks nor causes the clear.

All-or-nothing is the quality-check's recommendation, adopted here as the
proposal. The owner rules on it at the gate (Edit the REQ-206 slot to choose
per-item clearing instead).

**The later-tap rule (REQ-206 slot).** In player terms: every tap on In-depth
is a fresh hand-off. Whatever the player typed in Ask a Question this time
lands in In-depth's question box, and only the answer to this hand-off empties
Ask a Question. Exact wording:

> Every tap on In-depth starts a new carried attempt that replaces any earlier
> one. In-depth details' question box takes the carried question, replacing
> whatever it held, including anything typed there since an earlier tap; the
> carried question is Ask a Question's typed question, trimmed, or, with the
> box blank and cards attached, its silent card fallback. Carried cards replace
> the cards still waiting for a zone; a carry with no card leaves In-depth
> details' cards as they are; cards already placed stay placed, and the walk
> stays at its station. A tap with no question and no card changes nothing in
> In-depth details. The carried attempt's answer is the first successful answer
> to a request sent from In-depth details after the latest tap (a retry of
> that request counts); an answer to a request sent before that tap, or to a
> follow-up in an already-answered conversation, does not. The hand-off fires
> once; Ask a Question sending its own question, or ↺ Start over in In-depth
> details, drops it.

What a later tap does today against this rule (measured, `evidence/measurements.md`
section 6, rows T1 to T4; code `MtgAssistantApp.tsx` 235-245):

| A later tap, when the earlier tap already filled In-depth | Today | Under the proposal |
| --- | --- | --- |
| Ask a Question has a question and a card | In-depth's box takes the new question, replacing text typed there (T2) | Kept |
| Ask a Question's box is blank, a card is attached | In-depth's box takes "Tell me about Sol Ring.", replacing text typed there (T3) | Kept |
| Ask a Question has a question, no card | Dropped: In-depth's box keeps its old text (T4) | **Changed:** the box takes the new question (same fix as criterion 1) |
| Cards carried | Replace the cards waiting for a zone; placed cards stay; walk stays at its station (T2) | Kept |
| No card carried | Dropped, so the waiting cards stay (T4) | Kept: waiting cards stay |
| Nothing typed, no card | Dropped | Kept: nothing changes |
| Which answer empties Ask a Question | None (no hand-off exists) | **New:** the first successful answer to a request sent after the latest tap |
| In-depth is showing an answered ruling at the tap | Ruling stays on screen; the carry lands behind it (code reading, not measured) | Kept; a follow-up under that ruling does not fire the hand-off; a new request from the review (✎ Edit) does |

The request text after a later tap is whatever In-depth's question box holds
when the player sends: the newly carried question unless the player edits it
in In-depth, or In-depth's own silent fallback ("Explain the interaction with
the provided game state") if the box is empty. No request-building code
changes.

Recommended, with the choices that have more than one reasonable answer:

- **Replace In-depth's text, even text typed there.** Recommended: it is
  today's behaviour for every card carry (rung 5), and "the latest tap wins" is
  what the player just did. The alternative, keeping text typed in In-depth and
  ignoring the new question, would make the second tap look broken.
- **A question-only later tap leaves waiting cards alone.** Recommended as the
  smallest change (rung 4): a carry only ever adds or replaces cards, never
  removes them. The alternative is to empty the waiting queue too, so In-depth
  matches Ask a Question's empty stage. The owner can choose it by Edit.
- **Ask a Question's own answer drops the hand-off.** Otherwise a later
  In-depth answer would compare against an Ask a Question that has moved on to
  a conversation. Its own answer already clears its Draft (REQ-108).
- **↺ Start over in In-depth drops the hand-off.** Otherwise a fresh walk
  entered later through the Menu, with a different question, could empty an
  Ask a Question the player never carried from again.

**The Draft-follows-the-box rule (REQ-108 and FLOW-017 slots).** In player
terms: whatever is in the box is what comes back after a reload. Exact wording:

> The Draft always matches what is staged on screen: every change to anything
> the Draft saves rewrites it at once, and the moment nothing is staged it is
> removed at once.

"Nothing is staged" uses the test Menu-leave already uses: for Ask a Question,
the question empty or spaces only and no card attached; for In-depth details,
the existing ten-field test in `snapshotMidFlightDraft`. The rule applies to
both destinations, because FLOW-017 requires the mid-flight exits to "behave
identically in both conversation-bearing destinations" (DEC-138).

Recommended over two alternatives, both noted in the REQ-108 slot:

- **Remove the Draft only when the box empties** (the quality-check's
  suggestion). It fixes clear-then-reload but not replace-then-reload (path
  P5: the older question still returns) or type-then-reload (P4: the question
  is still lost).
- **Snapshot at page hide** (when the browser hides or unloads the page). It
  fixes all three on a desktop reload, but phones do not reliably fire the
  page-hide events when a tab is closed from the app switcher or the browser is
  killed in the background, so a phone player could still see the old question.

Writing on every change has no such gap. The Draft is a small browser-local
entry, so writing it on each keystroke costs nothing a player would notice.

## Player-facing outcome

- Tapping **In-depth** with a typed question and no card brings that question
  into In-depth's question box, the same as it already does with a card.
- Once In-depth answers a carried question that the player left alone, Ask a
  Question is empty on the next visit and after a reload: only the faint hint,
  and on desktop the button reads "◈ In-depth". The carried cards leave too.
- If the player changed the question or the cards after the tap, Ask a Question
  keeps both, as new work.
- Tapping In-depth by mistake and pressing Back still finds the question
  waiting, because nothing is cleared until In-depth has answered.
- Tapping In-depth a second time brings the new question into In-depth's
  question box, replacing what was there, with or without a card. The walk
  stays where it was. Only the answer to that second hand-off empties Ask a
  Question.
- Clearing the Ask box sticks. An emptied box stays empty after a reload or a
  Menu trip, and a replaced question comes back as the new text, never the
  older one.
- A question typed and then reloaded comes back, as REQ-108 already promises.
- A reload in the middle of the In-depth walk resumes it, carried cards and
  question included, as REQ-206 already promises.

## Acceptance criteria

Criteria 1–9e belong to the REQ-206 slot. Criteria 10–13 belong to the
REQ-108 and FLOW-017 slots. Criteria 14–16 hold either way. "Return through the
Menu" means Menu → In-depth details, not the In-depth button, which would make
a new carry. "Walk to Finish" means Game → Zones → Cards (placing any carried
card, or adding one there when none was carried) → Context → Finish, where
In-depth's question box is. "The request text" is the `question` field of the
In-depth request that is sent.

1. **Question-only carry arrives.** With no card attached, type
   `How does ward work?` and tap In-depth. When the walk reaches the question
   box (Context → Finish), the box holds `How does ward work?`. A request sent
   from there carries that question, not the "Explain the interaction with the
   provided game state" fallback.
2. **An untouched carry clears after the In-depth answer.** Type a question
   (with or without cards), tap In-depth, finish the walk and get an answer.
   Open Ask a Question from the Menu: textarea `value` is `""`,
   `data-fill="0"`, no card on the stage, `thejudge.conversationDraft.lookup`
   absent. Reloading gives the same result. Question History shows no Ask a
   Question Draft row.
3. **Survives a reload mid-walk.** Type `How does ward work?`, attach Sol
   Ring, tap In-depth, reload once. In-depth details still holds Sol Ring
   (waiting for a zone) and the question. Finish and get the answer: Ask a
   Question is empty and its Draft is gone, as in criterion 2.
4. **Back before an answer keeps the question.** Type a question, tap
   In-depth, tap Back. Ask a Question still holds the question.
5. **Edit to only the question keeps both.** Type `How does ward work?`,
   attach Sol Ring, tap In-depth, tap Back. Change the question to
   `How does ward work with hexproof?`, leave Sol Ring. Return through the
   Menu, finish the walk, get the answer. Ask a Question holds
   `How does ward work with hexproof?` and Sol Ring, and the stored Draft holds
   both.
6. **Edit to only the cards keeps both.** Same carry. Tap Back, leave the
   question, attach Lightning Bolt (stage: Sol Ring, Lightning Bolt). Return
   through the Menu, get the answer. Ask a Question holds `How does ward work?`
   with both cards, and the Draft holds them. Repeat with removing Sol Ring
   instead: the question stays with no card, and the Draft holds the question.
7. **Emptied box counts as a change.** Same carry. Tap Back, empty the box,
   leave Sol Ring. Return through the Menu, get the answer. Ask a Question
   holds an empty box and Sol Ring; the Draft holds Sol Ring and an empty
   question.
8. **A spaces-only edit is not a change.** Same carry. Tap Back, add a
   trailing space to the question. Return through the Menu, get the answer.
   Ask a Question is cleared as in criterion 2.
9. **The latest tap wins, with a card.** Type `How does ward work?`, attach
   Sol Ring, tap In-depth, walk to Finish (Sol Ring on the Battlefield). Type
   `Edited inside In-depth` in In-depth's question box. Menu → Ask a Question
   (it still holds `How does ward work?` and Sol Ring), change the question to
   `How does ward work with hexproof?`, tap In-depth again. In-depth details
   is still at Finish; its question box holds
   `How does ward work with hexproof?` (the In-depth edit is gone); Sol Ring
   is still on the Battlefield and is waiting for a zone again. Send from
   Finish: the request text is `How does ward work with hexproof?`. After the
   answer, Ask a Question is cleared as in criterion 2.
9a. **The latest tap wins, question only.** With no card attached, type
    `How does ward work?`, tap In-depth, walk to Finish (the box holds
    `How does ward work?`). Menu → Ask a Question, change the question to
    `What does hexproof stop?`, tap In-depth again. In-depth's question box
    holds `What does hexproof stop?`, and the card added inside In-depth is
    still placed. Edit In-depth's box to `What does hexproof stop on the
    stack?` and send: the request text is that edited text. After the answer,
    Ask a Question is cleared as in criterion 2, because only Ask a Question
    is compared and it was untouched since the latest tap.
9b. **A blank box with a card carries the card fallback, and still clears.**
    Type `How does ward work?`, attach Sol Ring, tap In-depth, walk to Finish.
    Menu → Ask a Question, empty the box (Sol Ring stays), tap In-depth again.
    In-depth's question box holds `Tell me about Sol Ring.`; send: the request
    text is `Tell me about Sol Ring.`. After the answer, Ask a Question has an
    empty box and no card, and `thejudge.conversationDraft.lookup` is absent
    (the snapshot was the empty box and Sol Ring, and both still match).
9c. **A tap with nothing changes nothing.** From 9's state before the second
    tap, Menu → Ask a Question, empty the box, remove Sol Ring, tap In-depth.
    In-depth's question box still holds `Edited inside In-depth`, and its
    cards are as they were.
9d. **An answer from before the latest tap does not clear.** Type
    `How does ward work?`, attach Sol Ring, tap In-depth, walk to Finish, send,
    and while the request is in flight go Menu → Ask a Question and change the
    question to `What does hexproof stop?`, then tap In-depth again. When the
    first request's answer arrives, Ask a Question still holds
    `What does hexproof stop?` and Sol Ring. Send from In-depth's question box
    (now `What does hexproof stop?`) and get the answer: Ask a Question is
    cleared as in criterion 2. (In a unit test, hold the first response until
    after the second tap.)
9e. **A follow-up, Ask a Question's own answer, and Start over never fire it.**
    (i) Carry `How does ward work?` with Sol Ring, then change Ask a
    Question's question to `What does hexproof stop?` before In-depth answers,
    so that answer clears nothing (criterion 5). Tap In-depth again: the
    ruling stays on screen, as today. Send a follow-up under it and get the
    answer: Ask a Question still holds `What does hexproof stop?` and Sol Ring.
    Tap ✎ Edit and send from the review (its question box holds
    `What does hexproof stop?`): after that answer, Ask a Question is cleared
    as in criterion 2. (ii) Carry, tap Back, send the question from Ask a
    Question itself and get its answer; then Menu → In-depth details, finish
    and send: Ask a Question's conversation is untouched. (iii) Carry, tap
    ↺ Start over in In-depth details (it lands on Ask a Question), note what
    Ask a Question holds and leave it alone, Menu → In-depth details, walk a
    new question and get the answer: Ask a Question holds exactly what it held
    before that answer.
10. **Clear then reload stays empty.** Type `How does ward work?`, Menu → Life
    Tracker → Menu → Ask a Question, clear the box. Before any reload,
    `thejudge.conversationDraft.lookup` is absent. Reload with no pause: the
    textarea `value` is `""`, `data-fill="0"`, the Draft is still absent, and
    on desktop the button reads "◈ In-depth". Repeat with the Draft saved by
    attaching then removing Sol Ring instead of the Menu trip: same result.
11. **Clear with a card kept.** Type the question, attach Sol Ring, clear the
    box, reload. The box is empty and Sol Ring is still on the stage; the
    Draft holds Sol Ring and an empty question.
12. **Replace then reload, and type then reload.** Type, Menu-leave and
    return, replace the text with `What does hexproof stop?`, reload: the box
    holds `What does hexproof stop?`. From clean storage, type
    `How does ward work?` and reload with no Menu trip: the box holds
    `How does ward work?`.
13. **Same rule in In-depth details.** Walk to In-depth's question box, type a
    question, Menu-leave and return, clear the box, reload: In-depth's question
    box is empty, and `thejudge.conversationDraft.game` holds an empty
    question.
14. **Desktop at rest (1440x900), empty and unfocused:** textarea `value` is
    `""`, the hint is "What would you like to know?", `data-fill="0"`, no
    focus, and the In-depth button shows "◈ In-depth", its label element
    computed `display: block`, about 96px wide. Focusing the box or typing
    still folds it to ◈ (REQ-206, unchanged).
15. **Phone at rest (390x844), empty and unfocused:** textarea `value` is
    `""`, the hint is "Your question…", `data-fill="0"`, no focus, and the
    In-depth button shows ◈ only (label `display: none`, about 35px), per
    REQ-206's under-480px rule. No change from today.
16. **No regressions:** an unsent, uncarried question still comes back after a
    Menu trip or a reload (REQ-108); Ask a Question's own answer still clears
    its Draft; opening a saved conversation still saves the staged attempt as
    a Draft first; **✎ Edit cards** still returns cards and question;
    **↺ Start over** still empties everything.

## Touched files (expected)

- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`:
  run the existing `snapshotMidFlightDraft` on every change to the question as
  well as the cards (today's `selectedCards` effect, 252, gains `question`),
  keeping its first-pass skip so the mount restore is never overwritten by the
  pre-restore empty state. At each In-depth tap, remember Ask a Question's own
  state as the snapshot (its trimmed box text, not the fallback sent when the
  box is blank, and its card ids), replacing any earlier one. On the "carry
  answered" signal, clear the question, the cards and the Draft only when both
  match. Its own first successful answer drops the snapshot.
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`: accept a
  question-only carry, setting the question box from it (keep the
  card-placement path, 240-241, for card carries only, so a carry with no card
  leaves the cards as they are). Run its `snapshotMidFlightDraft` on every
  change to a field the Draft saves, with the same first-pass skip, so a
  reload mid-walk resumes. Mark the next request sent after a carry lands as
  the carried attempt (a retry keeps the mark; a follow-up never carries it);
  on that attempt's first successful answer, send the "carry answered" signal
  back once. ↺ Start over (`handleStartOver`) drops the mark.
- `apps/frontend/src/lib/portal/seedContext.tsx`: the existing one-slot
  cross-destination mailbox (`queueLookupCarry`/`consumeLookupCarry`) gains the
  return signal.
- `apps/frontend/src/lib/conversationHistory/persistence.ts`: the carry
  snapshot, and that an attempt came from a carry, stored with the Drafts so
  both survive a reload.
- Tests: `MtgAssistantApp.carry-placement.test.tsx` (criteria 1, 9, 9a, 9b,
  9c: In-depth's question box, cards and the request text after a later tap),
  `App.mid-flight-draft.test.tsx` (criteria 2–13), `seedContext.test.tsx`.
- `PRD/sections/functional-requirements.md` (REQ-206, REQ-108),
  `PRD/sections/user-flows.md` (FLOW-017) and
  `PRD/sections/quick-lookup/README.md`, applied at build from the approved
  `GATE-QUESTIONS.md`.

No CSS change. The REQ-206 fold rule (`flow.css` 281-289), the hint tiers
(`ComposerPill.tsx`), and the hint colour stay as they are.

## Non-goals

- No change to the hint wording, the hint colour, the hint tiers, or the
  In-depth fold rule.
- No change to REQ-108's restore of an unsent, uncarried question; the rule
  only makes the saved copy match the box.
- No clean-up of Drafts already sitting in players' browsers. Those carry no
  carry record, so the hand-off never clears them. After this change a player
  clears one by emptying the box, which removes it at once.
- No change to the follow-up composer, or to In-depth's own question box
  beyond receiving a question-only carry and the Draft-follows-the-box rule.
- No expiry of old Drafts and no clear (✕) control on the box.
- No change to how a later tap treats cards already placed in In-depth
  details. Today a card carried twice can be on the Battlefield and waiting for
  a zone at once (measurements section 6, T2); the player resolves it with
  "Leave this card out". That is REQ-209's placement territory.
- No change to a later tap landing while In-depth details shows an answered
  ruling: the ruling stays on screen and the carry waits behind ✎ Edit, as
  today (code reading; not measured live).

## Material assumptions (assumption ladder)

| # | Question | Resolved by | Evidence |
| --- | --- | --- | --- |
| 1 | Is the owner seeing a real value or a bright hint? | Measurement (rung 2) | On desktop the label hides only on focus or text; nothing focuses the box on load; the hint is measurably dimmer. A desktop shrunk button means real text. |
| 2 | Should a question-only carry bring the question? | REQ-206 text (rung 1) | "carrying every attached card and the typed question (or its silent fallback)". The early return is a bug. |
| 3 | When should a carried question leave Ask a Question? | REQ-108 (rung 1) + preserve visible behaviour (rung 5) + smallest reversible scope (rung 4) | REQ-108: a Draft clears "on first successful answer for the attempt". Clearing at the answer, not the tap, keeps Back-after-a-mistaken-tap working. Proposed in the REQ-206 slot; the owner rules. |
| 4 | What counts as "changed" after a carry, and does a partial edit keep both halves? | Quality-check recommendation + preserve visible behaviour (rung 5) | A state comparison against what Ask a Question held at the latest tap (trimmed question, card-id set), all or nothing, an emptied box counts as a change. Keeps anything the player touched. Proposed in the REQ-206 slot; the owner rules. |
| 5 | Is the phone's ◈-only button part of the bug? | REQ-206 text (rung 1) | "the `<480px` always-icon-only rule is unchanged". By design. |
| 6 | When should the Draft be written and removed? | REQ-108 text (rung 1) + measurement (rung 2) | REQ-108 already says the Draft "is written/updated as mid-flight staging changes enough to resume meaningfully after Menu leave, reload, or opening a saved conversation"; measurement shows it does not on reload (P1, P2, P2b, P4, P5). Every-change recommended over remove-on-empty and page-hide (see "The three rules"). Proposed in the REQ-108 and FLOW-017 slots; the owner rules. |
| 7 | Does the Draft rule apply to In-depth details too? | FLOW-017 text (rung 1) + measurement (rung 2) | FLOW-017: the mid-flight exits "must behave identically in both conversation-bearing destinations (DEC-138)". Measurement 5a: In-depth loses its walk on reload, against REQ-206's reload promise. |
| 8 | What does In-depth's question box hold after a later tap, and which answer empties Ask a Question? | Measurement (rung 2) + local code pattern (rung 3) + preserve visible behaviour (rung 5) + smallest scope (rung 4) | Section 6, T1–T4: a card carry already replaces In-depth's box, even text typed there; the proposal keeps that and extends it to question-only carries. Each tap is a new carried attempt; only an answer to a request sent after the latest tap fires the hand-off, once. A question-only later tap leaves waiting cards alone (alternative: empty them). Proposed in the REQ-206 slot; the owner rules. |
| 9 | Is the snapshot what was sent to In-depth, or what Ask a Question held? | Measurement (rung 2) | Section 6, T3: a blank box with a card sends "Tell me about Sol Ring.", which never matches an empty box. Comparing against what was sent would make a cards-only carry never clear. The snapshot is Ask a Question's own box and cards. |
The alternative of clearing Ask a Question the moment In-depth is tapped was
considered and not chosen: it would lose the question if the player taps
Back, and REQ-108 ties clearing to an answer.

No question met the genuine-blocker test: every open choice is a proposal with
a recommendation, ruled on through the three gate verdicts.

## PRD alignment and proposed product truth

- **REQ-206 (amended):** one acceptance criterion carrying the carry hand-off
  rule and the later-tap rule word for word, a tests line, and a dated note.
- **`PRD/sections/quick-lookup/README.md`:** the Entry bullet about the Add
  in-depth details pill carries the hand-off rule word for word and a
  one-sentence summary of the later-tap rule. Part of the REQ-206 slot.
- **REQ-108 (amended):** the "Draft is written/updated" criterion becomes the
  Draft-follows-the-box rule, plus a dated note.
- **FLOW-017 (amended):** step 1 says the Draft is rewritten at once on every
  change; two edge cases (emptied staging, replaced question); a dated note.
- If REQ-108 is rejected, FLOW-017 should be rejected with it, and criteria
  10–13 leave the build. Criterion 3 still needs In-depth to save its Draft
  when the carry lands, which REQ-206's existing reload promise already
  requires.
- No new REQ, FLOW, screen, or decision-log entry.

## Verification for the build

- Unit and integration tests for criteria 1–13 (including 9a–9e) and 16
  (Vitest, jsdom).
- Live browser check at 1440x900 and 390x844 on the dev build, first with
  clean storage, then on paths B and C (measurements section 2) and P1–P5
  (section 5), recording the same columns (value, cards, `data-fill`, label,
  stored Draft). Criteria 14 and 15 are checked there.
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
