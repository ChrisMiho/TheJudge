# Gate questions — Ask box shows an old question instead of the hint

**Decide:** one slot below, an amendment to an existing requirement (REQ-206).
No new stable ID. No blocker.

Every diff is against `PRD/sections/` at `97c8ea8a`. Line numbers are where the
hunk starts today. Evidence: `evidence/measurements.md`; screenshots in
`.playwright-mcp/` (local). The full reasoning is in `DESIGN-BRIEF.md`.

## REQ-206 — a question carried into In-depth arrives there, and leaves Ask a Question once answered

**What this decides:** what happens to the question in the Ask box after the
player taps the ◈ In-depth button and then gets an answer in In-depth details.

**In plain terms:** today the In-depth button (REQ-206: it moves the player's
cards and typed question from Ask a Question into In-depth details) has two
faults. With no card attached, the question never reaches In-depth, so
In-depth's box opens empty. And the question is never taken out of Ask a
Question, so it sits there as saved unsent work (a Draft, which REQ-108
restores on every visit and reload) long after the player got their answer in
In-depth. That stale question is the "real text instead of the hint" the owner
saw. Because the box holds text, the In-depth button folds down to ◈, as
REQ-206 already says it should. The change: the question always arrives in
In-depth. Once In-depth has answered, Ask a Question empties (question, cards
and its Draft), unless the player changed them after tapping In-depth. Nothing
is cleared before the answer, so tapping In-depth by mistake and pressing Back
still finds the question waiting. Recommendation: accept.

**What happens if you say no:** the build still fixes the question-only carry,
because REQ-206 already says the question is carried. But Ask a Question keeps
the carried question after the In-depth answer, so the old question and the
folded ◈ button keep showing until the player sends or deletes it by hand.
Edit this slot instead if you want the box emptied at the moment of the tap
rather than after the answer.

```diff
@@ functional-requirements.md:5358 — REQ-206, Acceptance Criteria @@
   - **Add in-depth details** switches the active destination to In-depth details, carrying every attached card and the typed question (or its silent fallback); the carry is queued in a one-slot mailbox (`lib/portal/seedContext.tsx`'s `queueLookupCarry`/`consumeLookupCarry`) alongside the existing Life Tracker roster-seed mailbox; a quick-lookup visit entered directly from Life Tracker still carries the roster seed forward through this one gesture, narrowly tied to it the same way the retired direct Menu transition was (App.player-life-tracker-seed.test.tsx's negative tests: a deep link, browser Back, or a raw route jump never seeds)
+  - the carry hands the question off: a typed question carried with no card attached still arrives in In-depth details' question box (a carry is never dropped for having no card); and once In-depth details returns its first successful answer for the carried attempt, Ask a Question's carried question and cards are cleared and its Draft slot (REQ-108) is removed, so the next visit or reload shows the empty box with only the faint hint and the full "◈ In-depth" label (◈ only under 480px). Nothing is cleared before that answer, so Back from In-depth details still finds the question waiting; a question or card changed on Ask a Question after the carry is new staging and is kept; the hand-off survives a page reload between the carry and the answer
@@ functional-requirements.md:5362 — REQ-206, Acceptance Criteria (tests) @@
-  - tests cover the single Menu entry, turning the ring (tap and arrows, wrapping, no duplicate neighbour at exactly two cards, the lit position dot following the front card), the carry queuing cards/question and switching the destination, the ring at 0/mid/last-30/300 characters, Edit cards restoring cards and question, and a chip opening the card detail
+  - tests cover the single Menu entry, turning the ring (tap and arrows, wrapping, no duplicate neighbour at exactly two cards, the lit position dot following the front card), the carry queuing cards/question and switching the destination, a question-only carry arriving in In-depth details, Ask a Question emptied (box, stage and Draft) after the carried attempt's first In-depth answer and kept when edited after the carry, the ring at 0/mid/last-30/300 characters, Edit cards restoring cards and question, and a chip opening the card detail
@@ functional-requirements.md:5388 — REQ-206, Notes @@
   - amended by `card-search-and-send-pill` (2026-10-13): the ring's start point when the pill is the arrow alone (no speech recognition, REQ-212) — the top of the round arrow, clockwise
+  - amended by `ask-box-prefilled-text` (2026-10-14): the carry hands the question off (acceptance criterion above). Measured live at 1440x900 and 390x844 on mtgjudge.gg and the dev build: a question-only carry was dropped in In-depth details (`MtgAssistantApp.tsx` returned early on a carry with no card), and Ask a Question's Draft cleared only on Ask a Question's own answer, so a carried question came back on every later visit as real text with the chip folded to ◈. REQ-108's "Draft for that attempt is cleared on first successful answer" now counts the In-depth answer for a carried attempt. Drafts saved before this change carry no hand-off record and are not cleared retroactively
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
+  in In-depth details' question box. Once In-depth details answers the carried
+  attempt, this page's carried question, cards and Draft are cleared (unless
+  the player changed them after the carry), so the next visit shows the empty
+  box and its hint; before that answer, Back finds the question waiting.
+  (DEC-107, REQ-073, REQ-108, REQ-206, FLOW-011)
```

- Verdict:
- Reason:
