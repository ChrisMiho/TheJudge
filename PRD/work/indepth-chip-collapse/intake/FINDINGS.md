# Findings — in-depth chip collapse

## Verdict

The owner's instinct is right, with one precise correction to the trigger:
collapse the In-depth chip to glyph-only **when the composer is engaged
(focused or non-empty)**, not when the box has grown to two rows. The collapse
only buys text room on the **single-row** state; in the two-row state the text
already owns a full-width top row, so the label is not competing there.

## Why (mechanism, from code + mockup)

Single row (empty/short question, desktop ≥480px):
`[◈ In-depth]  [ textarea ]  [n/300]  [mic|send]` — the "In-depth" label (~60–70px)
sits on the same row as the text and pushes the wrap-to-two-rows point earlier.

Two rows (`textarea.grown`): shipped `flow.css:214` and mockup `flow.css:205`
both set the textarea to `flex: 1 0 100%; order: -1` — a full-width top row. The
chip + count + send drop to row two. So once wrapped, the label no longer steals
width from the text.

Conclusion: collapsing the label **delays the first wrap and declutters the
typing row** on the single-row state. It does nothing for the grown state, and it
is not load-bearing for anchor-ask-composer's pin-and-grow behavior (growing to
two rows is already safe under the frame). It is a genuine, separate smoothing.

## Current behavior

- Label hides only at `max-width: 479px` viewport (`flow.css:283`,
  mockup `flow.css:274`). No "collapse while typing" rule exists — the owner's
  idea is new, not already drawn by the mockup.
- Count hides when empty (`.q-box[data-fill="0"] .q-count { display: none }`),
  so an empty single row is already `[chip][textarea][send]`.
- Accessibility already independent of the label: the button carries
  `aria-label="Add in-depth details"` and a `title` in ComposerPill.tsx, with
  `.lbl` marked `aria-hidden`. Glyph-only stays fully labelled to AT.

## Recommended shape

Trigger: `.q-box:focus-within` OR `.q-box[data-fill="some"]` → hide `.deep .lbl`.
(Collapses the instant you engage, before the first keystroke, so the opening
characters already have the room; returns to labelled when empty AND blurred, so
a first-time user still sees "In-depth" at rest and learns the feature.)

Mechanism: one CSS rule in `apps/frontend/src/styles/flow.css`, extending the
existing `@media (max-width:479px) { .q-box .deep .lbl { display:none } }` block
with a state selector. **No change to `ComposerPill.tsx` structure** — respects
the idea's non-goal ("no change to ComposerPill structure"). Keep the <480px
always-collapsed rule.

Open design choice for the owner:
- (B, recommended) keep the label at rest (empty + unfocused), collapse on
  engage — teaches the feature, then gets out of the way.
- (A) always glyph-only on the Ask composer — cleanest, but drops the teaching
  affordance for first-time users.

## Where it lands

Fold into anchor-ask-composer, as an **edit to REQ-206**. REQ-206 already reads
"the Add in-depth details chip ... (labelled or icon-only at each width as the
mockup shows)" — extend "at each width" to "at each width and composer state
(labelled at rest; icon-only when focused or non-empty)." The package is still
at the define gate (owner-action), so this is an `edit` verdict on REQ-206 in
`GATE-QUESTIONS.md` before merge — or a `thejudge-amend` after it ships.

## Not verified live this session

Dev server launch was permission-denied. Mechanism is cross-confirmed in two
independent files (shipped + mockup `flow.css`), but the exact pixel room freed
and the smoothness of the collapse should be measured at build at 1440×716 and
390×740 (the brief's existing "Verify at build" covers this surface).

## Decision (owner, 2026-10-04)

Option **B**: labelled at rest (empty AND unfocused), collapse to glyph-only when
focused or non-empty. Keep the existing <480px always-collapsed rule.

### Build-ready REQ-206 edit (to fold into anchor-ask-composer)

Current acceptance line (functional-requirements.md:5240):
> the question box has two rows, as the mockup page draws it: the text on top;
> the Add in-depth details chip at the bottom-left (labelled or icon-only at
> each width as the mockup shows) and the send pill...

Proposed edit — replace "(labelled or icon-only at each width as the mockup
shows)" with:
> (labelled or icon-only by width and composer state: the "In-depth" label shows
> only while the box is empty and unfocused, and collapses to the ◈ glyph alone
> once the box is focused or holds text, freeing the single-row width for the
> question; the <480px always-icon-only rule is unchanged; the chip's accessible
> name is unaffected)

Implementation note (frontend-only, no ComposerPill structure change): extend the
`@media (max-width:479px) { .q-box .deep .lbl { display:none } }` block in
`apps/frontend/src/styles/flow.css` with a state rule —
`.q-box:focus-within .deep .lbl, .q-box[data-fill="some"] .deep .lbl { display:none }`.
