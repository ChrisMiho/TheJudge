# Quality check — life-tracker-desktop-nav

- Result: **PASS**
- Mode: graph-controlled (`graph is controlling`), run `graph-20261017-043546`, node `gate-qc`, attempt 2 (re-grade after define attempt 2)
- Checked: `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `evidence/measurements.md`, against `PRD/sections/` and the code at `f4ecac0d`
- Status: left at `STATUS.refined` (the only marker; board row under `## refined`)

**What happened:** the one blocking gap from attempt 1 is closed. The brief now
says how the ☰ follows the header the stylesheet shows, and that mechanism
fits the code and REQ-096. A player resizing across 768px keeps exactly one
visible ☰. The phone Life Tracker is untouched.

## Blocking findings

None.

## Previous findings, one line each

1. ☰ does not follow the visible header by CSS: **resolved.** Design item 3 and
   assumption 8 choose a layout-box check (`getClientRects().length > 0`) plus a
   guarded `ResizeObserver`, confined to `FeaturePortalMenu.tsx`; Design item 3,
   assumption 7, Touched files, Non-goals and the REQ-248 Constraints now name
   that file; live probe recorded in `evidence/measurements.md` (line 99).
2. Disposition table missed greps hits: **resolved.** Rows 39–46 added; re-ran
   both greps over `PRD/sections/` (excluding `decisions*`): 68 distinct
   file:line hits, every one falls in a row (REQ-202 range 5114–5160, REQ-207
   5393–5400, shared-chrome 125–139 cover their sub-hits).
3. REQ-067 and REQ-202 phone exception: **resolved.** REQ-067 gets its own
   block with a phone-row pointer in Description and docking criterion; REQ-202
   gets a written no-change reason (row 31) that holds.
4. Resize-across-768 live check in the REQ-248 tests item: **resolved.** The
   tests item and the brief's acceptance list name the 1440 → 767 → 768 → 390
   → 1440 record (☰ rect, focus, visible count).

## Mechanism check

- Code today (`FeaturePortalMenu.tsx:182-184`): the slot is the first not inside
  `[hidden]`; the proposal keeps that as the fallback when no slot has a box
  (jsdom), so existing tests keep their results. `ThemeSection.tsx:98` already
  guards `ResizeObserver` with `typeof ... === "undefined"`, as the brief says.
  `PortalSlot.tsx` comment (lines 19–21) already says "picks whichever one is
  currently visible"; no change there is accurate.
- Each destination has its own `PageShell` header slot inside its
  `DestinationOutlet` wrapper (`hidden` for inactive ones), so an inactive
  destination's banner cannot attract the ☰. Other destinations register one
  slot each, so their ☰ does not move.
- REQ-096 ("no ... viewport check in JavaScript selects a mobile/desktop
  layout"): CSS picks the header; JS only follows a layout box and an observer
  callback, never reads width, `matchMedia` or a resize event. Consistent, no
  exception needed.
- REQ-202: the change is one shared rule for all destinations, not a tracker
  override; `StagedStepHeader` is consumed through existing `rightSlot` and
  `plainBrand`. Consistent.
- Screens with one header keep today's behavior: stated and supported by the
  fallback and the single-slot case.

## What passed

- Diffs apply: all 13 diff hunks in `GATE-QUESTIONS.md` match current
  `PRD/sections/` text exactly once (REQ-207 line 5399, dependency tail and
  small-fixes note; REQ-067 lines 1591/1593, dependency tail and ui-reimagining
  note; `life-tracker/README.md` three hunks; `screen-layout.md` Life Tracker
  row and line 89; `shared-chrome/README.md` Menu bullet). The REQ-248 append
  goes after REQ-247 (last block, file ends line 6605).
- IDs: REQ-248 appears nowhere in `PRD/sections/`. REQ-248 (new), REQ-207 and
  REQ-067 (amended) each have their own block; the mirror files ride under
  the blocks that drive them.
- Plain-language blocks: each of the three blocks opens with What this decides,
  In plain terms and What happens if you say no; the page opens with Decide.
  REQ-111, REQ-203, REQ-215, REQ-207, REQ-067 and DEC-136 are inlined by
  substance. Verdict and Reason slots are blank in all three.
- Phone unchanged: REQ-248 records the measured 390×844 baseline (header
  12,12,366,45; ☰ 12,13,44,44; Day/Night 265,17,69,36; ⚙ 342,17,36,36; table
  12,65,366,759); REQ-207's exception and the non-goals say so.
- Agent-ready: breakpoint 768px with product-truth and code basis; measured
  acceptance numbers (banner 0,0,W,68; ☰ 10,7,54,54 at 1440×900 and 768×1024;
  document height equals viewport; one mock strip; one ☰); touched files
  listed, including the tests.
- Other checklist items: current vocabulary; no stack, endpoint or prompt
  change; no new screen, and `screen-layout.md` gets a Header row (DEC-149 /
  REQ-126).

## Advisory findings (not blocking)

- The brief's Status line says "refined"; the board and `STATUS.refined`
  agree. No action.
- The mock-strip rule (single strip under the banner) may need a `PageShell.tsx`
  change; the brief lists it as "possibly". Build should confirm early, as the
  known-gap note in `shared-chrome/README.md` (rows 13) is only updated if the
  mock-mode measurement shows the tracker cleared.

## Next

Quality-check PASS. The driver records the result in the README `Preparation
gate` section; map-out follows after the owner answers the gate.
