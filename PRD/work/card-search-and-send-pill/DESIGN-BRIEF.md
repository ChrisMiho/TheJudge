# Design brief — card search and send pill

**What this is:** two fixes a player notices. Card search finds a card without
its punctuation or accents typed, and on a browser without speech recognition
the send pill is one round arrow instead of a half-empty pill.

**What you need to do:** answer the three gate questions in `GATE-QUESTIONS.md`
(REQ-002, REQ-212, REQ-206). No blocker.

**What it changes:** three card searches (Ask a Question's Add card, In-depth
details' Cards step, each Trade Balancer side) and the send pill in all four
question boxes. No request, prompt, data file, endpoint or dependency changes.

Evidence for every number below: `evidence/measurements.md`. Intake
(`intake/owner-clarifications.md`, `intake/hardtosearch.md`,
`intake/firefox-mic-sim-box.png`) is evidence, not authority; every intake
finding cited here was re-measured on this branch.

## Problem 1 — card search misses names with punctuation

### What the player meets today

A player who types `urborg tomb` gets no suggestions. Ask a Question and the
Trade Balancer say "No matching card found"; In-depth details' Cards step shows
nothing at all. A bare `urborg` fills the three slots with Urborg, Urborg Elf and
Urborg Drake. Only `urborg, tomb`, `tomb of yawg`, or the whole name finds it.

The same happens across the card list. 7,339 of 34,639 names carry a comma,
apostrophe, hyphen, `//`, accent or other mark. Typing the first two words of
such a name without the punctuation finds the card in the list of three for only
3,380 of 7,288 names. Examples: `jace the mind`, `atraxa praetors`,
`will o the wisp` and `lim dul` find nothing; `fire ice` finds Fire Imp, not
Fire // Ice; `jotun` finds Johan, Joven and Lotus.

Cause: matching is exact substring on the lower-cased name. Any mark between the
typed words breaks it. Whole names sometimes get through on the two-mistake typo
allowance; partial ones do not.

### Every card search a player meets

| Surface | Code | Threshold | List | Governing truth |
| --- | --- | --- | --- | --- |
| Ask a Question → Add card | `QuickLookupApp.tsx` → `useAutocompleteSuggestions` → `lib/search.ts` | 1 character | 3 | REQ-002, REQ-167 (threshold) |
| In-depth details → Cards step | `ZoneCollectionStep.tsx` → `useAutocompleteSuggestions` → `lib/search.ts` | 3 characters | 3 | REQ-001, REQ-002 |
| Trade Balancer → each side | `TradeSide.tsx` → `components/trade/oracleSearch.ts` (imports `normalize` and `levenshteinDistance` from `lib/search.ts`) | 3 characters | 8 | REQ-065 ("the existing local search"), REQ-002 |

The prompt named `apps/frontend/src/lib/trade/oracleSearch.ts`; the file is
`apps/frontend/src/components/trade/oracleSearch.ts`. `normalize` has no other
caller, so one change to it reaches all three searches.

Left out, with reason:

- the card-name chips in an answer (REQ-206) match an attached card's exact name;
  that is not a search the player types into;
- the card scanner identifies by artwork, not by name;
- rule search (System 3) searches rules text, not card names;
- word order and skipped words (`tomb urborg`, `urborg yawgmoth`) stay
  unmatched. Nothing in the request asks for them, and they would change ranking
  for every query.

### Decision

Card-name matching sets aside letter case, accents and punctuation on both sides
(the typed text and each name). Accented letters match plain ones. Hyphens and
slashes count as a space. Every other character that is not a letter, digit,
space or underscore is ignored. Runs of spaces count as one. Underscores stay.

Each search keeps its ranking (exact name, then starts-with, then contains, then
within two typing mistakes), its threshold, and its list length. Each suggestion
still shows the real printed name and resolves the same oracle card.

Measured with a prototype of this rule over the same card list: `urborg tomb`,
`urborg to`, `jace the mind`, `atraxa praetors`, `will o the wisp`, `lim dul` and
`fire ice` all find their card first. `urborg t` puts Urborg, Tomb of Yawgmoth
first. First-two-words recall rises from 3,380 to 7,052 of 7,288; whole-name
recall from 6,200 to 7,324 of 7,324. `sol ring`, `lightning bolt`, `urborg`,
`urborg, tomb` and `lim-dûl` return exactly what they return today.

In-depth details' Cards step also shows "No matching card found" when nothing
matches, as REQ-002 already requires and the other two searches already do.

### Material assumptions (ladder rung in brackets)

1. **One shared rule, not three.** The change lives in `lib/search.ts`'s
   `normalize`, which `oracleSearch.ts` already imports. [3 — established pattern;
   technical-design-rules "reuse before creating"]
2. **The list of three stays three.** 18 names start with `urborg`, and Urborg,
   Tomb of Yawgmoth ranks last of them on every search (longest name), so no
   list short of 18 shows it for a bare `urborg`. After the fix, one more letter
   (`urborg t`) puts it first. The list length is surfaced in the REQ-002 gate
   question so the owner can change it. [4 — smallest scope; 5 — preserve
   behavior]
3. **No popularity ranking.** Ranking Urborg, Tomb above Urborg Elf would need a
   popularity field the card list does not carry — a new data contract. [6]
4. **Underscores stay.** Two Un-set cards are named only with blanks (`_____`,
   `______`). Dropping underscores makes them unfindable; the prototype measured
   it. [5]
5. **Hyphens and slashes are spaces.** `lim dul` matches Lim-Dûl's Vault,
   `will o the wisp` matches Will-o'-the-Wisp, `fire ice` matches Fire // Ice. [4]
6. **The In-depth no-match message is in scope.** It is the same player symptom
   ("sees nothing") on the same path, and REQ-002 already requires the message.
   It changes no product truth. [1]
7. **Thresholds unchanged.** Ask a Question keeps its one-character threshold
   (REQ-167), the others three (REQ-001). The threshold counts the typed text
   after the rule is applied, so `,,,` reaches no search. [1]

## Problem 2 — the send pill on a browser without speech recognition

### What the player meets today

REQ-212 (dictate a question from the send pill) puts a microphone half beside the
arrow only where the browser has speech recognition, and says that elsewhere "the
pill is the arrow alone and nothing else changes." Firefox has none.

Measured in Chromium with both speech objects removed before page load (the path
Firefox takes): in all four question boxes REQ-212 lists — Ask a Question, its
follow-up, In-depth details' question, and its follow-up — the pill stays 88×44,
the arrow sits in the left 44px, and the right half is empty gradient. The
budget ring (the 300-character cue round the pill, REQ-206) still traces the
two-half shape from the missing seam. The owner's report — "the button looks
like its there, but the text/icon on the box isnt there" — is this empty half.
With speech available, the same pill is mic left, arrow right, as designed.

Cause: `.send-wrap` has a fixed width (`flow.css` 80px, raised to 88px in
`index.css` for the 44px touch floor), and `SEND_RING_PATH` in `ComposerPill.tsx`
is the two-half stadium. Neither knows whether the mic rendered. All four boxes
render through `ComposerPill`, so one fix covers them.

### Decision

Without speech recognition the send control is one round 44×44 arrow button. The
budget ring traces a circle round it, starting at its top and running clockwise.
The text field takes the freed width. With speech recognition, nothing changes.

### Material assumptions

8. **"The arrow alone" means one round button.** REQ-212's own wording, the 44px
   touch floor (REQ-205), and the pill's round ends. [1]
9. **The ring starts at the top of the circle.** REQ-206 starts it "at the top of
   the pill's split"; with no split, the top of the round arrow is the nearest
   reading, still clockwise. Stated in the REQ-206 gate question. [3]
10. **Not checked in a real Firefox.** Playwright's Firefox is not installed. The
    simulation runs the same branch (`dictation.isSupported` false). Build may
    check a real Firefox if one is available; it is not a gate. [4]

## Product truth (proposed in `GATE-QUESTIONS.md`, applied at build)

- **REQ-002** (autocomplete suggestions) — amended: the punctuation-and-accent
  rule, which searches it covers, unchanged ranking and list lengths, and the
  no-match message on every search.
- **REQ-212** (dictate from the send pill) — amended: the arrow-alone pill is
  one round 44px control with the ring round it, and a test that measures it.
- **REQ-206** (Ask a Question) — amended: the ring's start point when there is
  no split.

No new stable ID. No new `DEC`. No screen-layout row (no new screen or overlay).

### Amendment set — every other home of these rules (grep, 2026-10-13)

`grep -rn -i "typo|fuzzy|punctuation"` and
`grep -rn -i "mic|send|microphone half|mic half|arrow alone|pill's split"` over
`PRD/sections/`:

| Home | Says | Disposition |
| --- | --- | --- |
| `functional-requirements.md` REQ-002 | typo tolerance | gate question |
| `functional-requirements.md` REQ-206 ring criterion | ring starts at the pill's split | gate question |
| `functional-requirements.md` REQ-212 | arrow alone | gate question |
| `quick-lookup/README.md` "Built:" ring line | ring starts at the pill's split | build: add the arrow-alone case |
| `system-map.md` "Card search & metadata" / "Fuzzy autocomplete" | fuzzy autocomplete; lives in `lib/search.ts` | build: name the punctuation rule and list `components/trade/oracleSearch.ts` |
| `quick-lookup/README.md`, `screen-layout.md`, `user-flows.md`, REQ-110 (`functional-requirements.md`) | "mic\|send pill" | no change — they describe the speech-available pill, which is unchanged |

## Non-goals

- No popularity ranking, new data field, index file or dependency.
- No change to list lengths or thresholds (unless the owner edits REQ-002).
- No word-order or skipped-word matching.
- No change to the pill where speech recognition exists, to dictation, or to the
  mic's placement.
- No request, prompt, route or endpoint change.

## Verification the build must show

- Unit tests over `lib/search.ts` and `oracleSearch.ts` for every query in the
  REQ-002 diff, plus `_____` still finding the blank-named card.
- Re-run of the corpus measurement (`evidence/measurements.md` §1): first-two-words
  recall at or above 7,052 of 7,288, whole-name 7,324 of 7,324.
- In the browser, In-depth details' Cards step shows "No matching card found" for
  `urborg tomb` before the fix lands and Urborg, Tomb of Yawgmoth after.
- Component tests for each of the four boxes without the speech API: one 44px
  round send control, no empty half; with the API, unchanged.
- A browser measurement of the four boxes without the speech API: the send
  control and its wrapper both 44px wide; screenshots under
  `PRD/work/card-search-and-send-pill/.playwright-mcp/`.
