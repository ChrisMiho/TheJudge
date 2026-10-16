# Gate questions — waiting bubble on one row

**Decide:** one slot below, an amendment to an existing requirement (REQ-023).
No new stable ID. No blocker.

Every diff is against `PRD/sections/` at `b9c922db`. Line numbers are where the
hunk starts today. Evidence: `evidence/measurements.md`. The full reasoning is
in `DESIGN-BRIEF.md`.

Look first (local screenshots, under
`PRD/work/in-depth-context-spacing/.playwright-mcp/`):

- Desktop: `ask-desktop-1440-s27-today.png` → `ask-desktop-1440-s27-onerow.png`
- Phone 390: `ask-phone-390-s42-today.png` → `ask-phone-390-s42-onerow.png`
- Phone 375, longest phrase: `ask-phone-375-s27-today.png` → `ask-phone-375-s27-onerow.png`
- Whole In-depth screen on a phone: `indepth-phone-375-s42-today-viewport.png` → `indepth-phone-375-s42-onerow-viewport.png`

## REQ-023 — the waiting bubble puts the icon, the phrase and the timer on one row

**What this decides:** whether the waiting bubble shows its icon, its funny
phrase and its timer side by side on one row, instead of stacked.

**In plain terms:** after a player sends a first question, the bubble that
fills the wait (REQ-023: it replaces the form, shows a running timer and a
funny phrase that changes at 0, 3, 8, 15, 25 and 40 seconds, and announces
each phrase to screen readers) today stacks the icon (the colour's small ringed
seal) on top, the phrase under it, and the timer at the bottom. It is about
123 px tall. The change puts the icon on the left, the phrase in the middle and
the timer on the right, all on one row, and the bubble drops to about 62 px.
On a phone, a long phrase wraps onto a second line in the middle while the icon
and timer stay on the row beside it (bubble 66–68 px); no phrase is cut off.
The phrases, their timing, the animations, the colours, the timer's size and
the screen-reader announcements stay exactly as they are. This applies to both
In-depth and Ask a Question, because Ask a Question uses the same bubble by
rule (REQ-092: it reuses the waiting bubble as-is, with no separate version).
Recommendation: accept.

**What happens if you say no:** nothing changes. The bubble stays stacked —
icon, then phrase, then timer — in both In-depth and Ask a Question, and the
build has nothing to do. Edit this slot instead if you want the one row in
only one of the two flows (that needs a second bubble version, which REQ-092
forbids today, so it would amend REQ-092 too), or if you want a long phrase
cut with "…" on a phone instead of wrapping.

```diff
@@ functional-requirements.md:429 — REQ-023, Acceptance Criteria @@
-  - the panel is drawn as the judge's bubble under the colour's seal: each threshold line inks itself in letter by letter with a glow that fades, the line before lifts and fades, the elapsed clock ticks at the bubble's foot, two motes of the colour's light drift up through it, a faint dashed ring turns round the seal, and the bubble's edge breathes in the colour's light; the absurd-tone lines are set in italics; under reduced motion each line appears whole and nothing drifts or turns
+  - the panel is drawn as the judge's bubble with the colour's seal, the threshold line and the elapsed clock on one row: the seal at the start, the line in the middle, the clock at the end, all three centred on the row; a line too long for the middle wraps onto further lines there, in full, never cut short and never pushing the seal or the clock off the row; each threshold line inks itself in letter by letter with a glow that fades, the line before lifts and fades, the elapsed clock ticks at the row's end, two motes of the colour's light drift up through it, a faint dashed ring turns round the seal, and the bubble's edge breathes in the colour's light; the absurd-tone lines are set in italics; under reduced motion each line appears whole and nothing drifts or turns
@@ functional-requirements.md:438 — REQ-023, Notes @@
   - amended for the `ui-reimagining-build` pass (2026-09-30): thresholds and copy unchanged; the panel takes the direction-1 inscription treatment, CSS-only (NFR-006)
+  - amended by `in-depth-context-spacing` (2026-10-15): the seal, the line and the clock moved from a stack (seal on top, line under it, clock at the foot) onto one row, at the owner's request for a cleaner, shorter bubble. Thresholds, copy, timing, motion, colours, the clock's size and the `aria-live` region are unchanged. Measured live: the bubble went from about 123 px tall to about 62 px at 1440x900, 390x844 and 375x667; on a phone the four longer lines wrap to two lines in the middle (bubble 66–68 px) with the clock still at the row's end. Applies wherever `AskAiWaitingPanel` renders, so In-depth details and Ask a Question (REQ-092) both take it
```

```diff
@@ in-depth/README.md:278 — The wait, the answer, and the conversation @@
 - Built: while the decrypt request is in flight, the submit form is replaced by
   the `AskAiWaitingPanel` — a live elapsed timer with `aria-live` threshold
   messages at 0s / 3s / 8s / 15s / 25s / 40s (CSS-only motion) — while the card
   list and wizard context above the form stay visible. It is drawn as the judge's
-  bubble under the colour's seal, each line inking itself in letter by letter.
+  bubble with the colour's seal, the line and the clock on one row (seal first,
+  clock last; a long line wraps in the middle), each line inking itself in
+  letter by letter.
   (DEC-031, REQ-023)
```

- Verdict: accept
- Reason: owner, in session 2026-10-15, after viewing the one-row screenshots: "yes, these one row look great, and i love how the text stacks on itself in case its long, without affecting the other components, i was afraid the text would be too small but i think this looks alright"
