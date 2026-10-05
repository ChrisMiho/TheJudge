# Design brief — in-depth chip collapse

## What the player sees

On the Ask a Question composer, the **In-depth chip** sits at the bottom-left of
the question box. Today it reads **◈ In-depth** — the glyph plus its text label —
and on a single-row box that label eats width the question needs, even while the
player is typing.

The change: the chip keeps its **In-depth** label only at rest — when the box is
empty and the player has not clicked into it. The moment the player focuses the
box or there is any text in it, the chip collapses to the **◈** glyph alone,
handing that width back to the question. Blur the empty box and the label returns.

Net effect for the player: a first-time user still sees "In-depth" at rest and
learns the chip is there; once they start a question, the glyph gets out of the
way and the opening words have more room before the box wraps to a second row.

## Scope

- Ask a Question composer (`/quick-lookup`, `mode: "lookup"`), the In-depth chip
  only. Frontend/CSS only.
- Amends **REQ-206** — one acceptance-criterion sub-clause. No new stable ID.

## The decision (Option B)

Two shapes were on the table in intake:

- **Option A** — always glyph-only on the Ask composer. Cleanest, but drops the
  teaching affordance: a first-time player never sees the words "In-depth".
- **Option B (chosen)** — labelled at rest (empty **and** unfocused), glyph-only
  once focused or holding text. Teaches the feature, then gets out of the way.

Chosen: **B**. It is the smaller change to user-visible behavior (the resting
state is unchanged; only the engaged state collapses) and it preserves the
teaching label. Intake records the owner leaning B on 2026-10-04; the define gate
still puts the choice to the owner in `GATE-QUESTIONS.md` as an accept/edit/reject.

## Non-goals

- No change to **what In-depth does** — the carry-to-In-depth-details behavior,
  the request, the routes, and the prompts are all untouched.
- No change to **ComposerPill structure** (`ComposerPill.tsx` markup). The
  collapse is a CSS state rule only.
- The existing **`<480px` always-icon-only** rule is kept as-is — narrow phones
  stay glyph-only in every state, unchanged.
- No change to the chip's accessible name. The button keeps its
  `aria-label="Add in-depth details"` and `title`; the `.lbl` text is already
  `aria-hidden`, so collapsing it is invisible to assistive tech.

## Departure from the mockup (flagged)

REQ-070's redesigned-screens exception says Ask a Question follows its approved
direction-1 mockup. The mockup draws the chip labelled/icon-only **by width
only** — it has no "collapse while typing" state. This change deliberately adds a
state-based collapse the mockup does not draw. That is the point of the request,
not an oversight; the gate question names it so the owner signs off on going
beyond the mockup for the single-row typing state.

## Material assumptions (graph controlling — assumption ladder applied)

1. **Trigger = engaged (focused OR non-empty), not grown-to-two-rows.** The label
   only competes for width on the single-row state; once the box grows to two
   rows the text already owns a full-width top row, so the label is not stealing
   from it there. Collapsing on engage (before the first keystroke) means the
   opening characters already have the room. (Assumption ladder #5: preserve
   user-visible behavior except where the request changes it — the two-row state
   is unchanged.)
2. **Option B over A** — see The decision above. (Ladder #4/#5: smallest reversible
   scope, resting state preserved.)
3. **Product truth is state-based; the CSS selector is an implementation note.**
   The requirement says "focused or holds text"; the build expresses it as the
   textarea being focused (scoped to the text field, not a bare `.q-box:focus-within`,
   so keyboard focus on the chip, mic, or send button does not drop the label)
   or a non-empty-fill state, per the owner's REQ-206 `edit` verdict
   (2026-10-05), extending the existing
   `@media (max-width:479px) { .q-box .deep .lbl { display:none } }` block in
   `apps/frontend/src/styles/flow.css`. (Ladder #3: established local pattern.)
4. **Coordination with `anchor-ask-composer`.** That package (owner-action, docs
   PR #249 merged, all verdicts accept) also amends REQ-206 (REQ-110/129/206) and
   is approved-but-not-yet-built, so its REQ-206 edits are not yet in
   `PRD/sections/`. Both edits touch REQ-206's composer acceptance criteria.
   Whichever builds second reconciles against the other's landed REQ-206 text; the
   amendment here is scoped to the labelled/icon-only sub-clause, which
   anchor-ask-composer does not rewrite, so the edits are expected to compose, but
   the build must re-read REQ-206 before applying. Recorded as a dependency, not a
   blocker.

## Verify at build

Not verified live this session (dev-server launch was permission-denied in
intake). Mechanism is cross-confirmed in two files (shipped `flow.css` and the
direction-1 mockup `flow.css`). Measure at build:

- **1440×716** and **390×740** desktop/phone widths: the chip shows "In-depth" at
  rest, collapses to ◈ on focus and on first keystroke, and returns to labelled on
  blur of an empty box.
- The single-row box wraps to two rows later with the label collapsed (the width
  it frees is real).
- `<480px` stays glyph-only in every state.
- The chip's accessible name is unchanged (snapshot/axe check).

## PRD alignment

- Amends **REQ-206** (functional-requirements.md) — the `question box has two
  rows … (labelled or icon-only at each width as the mockup shows)` acceptance
  sub-clause. Full proposed diff in `GATE-QUESTIONS.md`.
- The `quick-lookup/README.md` current-state mirror describes the two-row box
  (line ~107) but does **not** carry the labelled/icon-only detail, so it needs no
  edit for consistency.
- No new user-visible screen or major overlay → no `screen-layout.md` row
  (DEC-149 / REQ-126 do not apply).
- No new `DEC-###` (decision log retired); the change is an in-place edit to
  REQ-206.
