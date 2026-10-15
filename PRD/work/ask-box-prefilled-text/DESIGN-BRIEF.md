# Design brief — Ask box shows an old question instead of the hint

**Decide:** two slots in `GATE-QUESTIONS.md`, both accepted by the owner:
REQ-108 and FLOW-017 (the saved unsent question follows the box as the player
edits, so clearing it sticks). The third slot, REQ-206 (the In-depth hand-off),
was rejected: the owner narrowed the fix to text cleared from the Ask box not
coming back after a refresh, and the In-depth hand-off stays as today. No new
stable ID. No blocker.

## The answer in one paragraph

The Ask box is not showing a styled-up hint. It holds a real, old question: the
player's own question saved as Ask a Question's **Draft** (the browser-local
copy of an unsent question that REQ-108 restores on every visit and reload).
Because the box holds text, the In-depth button folds down to its ◈ glyph,
which is exactly what REQ-206 tells it to do when the box holds text. The
Draft is only saved at a few moments (leaving by the Menu, attaching or
removing a card), so once one exists, emptying the box and reloading brings the
old question back. The fix is that the Draft follows the box: rewritten on
every change, removed the moment nothing is staged. On a clean first visit
nothing is wrong, on the dev build or the live site.

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
- **Clear then reload (the owner's report, measurements section 5):**
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
- **How a Draft comes to exist (context only, today's behaviour, not
  changed):** type, tap In-depth, tap Back or reload, and the box holds the
  question as real text, `data-fill="some"`, the In-depth label hidden (35px).
  After an In-depth answer the old question is still in Ask a Question and
  Question History lists it as an **Ask a Question · Draft** row. That
  hand-off is out of scope (see Non-goals); the Draft rule below makes any such
  leftover disappear the moment the player empties the box.

## Root cause

The **Draft is a snapshot taken at a few moments, so it falls behind the box.**
`snapshotMidFlightDraft` (`QuickLookupApp.tsx` ~214) writes the Draft, or
removes it when nothing is staged. It runs only on Menu-leave (234), on opening
a saved conversation (183), and on attaching or removing a card (252). Typing
in the box or emptying it runs none of these, and no page-hide save exists
anywhere in the frontend. So an emptied or replaced question is never written,
and the mount restore (~167) brings back the older one after a reload.
In-depth details has the same design (`MtgAssistantApp.tsx` ~372, run only at
Menu-leave ~413 and on opening a saved conversation ~795), which is why a
reload mid-walk loses the carried walk that REQ-206 promises survives a
reload.

The shrunk button is a consequence, not a separate bug. REQ-206 folds the chip
to ◈ "once the question field is focused or the box holds text", and on any
screen under 480px it is ◈-only always.

## The rule this package proposes

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

- Clearing the Ask box sticks. An emptied box stays empty after a reload or a
  Menu trip, and a replaced question comes back as the new text, never the
  older one.
- A question typed and then reloaded comes back, as REQ-108 already promises.
- A reload in the middle of the In-depth walk resumes it, carried cards and
  question included, as REQ-206 already promises.
- The In-depth button behaves as it does today: it still hands the cards and
  question over, and it folds to ◈ whenever the box holds text.

## Acceptance criteria

Criteria 1–5 belong to the REQ-108 and FLOW-017 slots. Criteria 6–8 hold
either way. "Return through the Menu" means Menu → In-depth details, not the
In-depth button. "Walk to Finish" means Game → Zones → Cards (placing any
carried card, or adding one there when none was carried) → Context → Finish,
where In-depth's question box is.

1. **Survives a reload mid-walk.** Type `How does ward work?`, attach Sol
   Ring, tap In-depth, reload once. In-depth details still holds Sol Ring
   (waiting for a zone) and the question.
2. **Clear then reload stays empty.** Type `How does ward work?`, Menu → Life
   Tracker → Menu → Ask a Question, clear the box. Before any reload,
   `thejudge.conversationDraft.lookup` is absent. Reload with no pause: the
   textarea `value` is `""`, `data-fill="0"`, the Draft is still absent, and
   on desktop the button reads "◈ In-depth". Repeat with the Draft saved by
   attaching then removing Sol Ring instead of the Menu trip: same result.
3. **Clear with a card kept.** Type the question, attach Sol Ring, clear the
   box, reload. The box is empty and Sol Ring is still on the stage; the
   Draft holds Sol Ring and an empty question.
4. **Replace then reload, and type then reload.** Type, Menu-leave and
   return, replace the text with `What does hexproof stop?`, reload: the box
   holds `What does hexproof stop?`. From clean storage, type
   `How does ward work?` and reload with no Menu trip: the box holds
   `How does ward work?`.
5. **Same rule in In-depth details.** Walk to In-depth's question box, type a
   question, Menu-leave and return, clear the box, reload: In-depth's question
   box is empty, and `thejudge.conversationDraft.game` holds an empty
   question.
6. **Desktop at rest (1440x900), empty and unfocused:** textarea `value` is
   `""`, the hint is "What would you like to know?", `data-fill="0"`, no
   focus, and the In-depth button shows "◈ In-depth", its label element
   computed `display: block`, about 96px wide. Focusing the box or typing
   still folds it to ◈ (REQ-206, unchanged).
7. **Phone at rest (390x844), empty and unfocused:** textarea `value` is
   `""`, the hint is "Your question…", `data-fill="0"`, no focus, and the
   In-depth button shows ◈ only (label `display: none`, about 35px), per
   REQ-206's under-480px rule. No change from today.
8. **No regressions:** an unsent, uncarried question still comes back after a
   Menu trip or a reload (REQ-108); Ask a Question's own answer still clears
   its Draft; opening a saved conversation still saves the staged attempt as
   a Draft first; **✎ Edit cards** still returns cards and question;
   **↺ Start over** still empties everything; the In-depth button's hand-off
   behaves as it does today.

## Touched files (expected)

- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`:
  run the existing `snapshotMidFlightDraft` on every change to the question as
  well as the cards (today's `selectedCards` effect, 252, gains `question`),
  keeping its first-pass skip so the mount restore is never overwritten by the
  pre-restore empty state.
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`: run its
  `snapshotMidFlightDraft` on every change to a field the Draft saves, with the
  same first-pass skip, so a reload mid-walk resumes. No change to how a carry
  is consumed.
- Tests: `App.mid-flight-draft.test.tsx` (criteria 1–5).
- `PRD/sections/functional-requirements.md` (REQ-108) and
  `PRD/sections/user-flows.md` (FLOW-017), applied at build from the approved
  `GATE-QUESTIONS.md`.

No CSS change. The REQ-206 fold rule (`flow.css` 281-289), the hint tiers
(`ComposerPill.tsx`), and the hint colour stay as they are.

## Non-goals

- No change to the In-depth hand-off (REQ-206 slot rejected by the owner,
  2026-10-14). A question typed with no card still stays behind in Ask a
  Question and does not arrive in In-depth's question box, nothing empties Ask
  a Question after the In-depth answer, and a second tap behaves as it does
  today. The measurements of these behaviours are kept in
  `evidence/measurements.md` (sections 2, 3, 6) as evidence only. The owner
  may open a separate package for them.
- No change to the hint wording, the hint colour, the hint tiers, or the
  In-depth fold rule.
- No change to REQ-108's restore of an unsent, uncarried question; the rule
  only makes the saved copy match the box.
- No clean-up of Drafts already sitting in players' browsers. After this
  change a player clears one by emptying the box, which removes it at once.
- No change to the follow-up composer, or to In-depth's own question box
  beyond the Draft-follows-the-box rule.
- No expiry of old Drafts and no clear (✕) control on the box.

## Material assumptions (assumption ladder)

| # | Question | Resolved by | Evidence |
| --- | --- | --- | --- |
| 1 | Is the owner seeing a real value or a bright hint? | Measurement (rung 2) | On desktop the label hides only on focus or text; nothing focuses the box on load; the hint is measurably dimmer. A desktop shrunk button means real text. |
| 2 | Should a question-only carry bring the question? | Owner verdict (REQ-206 reject, 2026-10-14) | Not proceeding. The owner narrowed the fix to cleared text not coming back after a refresh; today's In-depth hand-off stays. |
| 3 | When should a carried question leave Ask a Question? | Owner verdict (REQ-206 reject, 2026-10-14) | Not proceeding. Nothing is cleared after the In-depth answer; today's behaviour stands. |
| 4 | What counts as "changed" after a carry? | Owner verdict (REQ-206 reject, 2026-10-14) | Not proceeding; no carry comparison exists in this package. |
| 5 | Is the phone's ◈-only button part of the bug? | REQ-206 text (rung 1) | "the `<480px` always-icon-only rule is unchanged". By design. |
| 6 | When should the Draft be written and removed? | REQ-108 text (rung 1) + measurement (rung 2) + owner verdict (REQ-108 accept, 2026-10-14) | REQ-108 already says the Draft "is written/updated as mid-flight staging changes enough to resume meaningfully after Menu leave, reload, or opening a saved conversation"; measurement shows it does not on reload (P1, P2, P2b, P4, P5). Every-change recommended over remove-on-empty and page-hide (see "The rule this package proposes"). The owner accepted it. |
| 7 | Does the Draft rule apply to In-depth details too? | FLOW-017 text (rung 1) + measurement (rung 2) + owner verdict (FLOW-017 accept, 2026-10-14) | FLOW-017: the mid-flight exits "must behave identically in both conversation-bearing destinations (DEC-138)". Measurement 5a: In-depth loses its walk on reload, against REQ-206's reload promise. |
| 8 | What does In-depth's question box hold after a later tap? | Owner verdict (REQ-206 reject, 2026-10-14) | Not proceeding; a second tap behaves as today. |
| 9 | Is the snapshot what was sent to In-depth, or what Ask a Question held? | Owner verdict (REQ-206 reject, 2026-10-14) | Not proceeding; no snapshot exists in this package. |

No question met the genuine-blocker test: every open choice was a proposal with
a recommendation, ruled on through the gate verdicts.

## PRD alignment and proposed product truth

- **REQ-108 (amended):** the "Draft is written/updated" criterion becomes the
  Draft-follows-the-box rule, plus a dated note.
- **FLOW-017 (amended):** step 1 says the Draft is rewritten at once on every
  change; two edge cases (emptied staging, replaced question); a dated note.
- REQ-108 and FLOW-017 go together; they state the same rule.
- **REQ-206 and `PRD/sections/quick-lookup/README.md`:** unchanged. The
  proposed REQ-206 amendment and README sentence were rejected and removed from
  the proposal.
- No new REQ, FLOW, screen, or decision-log entry.

## Verification for the build

- Unit and integration tests for criteria 1–5 and 8 (Vitest, jsdom).
- Live browser check at 1440x900 and 390x844 on the dev build, first with
  clean storage, then on paths B and C (measurements section 2) and P1–P5
  (section 5), recording the same columns (value, cards, `data-fill`, label,
  stored Draft). Criteria 6 and 7 are checked there.
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
