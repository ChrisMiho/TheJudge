# Gate questions — in-depth chip collapse

One block per stable ID. Each carries the plain-language block, the complete
proposed `PRD/sections/` diff, and an accept/edit/reject slot. Refinement
**proposes**; the build applies the approved diff to `PRD/sections/`. Nothing
here is written to `PRD/sections/` at this gate.

---

## REQ-206

### What this decides

Whether the Ask a Question composer's **In-depth chip** drops its "In-depth"
text label the moment the player engages the question box — focuses it or types
in it — showing just the **◈** glyph, and brings the label back only when the box
is empty and unfocused. Today (REQ-206, as built) the chip's label shows or hides
**by width only**: it reads "◈ In-depth" at normal widths and collapses to the
glyph only on viewports narrower than 480px. REQ-206 is the requirement for the
Ask a Question page — one question door, the card stage, the two-row question box,
and the carry into In-depth details.

### In plain terms

The "In-depth" words stay while the box is empty and you have not clicked in, so a
first-time player still learns the chip is there. As soon as you click into the
box or start typing, the words disappear and only the ◈ remains, giving your
question more room before the box wraps to a second row. Click away from an empty
box and "In-depth" comes back. Narrow phones (under 480px) are glyph-only in every
state, exactly as today. The chip still does the same thing and still announces the
same name to screen readers; only the visible label comes and goes.

This goes one step beyond the approved mockup, which never drew a "collapse while
typing" state — it is the new behavior the request asks for.

### What happens if you say no

The chip keeps showing "◈ In-depth" the whole time you type on a normal-width
screen. On a single-row box that label keeps eating width the question could use
and makes the box wrap to a second row sooner. Nothing breaks; the composer just
stays as it is today.

### Alternative on the table

- **Option A (not proposed)** — always glyph-only on the Ask composer, at every
  width and state. Cleanest, but a first-time player never sees the word
  "In-depth" and may not discover the chip. Choose this with an `edit` verdict if
  you prefer it.

### Proposed diff — `PRD/sections/functional-requirements.md`, REQ-206

Acceptance Criteria — replace this line:

```
  - the question box has two rows, as the mockup page draws it: the text on top; the Add in-depth details chip at the bottom-left (labelled or icon-only at each width as the mockup shows) and the send pill, with its microphone half (REQ-212), at the bottom-right; the character count sits where the mockup places it
```

with:

```
  - the question box has two rows, as the mockup page draws it: the text on top; the Add in-depth details chip at the bottom-left (labelled or icon-only by width and composer state: the "In-depth" label shows only while the box is empty and unfocused, and the chip collapses to the ◈ glyph alone once the box is focused or holds text, freeing the single-row width for the question; the `<480px` always-icon-only rule is unchanged; the chip's accessible name is unaffected) and the send pill, with its microphone half (REQ-212), at the bottom-right; the character count sits where the mockup places it
```

Notes — append this bullet to REQ-206's Notes list:

```
  - amended by `indepth-chip-collapse` (2026-10-04): the In-depth chip now collapses to the ◈ glyph alone whenever the Ask composer is engaged (focused or non-empty) and keeps the "In-depth" label only at rest (empty and unfocused), freeing single-row width for the question; this is a deliberate departure from the direction-1 mockup, which draws the chip's label by width only (no collapse-while-typing state) — the owner signed off on going beyond the mockup for the single-row typing state. Frontend/CSS only: extends the existing `@media (max-width:479px) { .q-box .deep .lbl { display:none } }` block in `apps/frontend/src/styles/flow.css` with a `:focus-within` / non-empty-fill state rule; no `ComposerPill.tsx` structure change, and the `<480px` always-icon-only rule and the chip's accessible name are unchanged
```

### Verdict

- [ ] accept
- [ ] edit: ____________________
- [ ] reject

---

## Blocker questions

None. The request is explicit and the design resolves under the assumption ladder
(recorded in `DESIGN-BRIEF.md`); no question meets the genuine decision blocker
test.
