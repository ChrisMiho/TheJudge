# Bug diagnosis — ten player-flow fixes (health-flow)

Bugs 1–5 were diagnosed on 2026-10-20. Bugs 6–10 were added on 2026-10-22
(graph run `graph-20261023-020331`, define attempt after quality-check FAIL 1)
by code reading against the same commit; their sections follow bug 5. Each
section names the files, the line evidence, and the unit test that would have
caught it.

**Summary**
1. Follow-up after a long answer: the app sends past answers whole, and the server rejects any one message over 10,000 characters. Only the mock AI hits it today: real answers peak at 2,556 characters. Fix: trim each history message before sending (1 file, about 10 lines).
2. Reopened conversation wipes the Draft: every successful answer clears the Draft, follow-ups included. Fix: clear it only on a conversation's first answer (3 files, about 6 lines). Players hit this in production.
3. Feedback form loses focus on close: the ☰ Menu button is hidden while the Menu is open, so the app's "focus ☰ first" trick silently fails. Fix: close the Menu before running the action (1 file, about 4 lines). Players hit this in production. The unit test passes only because the test browser ignores CSS.
4. Draft row does nothing over an answered thread: the Draft loads behind the thread, which stays on screen. Fix: leave the thread the way ✎ Edit cards does, then load the Draft (1–2 files, about 4–8 lines). Players hit this in production.
5. In-Depth Exit scan keeps one card: each held card is added to the same old copy of the zone, so the last add wins. Fix: read the zone from a live ref, as Trade Balancer does (1 file, about 8 lines). Players hit this in production.
6. The 11th follow-up fails: the server takes at most 20 history messages and the app never trims. Fix: keep the opening exchange and drop the oldest later ones (same file as fix 1, about 15 lines). Players hit this in production, real AI included.
7. Question History loses focus on close: nothing moves focus to ☰ Menu before the sheet opens, and ☰ is hidden at that moment anyway. Fix: close the tray first, focus ☰, then open the sheet (1 file, about 5 lines). Players hit this in production.
8. Trade Balancer's printing picker has no "N printings" line: it was removed on purpose on 2026-10-02 to match the mockup, and a unit test pins its absence; REQ-065 still promises it. Fix: render the count and flip that test (1 file plus its test, about 5 lines).
9. Feedback from Ask a Question carries no question, cards or conversation: Ask a Question never registers a snapshot contributor. Fix: register one, with a field for attached cards (3 files, about 20 lines).
10. Life Tracker "−" centre tap opens counters: the spec says the counters preview takes its own taps inside the "−" half, so this is specified behavior, not a defect. Waits on blocker question Q-015 (recommended: drop the fix).

Method: code reading for all five. Live headless-Chrome repro for bug 3 (this file). Bugs 1, 2, 4 and 5 were already reproduced live in the flow walks (`flow-walks-ask.md`, `flow-walks-trade-scan.md`). Unit test run: `App.feedback.test.tsx -t "restores focus"` passes (a false green, see bug 3). Real answer lengths come from 8,089 saved eval transcripts in `~/Coding/Projects/TheJudge-backups/`.

---

## Bug 1 — FLOW-005: follow-up after a long answer fails

**Player today.** In mock mode the first answer is about 19,000 characters, because it prints the whole prompt. The first follow-up shows the validation error "conversationHistory.1.content String must contain at most 10000 character(s)", and the thread cannot continue.

**PRD promises.**
- `PRD/sections/user-flows.md:117`: "when the backend is running in mock mode, the assistant bubble still appends in the same chat thread and its answer contains the exact assembled LLM-facing prompt".
- `PRD/sections/user-flows.md:116`: "if history chars exceed `MAX_CONVERSATION_HISTORY_CHARS` (6000), oldest turns are truncated before the prompt is assembled".

**Root cause.**
- The client sends the visible thread as history, unchanged: `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts:331` (`const conversationHistory = visibleMessages;`). It never trims.
- The server rejects any single message over 10,000 characters before it does anything else: `apps/backend/src/validation/askAiRequest.ts:225-228` (`content: boundedText(10000)`).
- The server's "oldest turns truncated first" step does exist (`apps/backend/src/prompt/preparation.ts:375`, `promptAssembly.ts:72`). It runs only after validation, and its budget is 1,000,000 characters (`apps/backend/src/prompt/normalization.ts:5`). It can never rescue a single long message.

**Does the PRD agree with itself?** No. Three numbers, none matching the code:
- FLOW-005 (`user-flows.md:116`) says the history budget is 6,000. REQ-027 (`functional-requirements.md:521`) says it is 1,000,000. `PRD/sections/in-depth/README.md:501-506` already flags this conflict.
- REQ-027 (`functional-requirements.md:518`) and `integrations-and-data.md:88` say "max 2000 chars/message". The code enforces 10,000. REQ-247's notes (`functional-requirements.md:6608`) records the 10,000 cap as live.
- Neither number tells the client to trim. Truncation is described as a server-side, whole-history step.

**Can real players hit it?** Not today. The OpenAI call sets no output-token cap (`apps/backend/src/providers/openAiResponsesProvider.ts:102`, only `model` and `input`). The deployed model is `gpt-6-luna` (`apps/backend/src/config/index.ts:7`). Measured from saved eval transcripts:

| model | answers | median | 90th pct | 99th pct | longest | over 10k |
|---|---|---|---|---|---|---|
| gpt-6-luna (production) | 7,557 | 512 | 837 | 1,224 | 2,556 | 0 |
| gpt-4.1 (older) | 532 | 1,694 | 3,376 | 5,070 | 6,415 | 0 |

So this is mock-only in practice. Nothing stops a real answer from passing 10,000, though, and the PRD's own 2,000-per-message figure would break about 1 in 400 real Luna answers if anyone enforced it.

**Smallest fix.** In `submitFollowUp` (`useAskAiSubmitOrchestration.ts:323-339`), send each history message cut to the server's per-message cap (10,000), with a short "[truncated]" tail. The thread on screen and the saved history keep the full text. Put the 10,000 in one named frontend constant that points at `askAiRequest.ts:228`. Retry reuses the same payload, so it is covered too. (Superseded 2026-10-22 by the owner's "imported, not copied": both caps are defined once in `apps/backend/src/constants.ts` and imported by the client; see bug 6.)
- Files: `useAskAiSubmitOrchestration.ts` (+ its test). About 10 lines plus 1 test.
- PRD cleanup (docs only): REQ-027 and `integrations-and-data.md:88` say 2,000 per message; make them say 10,000 with client trim. FLOW-005:116 says 6,000; make it say the shared cap.
- Should a unit test have caught it? Yes. No test sends a follow-up after an answer over 10,000 characters. The backend validation is tested on its own; the client-to-server contract is not.

**Flow-test check.** Ask a question in mock mode (no answer shortening). Send a follow-up. A second answer appears and no error shows.

**Size.** 1 code file, about 10 lines; 1 unit test; 3 PRD lines.

---

## Bug 2 — FLOW-016/017: a reopened conversation's Draft is wiped by the next follow-up

**Player today.** The player has a half-typed question (the Draft). They reopen a saved conversation from Question History. The Draft is saved and shows as the DRAFT row. They send one follow-up in the reopened thread. The DRAFT row is gone, and so is the half-typed question.

**PRD promises.**
- `PRD/sections/user-flows.md:401` (FLOW-017 5a): "Selecting a *completed* conversation from a pre-submit step snapshots the current staging to the Draft slot first … The staged attempt is immediately recoverable as the **Draft** row in Question History".
- `user-flows.md:406`: the Draft is cleared on the "first successful submit while a Draft exists **for the attempt**". A follow-up in another conversation is not that attempt's submit.

**Root cause.** Every successful answer fires the same "conversation updated" callback, follow-ups included (`apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts:172` for the first answer, `:245` for each follow-up). Both flows clear the Draft in that callback with no check for which kind of answer it was:
- Ask a Question: `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx:149-152` (`clearDraft("lookup")`)
- In-Depth: `apps/frontend/src/components/portal/MtgAssistantApp.tsx:348-350` (`clearDraft("game")`)

On a fresh conversation this does no harm, because the first answer already cleared the Draft. It only bites after a resume, when the Draft belongs to a different, unsent attempt. Confirmed by code reading. Seen live at both sizes in the walk (`flow-walks-ask.md:149,184`).

**Smallest fix.** Add `isFirstAnswer: boolean` to `ConversationUpdateSnapshot`: `true` from the first-answer path (`:172`), `false` from the follow-up path (`:245`). In both flows, call `clearDraft` only when it is true. Saving to history stays unchanged.
- Files: `useAskAiSubmitOrchestration.ts`, `QuickLookupApp.tsx`, `MtgAssistantApp.tsx`. About 6 lines.
- Should a unit test have caught it? Yes. `App.mid-flight-draft.test.tsx` covers "snapshot on resume" (`:186`, `:228`) and "clear on first answer" (`:140`), but never sends a follow-up after a resume.

**Flow-test check.** Type a draft question, reopen a saved conversation, and send a follow-up. Reopen Question History: the DRAFT row is still there, and choosing it brings the draft question back.

**Size.** 3 files, about 6 lines; 1 unit test per flow.

---

## Bug 3 — FLOW-014: closing the feedback form does not return focus to ☰ Menu

**Player today.** The player opens ☰ Menu and chooses Send feedback, then closes the form with Esc or ✕. Keyboard focus lands on the page body, so a keyboard player has to tab in again from the top. Same at phone and desktop.

**PRD promises.**
- `PRD/sections/user-flows.md:331`: "Esc or the close control dismisses the modal and restores focus to the portal trigger".
- REQ-087 (`functional-requirements.md:2073`): "focus is restored to the trigger on close".

**Root cause.** The return path is designed. It breaks on one CSS rule.
1. `App.tsx:109-118`: on Send feedback, the app focuses ☰ (`button[aria-label="Switch feature"]`, `App.tsx:24`) *before* opening the form. The form's sheet then remembers whatever has focus when it mounts and refocuses that on close (`components/SheetShell.tsx:98-112`).
2. While the Menu tray is open, ☰ carries `aria-hidden="true"` (`components/portal/FeaturePortalMenu.tsx:341`). `apps/frontend/src/index.css:51-54` turns that into `visibility: hidden`.
3. A browser will not focus a `visibility: hidden` element, so step 1's `.focus()` silently does nothing. The Menu tray then unmounts (`FeaturePortalMenu.tsx:221-229`). Focus drops to the body, and the sheet remembers the body as its return target.

**Live repro (this diagnosis, headless Chrome, 390 and 1280 wide).** With the Menu open, ☰ computes to `visibility: hidden`, and calling `.focus()` on it leaves focus elsewhere. The focus log when opening the form reads `in: Send feedback → out: Send feedback → in: TEXTAREA`; ☰ never receives focus. After Esc, the focused element is `BODY`, and the ☰ node is still the same connected element. Script: `scratchpad/bug-diag/focus.cjs` (throwaway).

**Why the unit test is green.** `apps/frontend/src/App.feedback.test.tsx:228-248` asserts exactly this, and it passes. jsdom does not load `index.css` and ignores visibility on focus, so the hidden ☰ still accepts focus there. Only a real browser can catch this bug. That is the flow test's job.

**Smallest fix.** In `FeaturePortalMenu.handleSelect` (`:221-229`), for action entries, close the tray first with `flushSync(() => setIsOpen(false))`, then run `entry.onSelect()`. When the action runs, ☰ is no longer `aria-hidden` and can take focus, and App's existing pre-focus works unchanged. The more explicit alternative is to give `SheetShell` an optional return-target prop and have App pass the ☰ lookup; that touches 3 files and about 15 lines.
- Files: `FeaturePortalMenu.tsx`. About 4 lines.
- Should a unit test have caught it? It tried, but jsdom cannot see the cause. Optionally, harden it by asserting ☰ has no `aria-hidden` at the moment the action runs.

**Flow-test check.** From ☰ Menu, open Send feedback and press Esc: focus is on ☰ Menu. Open it again and press ✕: focus is on ☰ Menu again. Both sizes.

**Size.** 1 file, about 4 lines (or 3 files, about 15 lines for the explicit version).

---

## Bug 4 — FLOW-017: the Draft row does nothing while an answered thread is open

**Player today.** The player is reading an answered conversation in Ask a Question, for example one just reopened from history. They open Question History and choose the DRAFT row. The sheet closes and the answered thread stays. The draft question only appears after a reload.

**PRD promises.**
- `PRD/sections/user-flows.md:400` (FLOW-017 step 5): "Selecting Draft restores that flow's mid-flight staged state so the user can continue toward submit … re-hydrating from storage immediately".
- Owner decision 2026-10-20: choosing Draft opens the draft. The answered conversation is already saved in History.

**Root cause.**
- The Draft row's handler works: it closes the sheet, queues a "resume Draft" message, and selects Ask a Question (`apps/frontend/src/components/portal/FeaturePortalMenu.tsx:151-155`).
- Ask a Question receives the message and loads the Draft into its staging state (`QuickLookupApp.tsx:195-198` → `hydrateFromLookupDraft`, `:156-159`). It never leaves the answered thread.
- The page shows the thread whenever a conversation is active (`isConversationActive`, from `useAskAiSubmitOrchestration.ts:96`). The loaded Draft therefore sits behind the thread, out of sight.

Nothing blocks the handler; it simply skips "leave the thread". Confirmed by code reading. Seen live in the walk (`flow-walks-ask.md:183`).

**Smallest fix.** In the Draft branch (`QuickLookupApp.tsx:195-198`), if a conversation is active, leave the thread first, exactly as ✎ Edit cards does (`handleEditCards`, `:421-425`: `startOver()`, clear the active id, clear "Reopened from your history"). Then load the Draft. History already holds the answered conversation, so nothing is lost.
- In-Depth twin: `MtgAssistantApp.tsx:834-837` has the same shape. `hydrateFromGameDraft` moves the step but never ends the active conversation. It likely has the same bug in a different form: the old thread waits at the enrichment step. Not walked. DEC-138 requires both flows to match, so apply the same guard there using `handleEditContext` (`:795-798`).
- Files: `QuickLookupApp.tsx` (+ `MtgAssistantApp.tsx`). About 4 lines each.
- Should a unit test have caught it? Partly. `App.mid-flight-draft.test.tsx:118` covers choosing a Draft from a pre-submit page only. PRD:400 did not say what happens over an answered thread until the owner decided today.

**Flow-test check.** With an answered thread open, choose the DRAFT row in Question History. The Ask a Question page shows the draft question and its cards, ready to send, and the old thread is gone from the screen.

**Size.** 1–2 files, about 4–8 lines; 1 unit test per flow.

---

## Bug 5 — FLOW-006: In-Depth Exit scan adds only one held card

**Player today.** In In-Depth details, the player scans 2 or more cards into a zone (for example Battlefield). They tap Exit scan, and the zone gains only one card: the last one held. Measured live in the walk: 2 held gave 1, and 8 held gave 1, at both sizes.

**PRD promises.** `PRD/sections/user-flows.md:139` (FLOW-006 step 6): "Exit scan … commits every card still in the holding list to the zone, in hold order, through the existing add path … in one step".

**Root cause.** Exit scan loops over the held cards and calls the zone's add function once per card, all within one click (`apps/frontend/src/hooks/useScanCapture.ts:292-306`). In `apps/frontend/src/components/ZoneCollectionStep.tsx`:
- `activeZoneCards` is read once per render (`:89`).
- `addCardToActiveZone` appends to that same old list on every call (`:164-181`, `appendZoneCard(activeZoneCards, nextCard)`).
- `updateZoneCards` hands the parent a whole new zones object built from the old `zones` prop (`:157-162`). The parent stores it with a plain setter (`MtgAssistantApp.tsx:183`, wired at `:1099` and `:1127`).

So each call replaces the previous one, and the last held card wins. Confirmed by code reading; live repro in `flow-walks-trade-scan.md:9,53-58`.

**How the other two scan hosts differ.**
- Ask a Question adds with a functional state update, `setSelectedCards((current) => [...current, card])` (`QuickLookupApp.tsx:290`), so each add builds on the one before. Its duplicate and cap checks also read an old list, but the hold-time check (`:338-353`) has already blocked duplicates and overflow, so this is harmless.
- Trade Balancer reads and writes a live ref, `entriesRef.current` (`components/trade/TradeBalancer.tsx:262-275`), which updates immediately on each add.

**Smallest fix.** Mirror Trade Balancer. Keep `zonesRef` in `ZoneCollectionStep`, set to `zones` on each render. `addCardToActiveZone` reads `zonesRef.current[activeZone]`, and `updateZoneCards` writes the new zones object to `zonesRef.current` before calling `onZonesChange`. Remove and move then build on live data too.
- Files: `ZoneCollectionStep.tsx`. About 8 lines.
- Should a unit test have caught it? Yes, but it could not. `ZoneCollectionStep.test.tsx:18-19` mocks `useScanCapture` entirely, so no test ever sends two held cards through Exit scan. A new test should capture the `onScanCandidateSelected` passed in and call it twice in one act. That one test would have failed.

**Flow-test check.** In In-Depth details, open Battlefield, scan two cards, and tap Exit scan. Battlefield lists both cards, in hold order.

**Size.** 1 file, about 8 lines; 1 unit test.

---

## Other bugs found along the way (2026-10-20 notes; the first two are now bugs 7 and 6 below)

- **Question History also drops focus on close.** Open it from ☰ Menu and press Esc: focus lands on the page body (live, 1280 wide). REQ-103 (`functional-requirements.md:2554`) says the history sheet "returns focus to its trigger on close". This is probably the same root cause as bug 3: it is opened from inside the Menu tray while ☰ is hidden. The `flushSync` fix in bug 3 covers only action entries; History opens on a separate path inside `FeaturePortalMenu`.
- **The 11th follow-up in any thread fails, with the real AI too.** The server allows at most 20 history messages (`askAiRequest.ts:231-233`, `.max(20)`). The client has no turn limit and no oldest-first trim. Each follow-up adds 2 messages, so the 11th sends 22 and gets a 400. Production-reachable for any player who keeps asking. The fix belongs next to bug 1's trim: drop the oldest pairs but keep the opening question, which REQ-246 uses to pick the rules.
- **PRD number drift** (docs only, part of bug 1): per-message cap 2,000 vs code 10,000; history budget 6,000 (FLOW-005) vs 1,000,000 (REQ-027).

---

## Bug 6 — FLOW-005 / FLOW-016: the 11th follow-up in a conversation fails

**Player today.** Ten follow-ups work. The 11th shows a validation error and the conversation cannot continue. It happens with the real AI, in Ask a Question and in In-Depth, and in a conversation reopened from Question History.

**PRD promises.** FLOW-005 lets a player keep following up, with no turn limit stated to the player. REQ-027 (`functional-requirements.md:517`) has the backend reject a history over 20 entries, and nothing tells the client to stay inside that.

**Root cause.**
- The server takes at most 20 history messages, alternating user/assistant, starting with user and ending with assistant: `apps/backend/src/validation/askAiRequest.ts:230-246` (`.max(20)` at `:234`).
- The client sends the whole visible thread: `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts:331` (`const conversationHistory = visibleMessages;`). The thread grows by two messages per answered follow-up (`:238-242`). The k-th follow-up sends 2k messages, so the 10th sends 20 and the 11th sends 22 and is rejected.
- A reopened conversation restores its full saved thread (`restoreConversation`, `:365`), so it hits the same wall at the same count.
- The opening exchange must survive any trim: the server picks a follow-up's rules from `conversationHistory[0]`, the opening question (`apps/backend/src/prompt/ruleSelectionQuestion.ts:19-22`, REQ-246). Dropping it would silently change which rules a follow-up gets.

**Smallest fix.** In `submitFollowUp` (`useAskAiSubmitOrchestration.ts:323-339`), after fix 1's per-message cut: when the history has more than 20 messages, keep messages 0–1 (the opening question and its answer) and the most recent 18, dropping whole user/assistant pairs from index 2 onward. The result still starts with user, alternates, and ends with assistant. Retry reuses the same payload, so it is covered. The thread on screen and the saved conversation keep everything.
- Single-sourcing the caps: today no runtime frontend code imports from `apps/backend/src/`; only tests do (`apps/frontend/src/lib/sharedContractLists.test.ts:3-9` imports `constants.js` and `validation/askAiRequest.js`). `apps/backend/src/constants.ts` has only a type import (`:1`), so exporting the two caps (10,000 characters, 20 messages) from it and importing them in both `askAiRequest.ts` and the hook adds no backend runtime dependency to the frontend bundle. The planner confirms the frontend build takes the import.
- Files: `useAskAiSubmitOrchestration.ts`, `apps/backend/src/constants.ts`, `apps/backend/src/validation/askAiRequest.ts`. About 15 lines, shared with fix 1.
- Unit test that would have caught it: in `useAskAiSubmitOrchestration.test.ts`, beside "builds conversationHistory with 4 entries after two follow-ups" (`:469`), a new test "keeps a follow-up's history within 20 messages and keeps the opening exchange": restore a 22-message conversation (or run 11 follow-ups), send one more, and assert the sent `conversationHistory` has at most 20 messages, opens with the original question and answer, alternates from user, and ends with assistant. A second test passes the built history through the backend's `conversationHistorySchema` (the cross-import `sharedContractLists.test.ts` already uses); that one contract test would have caught bugs 1 and 6 together.

**Flow-test check.** FLOW-005 test, with a short routed answer: send 11 follow-ups; the 11th gets an answer and no error shows.

**Size.** About 15 lines across 3 files (with fix 1); 2 unit tests.

---

## Bug 7 — FLOW-016 / FLOW-017: closing Question History leaves focus on the page

**Player today.** Open ☰ Menu, choose Question History, close it with Esc or ✕: focus lands on the page body (seen live 2026-10-20 at 1280 wide, in the notes above). A keyboard player has to tab in again from the top.

**PRD promises.** REQ-103 (`functional-requirements.md:2554`): the history sheet "returns focus to its trigger on close". The tray row that opened it is gone once the tray closes, so the trigger left is ☰ Menu, the same target Send feedback uses (FLOW-014, `user-flows.md:331`).

**Root cause.** Close to bug 3, but not the same:
1. The History row's click handler (`apps/frontend/src/components/portal/FeaturePortalMenu.tsx:302-305`) calls `setIsOpen(false)` and `openHistory()` (`:101-104`) in one event. React commits both together: the tray, holding the focused "Question History" row, unmounts in the same commit that mounts the sheet.
2. The sheet remembers whatever has focus when it mounts and restores it on close (`components/SheetShell.tsx:98-113`; hosted by `ConversationHistoryDrawer.tsx:226`). The focused row has just been removed, so the remembered element is the body.
3. Unlike Send feedback (`App.tsx:109-118`), nothing moves focus to ☰ before the sheet opens. Adding that alone would not work: while the tray is open ☰ is `aria-hidden` (`FeaturePortalMenu.tsx:340`) and so `visibility: hidden` (`index.css:51-54`), and a hidden element cannot take focus. That is bug 3's cause.

**Smallest fix.** In the History row's handler: close the tray first with `flushSync(() => setIsOpen(false))`, as bug 3's fix does for action entries; then focus ☰, now visible; then `openHistory()`. The sheet then remembers ☰ and returns focus there on Esc, ✕ and outside tap. ☰ is rendered by this same component (`railTrigger`, `:342-354`), so a ref reaches it. Bugs 3 and 7 can share one small "close the tray, focus ☰, then run" helper.
- Files: `FeaturePortalMenu.tsx`. About 5 lines.
- Unit test that would have caught it: unlike bug 3, jsdom sees this one, because nothing ever focuses ☰ and the removed row leaves focus on the body there too. New test in `components/portal/FeaturePortalMenu.test.tsx`: "Question History opened from the Menu returns focus to ☰ Menu on Esc and on ✕". Harden it the way bug 3 suggests: also assert ☰ has no `aria-hidden` at the moment it takes focus, so the test cannot pass on a hidden ☰.

**Flow-test check.** FLOW-017 test: after History closes, focus is on ☰ Menu, at both sizes.

**Size.** 1 file, about 5 lines; 1 unit test.

---

## Bug 8 — FLOW-009 / FLOW-025: the printing picker has no "N printings" line

**Player today.** Trade Balancer's printing picker shows the card name over its art and "Tap a price to use that printing and finish." There is no count of printings (live walk, both sizes, `flow-walks-trade-scan.md:132`).

**PRD promises.** REQ-065 (`functional-requirements.md:1539`): "the head counts the printings (`N printings`, computed from the fetched list, never from a stored field) and a card with one printing reads 'only printing'". `trade-balancer/README.md:93-95` says the same, and FLOW-025 agrees (`user-flows.md:569`).

**Root cause.** Not an oversight. The `ui-look-translation` build (slice D, commit `65bf2930`, 2026-10-02) rebuilt the picker to match the design mockup, which shows no count, and pinned the absence with a test: `apps/frontend/src/components/trade/PrintingPicker.test.tsx:63-76`, "D1: no printing-count line: the mockup's picker shows only the lede, the filter and the rows", which asserts "2 printings" and "only printing" are absent. That slice did not amend REQ-065, so the spec and the app have disagreed since. The head today: `PrintingPicker.tsx:79-86` (name at `:81`, instruction line at `:86`).

**Does the mockup rule cover it?** REQ-070's redesigned-screens exception (`functional-requirements.md:1690`) lets Trade Balancer's mockup decide its "guidance and helper text — its wording, its placement, and whether a line appears at all". A count of the card's fetched printings is data about the card, not guidance copy, so REQ-065's explicit count governs. The owner chose "fix the app" for this item on 2026-10-20 (owner decision 10).

**Smallest fix.** Render the count in the picker's head from `printings.length`: "N printings", or "only printing" for one; nothing for zero, where the existing "No printings available for this card." line shows. Replace test D1 with its opposite.
- Files: `PrintingPicker.tsx`, `PrintingPicker.test.tsx`. About 5 lines plus the test.
- Unit test that would have caught it: one existed and asserted the opposite. Its replacement in `PrintingPicker.test.tsx`: "REQ-065: the head counts the printings — '2 printings' for two, 'only printing' for one".

**Flow-test check.** FLOW-009 test: the picker for Sol Ring shows "N printings" with N above 1.

**Size.** 1 file plus its test, about 5 lines.

---

## Bug 9 — FLOW-014: feedback from Ask a Question carries no question, cards or conversation

**Player today.** On Ask a Question with a typed question, the feedback form's snapshot lists only the shell fields and "Flow state: no feature contributed a snapshot" (live, `flow-walks-chrome-life.md:196`). Ask a Question is the landing page, so most reports arrive with no context.

**PRD promises.** REQ-088 (`functional-requirements.md:2090-2100`): the snapshot carries "current screen/step, in-progress game context and typed question, zones/cards/enrichment, conversation history (if any)". `user-feedback/README.md:58-62` agrees.

**Root cause.**
- Only In-Depth registers a snapshot contributor: `apps/frontend/src/components/portal/MtgAssistantApp.tsx:442-454` calls `useRegisterFeedbackContributor` (`lib/feedback/feedbackSeam.ts:35-51`).
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx` never does, though it holds everything needed: `selectedCards` (`:104`), `question` (`:106`), and `visibleMessages`, `frozenContext` and `isConversationActive` from the orchestration hook (`:120-132`).
- With no contributor, the summary prints the fallback line (`lib/feedback/summarizeFeedbackContext.ts:42-44`).
- The snapshot shape has no field for Ask a Question's attached cards: `FeedbackFlowSnapshot` (`lib/feedback/types.ts:11-28`) holds cards only per In-Depth zone (`zoneCards`).

**Smallest fix.** In `QuickLookupApp`, register a contributor while the page is active, as In-Depth does: screen "Ask a Question", the typed question, the attached cards (the frozen set once answered), whether a conversation is active, and the conversation. Add an optional attached-cards field (card names) to `FeedbackFlowSnapshot` and one summary line for it in `summarizeFeedbackContext`.
- Files: `QuickLookupApp.tsx`, `lib/feedback/types.ts`, `lib/feedback/summarizeFeedbackContext.ts`. About 20 lines plus tests.
- Unit test that would have caught it: `App.feedback.test.tsx:211-226`, "falls back to the shell-only snapshot on a destination with no contributor", uses Ask a Question as its example, so it pins the gap (written 2026-08-03, before Ask a Question became the landing page). Repoint it at Trade Balancer, which has no contributor (`:172`), and add "REQ-088: feedback from Ask a Question discloses the typed question, attached cards and conversation". Add a `summarizeFeedbackContext.test.ts` case for the attached-cards line.

**Flow-test check.** FLOW-014 test: the snapshot lists the typed question and the screen.

**Size.** 3 files, about 20 lines; 2 unit tests.

---

## Bug 10 — FLOW-013: a tap at the centre of Player 1's "−" opens counters (waits on Q-015)

**What was seen.** The browser smoke build (PR #340) clicked the centre of the button named "Decrease life for Player 1" at 390×844 and the counters control received the click. The smoke step now taps 14 px in from the near edge (`scripts/smoke-browser.mjs:389-393`). It was parked as item 1 of open docs PR #341, copied verbatim in `browser-smoke-followups-pr341.md`. The flow walk saw the same (`flow-walks-chrome-life.md:113`: "the middle of the card holds other controls"). Not re-measured live for this entry; the cause below is from code reading.

**Cause.** The default tracker is 4 players at 40 life in the grid layout (`apps/frontend/src/lib/lifeTracker/state.ts:15-16`). In `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx`:
- "−" and "+" are not small buttons. Each is an invisible band covering a whole half of the card (`:73-88`, `w-1/2` or `h-1/2`), at `z-0` (`:160-164`). The drawn "−" sits near the outer edge of its half.
- The card's content column (name, life number, counters preview) sits above both bands at `z-10` (`:229`). The column ignores taps, but the life number (`:271`) and the counters preview (`:290`) take them back (`pointer-events-auto`).
- The column faces the seated player, and the counters preview sits on the player's side of the life number, the same edge "−" is on (REQ-217). So in the grid layout the preview lies inside the "−" half, near its centre. A tap there opens counters.

**What the PRD says.** This is the specified design, not a defect:
- `life-tracker/README.md:29-31`: the two half-card zones cover "the whole card except its three interactive controls (life total, commander-damage preview, inline life input)".
- REQ-217 (`functional-requirements.md:5737`): "the three interactive inner controls (life total, commander-damage preview, inline life input) still take their own taps".
- `life-tracker/README.md:166-170`: thin edge bands were rejected ("closed door") when DEC-136 moved to whole-card halves.
- REQ-205's 44 px minimum is met many times over: each zone is half a card.

PR #341's premise, "the whole visible '−' button takes the tap", reads the band's bounding box as the visible button. A player sees the drawn "−" near the edge and the bordered counters preview in the middle, and tapping the preview opens counters, as specified.

**Decision needed.** Blocker question Q-015 in `GATE-QUESTIONS.md`: drop fix 10 (recommended), or keep it and change the Life Tracker layout.

**If Q-015 keeps fix 10.**
- Fix: move the counters preview so no seat's "−" half has it at its centre (for example beside the life number instead of below it), keeping the three controls' own taps. Moving it into the "+" half would only move the overlap there.
- Files: `PlayerLifeCard.tsx`, plus the REQ-202 Life Tracker before/after screenshot pair at both widths. Small in code, but a visible layout change on every card.
- Test that would have caught it: not a jsdom unit test, because jsdom has no layout and `elementFromPoint` finds nothing there. It is a browser check, as PR #341 says: at 390×844, `document.elementFromPoint` at the centre of each seat's "Decrease life for <player>" box returns that button. It lives as a step in the FLOW-013 flow test; the smoke step's edge-tap workaround retires with the smoke steps.

**If Q-015 drops fix 10.** No code change. The FLOW-013 test taps the drawn "−" and "+" near each band's outer edge, and checks that a tap on the counters preview opens counters, which REQ-217 requires. PR #341's item 1 can be closed as working as specified.
