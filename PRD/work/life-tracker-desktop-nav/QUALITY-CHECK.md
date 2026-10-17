# Quality check — life-tracker-desktop-nav

- Result: **FAIL**
- Mode: graph-controlled (`graph is controlling`), run `graph-20261017-043546`, node `gate-qc`, attempt 1
- Checked: `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `evidence/measurements.md`
- Status set: `STATUS.refining`

**What happened:** the proposal is sound on product truth and form, but the
design rests on one claim about the Menu button that the code does not support.
A player resizing a tablet or window across 768px could end up with the ☰
inside the hidden header.

## Blocking findings (return to refinement)

1. **The ☰ does not follow "whichever header is visible" by CSS.** The brief
   (Design item 3) and the gate text say `FeaturePortalMenu` "already tracks
   every registered `PortalSlot` and docks the ☰ into whichever one is
   visible", so a pure CSS media query at 768px is enough. In
   `apps/frontend/src/components/portal/FeaturePortalMenu.tsx` (lines 178–184)
   the visible slot is `slotEntries.find(e => e.node.closest("[hidden]") === null)`:
   it only skips slots inside an element with the HTML `hidden` attribute (a
   hidden destination). A slot inside a header that a media query hides with
   `display: none` still counts as visible. The ☰ is a single button portalled
   into one slot, chosen on registration order and active destination, not on
   viewport width. With two `PortalSlot`s mounted in the tracker (banner and
   compact row), the ☰ would sit in whichever registered first and stay there
   across a resize, so at one of the two widths the player sees no ☰ or the
   wrong one. This breaks the REQ-248 criteria "exactly one ☰ visible and
   focusable at any width" and "resizing across 768px swaps headers", and it
   conflicts with the constraint "CSS media query only, no JavaScript viewport
   detection (REQ-096)". The brief's "build must confirm" wording hides a design
   gap, not a verification step. Refinement must choose and record a concrete,
   REQ-096-compatible mechanism, for example: make slot selection width-aware
   with a CSS-based visibility check, mount only one tracker `PortalSlot` at a
   time, or document that REQ-096 allows a narrow `matchMedia` for this swap.
   It must then correct the "Design", "Decisions and assumptions" (item 7,
   "no shared component changes") and "Touched files" sections, and the
   REQ-248 Constraints bullet ("consumed as it is"), to name
   `FeaturePortalMenu.tsx` / `PortalSlot.tsx` if they change. This is a hidden
   assumption in scope (checklist: "Scope is implementable without hidden
   assumptions"), and it changes the "Touched files" list.

## Advisory findings (not blocking; fix in the same refinement pass)

2. **Disposition table misses a few hits of its own grep.** Re-running the two
   documented greps over `PRD/sections/` (retired `decisions*` excluded) returns
   these hits that have no row: `functional-requirements.md:5679` (REQ-215
   "built by slice G" file list naming `StagedStepHeader.tsx`),
   `user-flows.md:229, 301, 409` (Menu tray list, tracker seed, History stays
   reachable), `functional-requirements.md:1921` (REQ-081 title), `:2003`, `:2021`
   (persistence and seed requirement titles), `system-map.md:221` (Theme settings
   summary). All are clear no-change hits, but the table claims to cover every
   hit. Add rows or narrow the grep text so the claim holds.
3. **REQ-067 and REQ-202 still say "every destination" with no phone exception.**
   Row 18 and row 31 of the table mark them no-change because REQ-207 records
   the exception. REQ-067 says the ☰ sits "at the left of every destination's
   banner header, docking through the destination's `PortalSlot`"; below 768px
   the phone tracker has no banner header. Consider a one-clause pointer there,
   or state in the table why a reader of REQ-067 alone is not misled.
4. **Screenshot rule.** REQ-202 asks for a 390×844 and 1440×900 pair; the brief
   adds 768×1024, which is good. Make sure the REQ-248 tests item names the
   resize-across-768 check as a live check in the PR, since that is where
   finding 1 will show.

## What passed

- **Diffs apply.** All ten diff hunks in `GATE-QUESTIONS.md` match current
  `PRD/sections/` text exactly once (REQ-207 line 5399, its REQ-213 dependency
  tail and the `small-fixes-cats-menu-white` note, `life-tracker/README.md`
  Backed by, What it is and Day/night header control, `screen-layout.md` line
  89 and the Player Life Tracker row, `shared-chrome/README.md` line 125). The
  REQ-248 append goes after REQ-247 at the end of the file (line 6605).
- **IDs.** REQ-248 is unused anywhere in `PRD/sections/`. Each new or amended
  stable ID (REQ-248, REQ-207) has its own block, and the two other touched
  files (`life-tracker/README.md`, `screen-layout.md`, `shared-chrome/README.md`)
  ride under those blocks as their built-state mirrors.
- **Plain-language blocks.** Both blocks open with the three lines (What this
  decides, In plain terms, What happens if you say no) and the page opens with
  Decide. REQ-111, REQ-203, REQ-215, REQ-207 and DEC-136 are inlined by
  substance. Verdict and Reason slots are blank.
- **Phone unchanged.** Every artifact leaves the phone tracker alone: REQ-248
  below 768px records the measured baseline (header 12,12,366,45; ☰ 12,13,44,44;
  Day/Night 265,17,69,36; ⚙ 342,17,36,36; table 12,65,366,759), the brief's
  non-goals say so, and REQ-207's exception records it.
- **Agent-ready (apart from finding 1).** The desktop breakpoint is stated
  (768px, with product-truth and code basis). Acceptance conditions are
  measured: banner 0,0,W,68 and ☰ 10,7,54,54 at 1440×900 and 768×1024, document
  height equals viewport, one mock strip, one ☰. The `StagedStepHeader`
  `rightSlot` (shown at `md`, 768px) and `plainBrand` options exist as claimed,
  and the tracker's current `h-[calc(100dvh-2rem)]` column explains the 16px
  scroll the brief cites.
- **Other checklist items.** No contradiction with
  `shared-chrome` / `life-tracker` specs beyond finding 3; current vocabulary
  used; no stack, endpoint or prompt change; no new screen, so the
  `screen-layout.md` DEC-149 / REQ-126 row rule is met by the added Header row.

## Return to refinement

Fix finding 1 (record the docking mechanism, update Design, assumptions,
touched files and REQ-248 constraints, and re-check the REQ-096 position), fold
in advisories 2–4, then re-run quality-check.
