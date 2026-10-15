# Gate questions — Ask box shows an old question instead of the hint

**Decide:** three slots below, each an amendment to an existing requirement or
flow. REQ-206: what the In-depth button hands off, and what Ask a Question
clears after the In-depth answer. REQ-108 and FLOW-017: the saved unsent
question follows the box as the player edits, so clearing the box sticks after
a reload. No new stable ID. No blocker.

REQ-108 and FLOW-017 say the same rule in two places; accept or reject them
together. REQ-206 stands on its own.

Every diff is against `PRD/sections/` at `97c8ea8a`. Line numbers are where the
hunk starts today. Evidence: `evidence/measurements.md`; screenshots in
`.playwright-mcp/` (local). The full reasoning is in `DESIGN-BRIEF.md`.

## REQ-206 — a question carried into In-depth arrives there, and leaves Ask a Question once answered if the player left it alone

**What this decides:** what happens to the question and cards in the Ask box
after the player taps the ◈ In-depth button and then gets an answer in
In-depth details, including when the player changed them in between.

**In plain terms:** the In-depth button (REQ-206: it moves the player's cards
and typed question from Ask a Question into In-depth details) has two faults
today. With no card attached, the question never reaches In-depth, so
In-depth's box opens empty. And the question is never taken out of Ask a
Question, so it sits there as a Draft (the saved unsent question, which REQ-108
restores on every visit and reload) long after the player got their answer.
That stale question is the "real text instead of the hint" the owner saw, and
because the box holds text the In-depth button folds down to ◈. The change:
the question always arrives in In-depth. When In-depth answers, Ask a Question
empties only if the player has not touched it since the tap. If the player
changed the question or the cards in any way, both stay. A spaces-only edit
does not count as a change; emptying the box does. Nothing is cleared before
the answer, so a mistaken tap and Back still finds the question waiting.
Recommendation: accept.

**What happens if you say no:** the build still fixes the question-only carry,
because REQ-206 already says the question is carried. But Ask a Question keeps
the carried question after the In-depth answer, so the old question and the
folded ◈ button keep showing until the player sends or deletes it. Edit this
slot instead if you want each half judged on its own (an untouched question
cleared even when the cards were changed, and the reverse), or the box emptied
at the moment of the tap rather than after the answer.

```diff
@@ functional-requirements.md:5358 — REQ-206, Acceptance Criteria @@
   - **Add in-depth details** switches the active destination to In-depth details, carrying every attached card and the typed question (or its silent fallback); the carry is queued in a one-slot mailbox (`lib/portal/seedContext.tsx`'s `queueLookupCarry`/`consumeLookupCarry`) alongside the existing Life Tracker roster-seed mailbox; a quick-lookup visit entered directly from Life Tracker still carries the roster seed forward through this one gesture, narrowly tied to it the same way the retired direct Menu transition was (App.player-life-tracker-seed.test.tsx's negative tests: a deep link, browser Back, or a raw route jump never seeds)
+  - the carry hands the question off: a typed question carried with no card attached still arrives in In-depth details' question box (a carry is never dropped for having no card). When In-depth details gives its first successful answer for a carried attempt, Ask a Question compares what it holds with what was carried at the latest tap: if the question, ignoring leading and trailing spaces, and the set of attached cards both match, it clears the question, the cards and its Draft; if either differs in any way, including a box emptied or a card added or removed since the tap, it clears nothing. The comparison is of the two states at the moment of the answer (an edit undone back to the carried text counts as unchanged; cards compare by identity, order ignored; tapping In-depth again makes a new carry whose snapshot replaces the old). Nothing is cleared before that answer, so Back from In-depth details still finds the question waiting; a cleared page shows the empty box with only the faint hint and the full "◈ In-depth" label (◈ only under 480px); the hand-off, and the walk in In-depth details, survive a page reload between the tap and the answer
@@ functional-requirements.md:5362 — REQ-206, Acceptance Criteria (tests) @@
-  - tests cover the single Menu entry, turning the ring (tap and arrows, wrapping, no duplicate neighbour at exactly two cards, the lit position dot following the front card), the carry queuing cards/question and switching the destination, the ring at 0/mid/last-30/300 characters, Edit cards restoring cards and question, and a chip opening the card detail
+  - tests cover the single Menu entry, turning the ring (tap and arrows, wrapping, no duplicate neighbour at exactly two cards, the lit position dot following the front card), the carry queuing cards/question and switching the destination, a question-only carry arriving in In-depth details, Ask a Question emptied (box, stage and Draft) after the carried attempt's first In-depth answer when untouched since the tap, everything kept after an edit to only the question, only the cards, or an emptied box, a spaces-only edit still clearing, a second tap replacing the carried snapshot, a reload mid-walk keeping the walk and the hand-off, the ring at 0/mid/last-30/300 characters, Edit cards restoring cards and question, and a chip opening the card detail
@@ functional-requirements.md:5388 — REQ-206, Notes @@
   - amended by `card-search-and-send-pill` (2026-10-13): the ring's start point when the pill is the arrow alone (no speech recognition, REQ-212) — the top of the round arrow, clockwise
+  - amended by `ask-box-prefilled-text` (2026-10-14): the carry hands the question off (acceptance criterion above), all or nothing against the latest tap's snapshot. Measured live at 1440x900 and 390x844 on mtgjudge.gg and the dev build: a question-only carry was dropped in In-depth details (`MtgAssistantApp.tsx` returned early on a carry with no card), and Ask a Question's Draft cleared only on Ask a Question's own answer, so a carried question came back on every later visit as real text with the chip folded to ◈. REQ-108's "Draft for that attempt is cleared on first successful answer" now counts the In-depth answer for a carried attempt. Drafts saved before this change carry no hand-off record and are not cleared retroactively
```

```diff
@@ quick-lookup/README.md:42 — Entry and pre-submit layout @@
 - Built: Quick Lookup is the **Ask a Question** page — the Menu's single
   question destination (`quick-lookup`, route `/quick-lookup`, DEC-095) — and
   opens as a frontend-only view switch with no reload; it ships no navigation
   menu of its own. Its **Add in-depth details** pill carries the attached
   cards and the typed question into In-depth details (`/in-depth`), switching
-  the active destination there. (DEC-107, REQ-073, REQ-206, FLOW-011)
+  the active destination there. A question carried with no card still arrives
+  in In-depth details' question box. When In-depth details gives its first
+  successful answer for a carried attempt, Ask a Question compares what it
+  holds with what was carried at the latest tap: if the question, ignoring
+  leading and trailing spaces, and the set of attached cards both match, it
+  clears the question, the cards and its Draft; if either differs in any way,
+  including a box emptied or a card added or removed since the tap, it clears
+  nothing. Before that answer, Back finds the question waiting.
+  (DEC-107, REQ-073, REQ-108, REQ-206, FLOW-011)
```

- Verdict:
- Reason:

## REQ-108 — the saved unsent question always matches the box, so clearing it sticks

**What this decides:** when the Draft (the browser-local copy of a question,
cards and other unsent work that REQ-108 restores on every visit and reload) is
written and when it is removed, in Ask a Question and In-depth details.

**In plain terms:** the owner typed a question, cleared it, refreshed, and the
old question came back. Measured on mtgjudge.gg and the dev build, desktop and
phone: the Draft is only saved at a few moments (leaving by the Menu, attaching
or removing a card, opening a saved conversation). Typing or emptying the box
never updates it. So once a Draft exists, an emptied box comes back full after
a reload, and a replaced question comes back as the older one. The reverse also
happens: a question typed and reloaded with no Menu trip is lost, although
REQ-108 already says the Draft covers a reload. In In-depth details, a reload
mid-walk loses the cards carried in. The change: the Draft is rewritten the
moment anything in it changes, and removed the moment nothing is staged, in
both destinations. Whatever is on screen is what comes back.
Recommendation: accept.

**What happens if you say no:** the In-depth hand-off (REQ-206 slot) still
ships, but clearing the Ask box and reloading keeps bringing the old question
back, a question typed and reloaded is still lost, and a reload mid-walk in
In-depth still drops the carried cards. Two narrower versions exist if you
prefer to Edit: remove the Draft only when the box empties (fixes clear and
reload, but a replaced question still comes back as the older one), or save at
page hide (fixes a desktop reload, but phones do not reliably signal page hide
when a tab is swiped away, so the old question can still return there).

```diff
@@ functional-requirements.md:2674 — REQ-108, Acceptance Criteria @@
-  - Draft is written/updated as mid-flight staging changes enough to resume meaningfully after Menu leave, reload, or opening a saved conversation
+  - the Draft always matches what is staged on screen: every change to anything the Draft saves rewrites it at once, and the moment nothing is staged it is removed at once. A change is each edit to the question and each card attached or removed, and in In-depth details also each step, zone, placement or game-state change; "nothing is staged" is the same test Menu-leave uses (Ask a Question: the question empty or spaces only and no card attached). So Menu leave, reload, closing the tab, or opening a saved conversation never brings back older work than the screen showed: an emptied question comes back empty, a replaced question comes back as the new text, and a question typed and reloaded without a Menu trip comes back
@@ functional-requirements.md:2698 — REQ-108, Notes @@
   - DEC-138 extended this requirement's exit coverage from "Menu leave or reload" to include opening a saved conversation, in both destinations; the one-slot-per-destination rule is unchanged
+  - amended by `ask-box-prefilled-text` (2026-10-14): the Draft follows every change instead of being snapshotted at exits. Measured live at 1440x900 and 390x844 on mtgjudge.gg and the dev build: the Draft was written or removed only at Menu-leave, opening a saved conversation, and (Ask a Question) a card change, so after any of those, clearing or replacing the question and reloading restored the older question, a question typed and reloaded with no Menu trip was lost, and a reload mid-walk in In-depth details lost the carried cards. Removing the Draft only when the box empties, and saving at page hide, were considered and not chosen (the first leaves a replaced question stale; phones do not reliably signal page hide)
```

- Verdict:
- Reason:

## FLOW-017 — the step-by-step flow for unsent work says the same: the Draft follows every change

**What this decides:** whether FLOW-017 (the player-path description of saving
unsent work across Menu trips, reloads and Question History) states the same
rule as the REQ-108 slot above. Accept or reject it together with REQ-108.

**In plain terms:** FLOW-017 step 1 says the Draft "is written/updated" as the
player stages work, without saying when. This adds "at once, on every change",
and two edge cases a player can test: emptying everything removes the Draft,
so a reload shows the empty page; replacing the question and reloading brings
back the new text, never the older one. Recommendation: accept, if REQ-108 is
accepted.

**What happens if you say no:** FLOW-017 keeps its looser wording while REQ-108
states the stricter rule, so the two documents disagree on when the Draft is
saved. If REQ-108 is rejected, reject this too.

```diff
@@ user-flows.md:396 — FLOW-017, Main Flow @@
-  1. User stages mid-flight state (typed question, optional card, zones/enrichment, current step — anything before first successful submit). The destination's single Draft slot is written/updated and appears in Question History as its own **Draft** row.
+  1. User stages mid-flight state (typed question, optional card, zones/enrichment, current step — anything before first successful submit). The destination's single Draft slot is rewritten at once on every change, so it always matches the screen (REQ-108), and appears in Question History as its own **Draft** row.
@@ user-flows.md:406 — FLOW-017, Edge Cases @@
   - first successful submit while a Draft exists for the attempt → Draft cleared; conversation enters completed-history path
+  - user empties everything they staged (clears the question, removes every card, and in In-depth details nothing else staged) → Draft removed at once; a reload or Menu return shows the empty destination, never the older work
+  - user replaces the question, then reloads → the new text comes back, never the older one
@@ user-flows.md:414 — FLOW-017, Notes @@
   - amended for the `ui-reimagining-build` pass (2026-09-30): Draft lives in Question History (REQ-213), not the retired rail; selecting a Draft already on its own destination re-hydrates immediately rather than relying on a mount effect
+  - amended by `ask-box-prefilled-text` (2026-10-14): the Draft is rewritten on every change and removed the moment nothing is staged, in both destinations (REQ-108); before this, an emptied or replaced question came back as the older text after a reload, measured on mtgjudge.gg and the dev build at desktop and phone widths
```

- Verdict:
- Reason:
