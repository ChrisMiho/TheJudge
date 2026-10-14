# Gate questions — card search and send pill

**Decide:** three slots below, all small amendments to existing requirements. No
new stable ID. No blocker.

How the slots hang together:

- **REQ-002** is the card-search fix. It stands alone.
- **REQ-212** and **REQ-206** are the send-pill fix. REQ-212 says what the pill is
  without speech recognition; REQ-206 says where its budget ring starts. Rejecting
  REQ-212 makes REQ-206 moot.

Every diff is against `PRD/sections/functional-requirements.md` at `cbecdc4e`.
Line numbers are where the hunk starts today. Evidence: `evidence/measurements.md`.

## REQ-002 — card search ignores punctuation and accents

**What this decides:** whether a player can find a card by typing its name
without the commas, apostrophes, hyphens, `//` or accents in it.

**In plain terms:** today `urborg tomb` finds nothing. The card is Urborg, Tomb of
Yawgmoth, and the comma breaks the match. One in five card names carries such a
mark: 7,339 of 34,639. Typing the first two words of one of them finds it for
only 3,380 of 7,288 names. With this change, search sets aside punctuation and
accents on both sides. `urborg tomb`, `jace the mind`, `atraxa praetors`,
`lim dul` and `fire ice` each find their card first. The two-word figure rises
to 7,052 of 7,288. Cards without punctuation return exactly what they return
today. It applies to all three card searches: Ask a Question's Add card,
In-depth details' Cards step, and each Trade Balancer side. In-depth details'
Cards step also starts showing "No matching card found" — today it shows
nothing at all, though this requirement already asks for the message.

The list stays at three suggestions (eight on a Trade Balancer side). A bare
`urborg` still shows Urborg, Urborg Elf and Urborg Drake: 18 names start with
"urborg", and the Tomb ranks last of them, so no short list would reach it. One
more letter, `urborg t`, puts it first. To show more than three, edit the number
in the fourth new line of the diff. Recommendation: accept as written.

**What happens if you say no:** search keeps matching the exact characters.
Players must type the comma (`urborg, tomb`) or nearly the whole name, and
In-depth details' Cards step keeps showing nothing on a miss.

```diff
@@ functional-requirements.md:19 — REQ-002 @@
 ### REQ-002
 - Title: Autocomplete suggestions
 - Priority: high
-- Description: The app must show matching card suggestions from local metadata with typo tolerance.
+- Description: The app must show matching card suggestions from local metadata with typo tolerance. A player finds a card without typing its punctuation or accents: `urborg tomb` finds Urborg, Tomb of Yawgmoth, `yawgmoths` finds Yawgmoth's Will, `lim dul` finds Lim-Dûl's Vault.
 - Acceptance Criteria:
   - suggestions appear after 3 typed characters
   - no-match state shows **No matching card found**
   - tapping a suggestion opens a preview instead of immediately adding
+  - matching compares the typed text and each card name with letter case, accents and punctuation set aside: an accented letter matches its plain letter (`û` matches `u`), a hyphen or slash counts as a space, every other character that is not a letter, digit, space or underscore is ignored, and a run of spaces counts as one; underscores are kept, so the Un-set cards named only with blanks stay findable by typing underscores
+  - every card-name search in the suite uses this one rule from one shared definition, never a copy: Ask a Question's Add card (REQ-206), In-depth details' Cards step, and each Trade Balancer side's search (REQ-065)
+  - each search keeps its ranking — the exact name first, then names that start with the typed text, then names that contain it, then names within two typing mistakes — and its threshold (one character on Ask a Question's Add card, REQ-167; three elsewhere, REQ-001), counted on the typed text after the rule is applied
+  - the list holds at most three suggestions on Ask a Question's Add card and on In-depth details' Cards step, and at most eight on a Trade Balancer side
+  - each suggestion shows the card's real printed name, and choosing it resolves the same oracle card as before
+  - every one of the three searches shows the no-match message when the typed text reaches its threshold and nothing matches
+  - tests cover, on the shared rule and on each search: `urborg tomb` and `urborg t` returning Urborg, Tomb of Yawgmoth first; `jace the mind`, `atraxa praetors`, `will o the wisp`, `lim dul` and `fire ice` finding Jace, the Mind Sculptor, Atraxa, Praetors' Voice, Will-o'-the-Wisp, a Lim-Dûl card and Fire // Ice; `sol ring`, `lightning bolt`, `urborg` and `urborg, tomb` returning what they returned before; `_____` still finding `_____`; and In-depth details' Cards step showing the no-match message for a query with no match
 - Constraints:
   - suggestions should feel immediate
+  - no new data field, index file, dependency or popularity ranking; matching stays in the browser over the existing card list
 - Dependencies:
   - static local metadata file
+  - REQ-001 (the three-character threshold)
+  - REQ-065 (Trade Balancer manual search uses this search)
+  - REQ-167 (Ask a Question's one-character threshold)
 - Notes:
+  - amended by `card-search-and-send-pill` (2026-10-13): matching ignores punctuation and accents. Measured at refinement over the 34,639-card list: 7,339 names carry a mark; typing the first two words without it found the card in the list of three for 3,380 of 7,288 names today and 7,052 under the rule; typing the whole name found it for 6,200 of 7,324 today and all 7,324 under the rule. The list length stayed at three because 18 names start with "urborg" and Urborg, Tomb of Yawgmoth ranks last of them on every search, so only more typing (`urborg t`) reaches it. In-depth details' Cards step had shown nothing on a miss because its list closed whenever there were no suggestions
```

- Verdict:
- Reason:

## REQ-212 — without a microphone, the send pill is one round arrow

**What this decides:** what the send button looks like in a browser that cannot
take dictation, such as Firefox.

**In plain terms:** where the browser has speech recognition, the send pill has
two halves: a microphone on the left, the arrow on the right (this requirement,
REQ-212). Where it has none, the requirement already says the pill is "the arrow
alone and nothing else changes." The build does not do that. Measured in all
four question boxes — Ask a Question, its follow-up, In-depth details' question,
and its follow-up — the pill keeps its two-half width (88 pixels), with the
arrow on the left and an empty coloured half on the right. That empty half is
the "button with no icon" the owner saw on Firefox. This change says plainly
that the arrow-alone pill is one round 44-pixel button with the 300-character
budget ring round it, and adds a test that measures it. With a microphone,
nothing changes.

**What happens if you say no:** the wording stays as it is. The build may still
fix the empty half under the existing sentence, but nothing pins the shape, so
it can come back.

```diff
@@ functional-requirements.md:5534 — REQ-212, first acceptance criterion @@
-  - where the browser exposes speech recognition (`SpeechRecognition` or `webkitSpeechRecognition`), the send pill shows a microphone half at the left and the arrow at the right in every question box (Ask a Question, its follow-up, In-depth details' question and its follow-up); where it does not, the pill is the arrow alone and nothing else changes
+  - where the browser exposes speech recognition (`SpeechRecognition` or `webkitSpeechRecognition`), the send pill shows a microphone half at the left and the arrow at the right in every question box (Ask a Question, its follow-up, In-depth details' question and its follow-up); where it does not, the pill is the arrow alone — one round 44px send control with no empty half, the budget ring (REQ-206) traced round that circle, and the freed width given to the text — and nothing else changes
@@ functional-requirements.md:5539 — REQ-212, test criterion @@
-  - tests cover each question box with and without the browser API, insertion into existing text, the character cap, stopping on submit mid-dictation, and the error path, using a stubbed recognition object
+  - tests cover each question box with and without the browser API — without it, the send control and its wrapper are each 44px wide and no microphone control renders — insertion into existing text, the character cap, stopping on submit mid-dictation, and the error path, using a stubbed recognition object
@@ functional-requirements.md:5548 — REQ-212, Notes (appended after the slice K note) @@
+  - amended by `card-search-and-send-pill` (2026-10-13): the arrow-alone pill had kept the two-half width. Measured in Chromium with both speech objects removed before load (the path Firefox takes): in all four boxes the pill stayed 88×44 with the 44px arrow at its left and an empty right half, and the ring kept the two-half shape. The fixed width of `.send-wrap` and the two-half `SEND_RING_PATH` did not follow whether the microphone rendered
```

- Verdict:
- Reason:

## REQ-206 — where the budget ring starts when there is no microphone

**What this decides:** where the 300-character ring begins on the round,
arrow-only send button.

**In plain terms:** Ask a Question (REQ-206) draws the character budget as a
ring of light round the send pill. It starts at the top of the split between the
microphone and the arrow and runs clockwise. Without a microphone there is no
split. This line makes the ring start at the top of the round arrow instead,
still clockwise. It follows from the REQ-212 slot above.

**What happens if you say no:** the requirement names a start point that does
not exist on the arrow-only button, and the build picks one.

```diff
@@ functional-requirements.md:5331 — REQ-206, budget ring criterion @@
-  - the 300-character budget (REQ-011, measured on the raw typed text per REQ-134) is drawn as a ring round the send pill's edge in the profile's accent light over a faint track, brighter in the last 30 characters and closed at 300; it starts at the top of the pill's split and runs clockwise; at 0 characters no track, fill or dot is drawn; no numeric `n / 300` count is drawn at any fill (ring is the only visible cue, amended 2026-10-05); there is no separate Send Request button, no bar under the box, and no hint line under the title
+  - the 300-character budget (REQ-011, measured on the raw typed text per REQ-134) is drawn as a ring round the send pill's edge in the profile's accent light over a faint track, brighter in the last 30 characters and closed at 300; it starts at the top of the pill's split (where the pill is the arrow alone, REQ-212, at the top of the round arrow) and runs clockwise; at 0 characters no track, fill or dot is drawn; no numeric `n / 300` count is drawn at any fill (ring is the only visible cue, amended 2026-10-05); there is no separate Send Request button, no bar under the box, and no hint line under the title
@@ functional-requirements.md:5361 — REQ-206, Notes (appended after the indepth-chip-collapse note) @@
+  - amended by `card-search-and-send-pill` (2026-10-13): the ring's start point when the pill is the arrow alone (no speech recognition, REQ-212) — the top of the round arrow, clockwise
```

- Verdict:
- Reason:
