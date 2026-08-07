# DESIGN-BRIEF: ui-review

Status: approved (initial approval 2026-08-06; scope widened and re-approved 2026-08-06
after a live Playwright sweep; first quality-check FAIL corrections approved 2026-08-06 —
see *Quality-check corrections* below, scope unchanged by that round; second
quality-check FAIL corrections approved 2026-08-06; **third quality-check FAIL correction
and mockup direction approved 2026-08-06; fourth quality-check correction approved
2026-08-06; phone Search/Scan single-row addition approved 2026-08-06**).

## Problem

`braindump.md` lists ten concrete UI issues across the Quick Question card-search flow and
the In-Depth player/game panels. The first refinement round scoped seven requirements from
code reading alone. A second round then ran the app live (Playwright MCP, 390×844 and
1440×900, captures in `.playwright-mcp/`) and **falsified the premises of three of those
seven**, confirmed the rest with measurements, and surfaced sibling defects the braindump
did not name. The product owner asked for a light sweep across all destinations with a
particular focus on mobile card legibility and natural flow.

`screen-layout.md` (DEC-149) remains the layout guardrail for every sizing change here.

## What the live sweep changed

Three requirements were rewritten because measurement contradicted the code-reading
assumption. Recording this explicitly so implementation does not re-derive it:

| Requirement | Assumption that was wrong | What is actually true |
| --- | --- | --- |
| REQ-133 / DEC-156 | Card fields move into DEC-151's popup, "popup unchanged" | The popup is `absolute inset-0` **on the image**: 92×128px holding 356px of content, close X overflowing its container by 37px. It cannot host more. **DEC-158** frees it. |
| REQ-135 | Outside-click is broken and must be wired | Scrim dismissal **works** at both bands. The defects are the text `Close` button and a worst-case 127px dismissible band sitting behind the header. |
| REQ-139 | Fields must stop being a three-column grid | They **already stack** below `sm`. The waste is control *width*: 281px (phone) / 214px (desktop) for a two-digit value. |

## Measured baselines

Every number below was taken live and is quoted in the requirement it belongs to, so
implementation has a concrete before-value to beat.

| Surface | Baseline |
| --- | --- |
| Card image (both bands) | 92×128px — `max-h-32`, no responsive override; ~31% of phone content width |
| Card detail popup | 92×128px box, 356px content, 66px text column; close button laid out at x=234–278 inside a dialog ending at x=241 |
| Question counter | backspacing `"D"` → `""` raises the counter 1 → 29; with a topic locked, an empty field reads 22/300 |
| Question submit gate | topic locked + 300 typed chars → `323/300`, submit disabled, no error, and `maxLength` blocks typing further |
| View Context gap | `.adaptive-context-trigger` `margin-top: 32px`, compensating for a rail whose measured height is **0px** |
| View Context scrim | worst-case dismissible band 127px (~15% of viewport height) |
| Expand toggle | U+25B8 (*small* triangle) inside a 56×44px `rounded-lg` bordered button; hint text's U+25BE renders as a near-invisible dot |
| Commander damage | 457px between label text end and input at 1440×900 |
| Poison/energy/experience | 281px (390×844) / 214px (1440×900) input width per field; three expanded players = 1165px tall |
| Trade Balancer | `Prices as of 2026-06-05T22:21:13.248Z` shown to users |

## Confirmed choices

| Question | Choice |
| --- | --- |
| Scope width | Light sweep across all destinations, mobile-first, driven live with Playwright MCP — not just the reported screens, not a full unbounded audit |
| Primary concern | Card image legibility and natural flow on mobile (REQ-141 is the product owner's top priority) |
| REQ-136 gap fix | Give the corner rail a real in-flow footprint and **delete** the compensating margin — not tune the constant |
| Close-control target | One shared, theme-derived X adopted by **all six** overlays (DEC-159) |
| Card popup geometry | Freed from the image's bounding box into the overlay family (DEC-158) — the braindump anticipated this |
| Commander damage control | Tighter grouped layout only — stays a plain free-typed numeric input, no dropdown, no cap |
| Poison/energy/experience | Bounded selects (0–11 / 0–100 / 0–100) sized to content, stacked at both bands, with an explicit unset option; **not** Life Tracker's tap/hold `CounterControl`. Stacking the desktop row adds ~2 rows per player — accepted, since consistent stacking plus content-sized controls is the point |
| Card-area end state | Remove card is the only control beside the image, smaller and below it; freed width is spent on the image (REQ-141) |
| Card image sizing mechanism | Container-relative, replacing the fixed `max-h-32` (DEC-160). One rule in the shared component — explicitly **not** a size variant or per-screen prop |
| Card image surface scope | **All six user-visible card surfaces** grow, including the In-Depth selected-card/add preview, zone strip, and Scan review. The zone tile keeps its 160px width; the image grows inside it |
| Zone selected-card/add preview | Approved mockup A, **Legibility first**: large shell-column card, exact selected name in the search field, no duplicate title below the art, Add action directly below and still within REQ-125's first-viewport bound. See `mockups/selected-card-add-preview-approved.png` |
| Zone search / Scan launcher | Search and the labeled Scan button share one non-wrapping row at every viewport width; Scan keeps the 44px touch floor, search flexes, and the reclaimed phone row height may support the larger preview without relaxing the Add bound |
| Question counter measurement | Raw editable textarea text, for the counter, the `maxLength` cap, and the submit gate alike. REQ-091 amended in place; the composed string may exceed 300 by the pill phrase |
| Trade Balancer timestamp | In scope (REQ-145) — the only sweep find outside the reported screens |
| Life Tracker seat grid | Out of scope, unchanged (DEC-136/DEC-139) |

## Product truth

| ID | Role |
| --- | --- |
| DEC-160 | New — card images size relative to their container instead of `max-h-32`; all six card surfaces grow; amends DEC-151 clause (1) |
| DEC-158 | New — card detail popup freed from the image's bounding box; amends DEC-151, supersedes DEC-156 clause (1)'s "unchanged" qualifier; Impact list corrected to all six surfaces |
| DEC-159 | New — one shared theme-derived close control across all six overlays; widens DEC-156 clause (2) |
| DEC-156 | Amended in place — notes now record which clauses DEC-158/DEC-159/REQ-139 supersede |
| REQ-133 | Amended — consolidation now depends on DEC-158; must not land before the popup rehost |
| REQ-134 | Amended — root cause confirmed, submit dead-end added, siblings verified correct; second round fixed the measurement to raw editable text and added REQ-091/REQ-011 dependencies |
| REQ-091 | **Amended in place** — the composed-length cap/counter criterion is replaced by raw editable text; composition itself unchanged |
| REQ-011 | Amended — Notes clarify that "up to 300 characters" means what the user types |
| REQ-125 | **Amended** — zone selected-card/add preview uses the approved large-image treatment, exact selected name in search, no duplicate title, keeps Search/Scan in one row at every width, and retains the first-viewport Add bound |
| REQ-128 | **Amended** — popup description, geometry criterion, dependencies, and Notes now follow DEC-158's portal-hosted bottom-sheet/side-panel geometry instead of stale "over the card" wording |
| REQ-129 | **Amended** — retitled from *Compact card images for first-viewport fit* to *Card image first-viewport fit ceiling*; behavioral criteria unchanged, reframed as the bound on DEC-160's growth |
| REQ-130 | Amended — zone tile keeps its fixed 160px width while its image grows inside it |
| REQ-135 | Amended — reframed from "wire outside-click" to affordance + reachable scrim |
| REQ-136 | Amended — in-flow rail footprint; document-scroll criterion reworded to match reality |
| REQ-137 | Amended — chrome and glyph size are the defect, not the shape |
| REQ-138 | Amended — 457px baseline; implemented through REQ-144's shared pattern |
| REQ-139 | Amended — control width at both bands, not stacking |
| REQ-141 | New — card image legibility floor (top priority); rewritten across quality-check rounds for all six surfaces and container-relative sizing |
| REQ-142 | New — shared theme-derived overlay close control |
| REQ-143 | New — overlay dismiss-behavior parity, one implementation |
| REQ-144 | New — grouped label/input row pattern (commander damage + Named counters) |
| REQ-145 | New — human-readable price freshness timestamp |
| DEC-151 | Amended in place — Notes and router row record that DEC-158 frees the popup geometry; the corner trigger, local-fields-only content rule, and compact-image intent are unchanged |
| DEC-142 | Amended in place — the counter-panel exclusion is retired (DEC-139 had already moved `CounterPanel` into the overlay family); dismiss-trigger set widened, never narrowed |
| DEC-120 / DEC-102 / DEC-149 | Retained unchanged |
| `screen-layout.md` | **Amended** — no new row, but seven existing rows are rewritten. First round: *Card detail popup (suite-wide)* for DEC-158's geometry, and *View Context* for REQ-135's `≤75dvh` cap. Second round: *Quick Question — pre-submit*, *In-Depth — Enrichment*, *In-Depth — Zone collection*, *Scan camera surface*, and *View Context* again, all for DEC-160's sizing intent and REQ-129's ceiling. Third round: *Card detail popup* gets the complete six-surface inventory and *In-Depth — Zone collection* gains the selected-card/add-preview treatment |

## Quality-check corrections

The first quality-check returned FAIL on four issues. All four are resolved; none changed
what the package builds.

| Issue | Resolution |
| --- | --- |
| `screen-layout.md`'s *Card detail popup* row still specified "compact popup over the card image" — the exact geometry DEC-158 abolishes, while this brief claimed the catalog was unchanged | Row rewritten for the overlay-family geometry; DEC-158 gained an Impact bullet pointing at it (DEC-149's catalog-update duty) |
| REQ-135's ≥25% scrim floor implied a View Context height cap the catalog did not state, so implementation would invent geometry | *View Context* row now records the `≤75dvh` cap; REQ-135 depends on REQ-126 and defers to the row |
| REQ-143 required `CounterPanel` outside-click while DEC-142's Notes listed exactly that as a non-goal — a REQ overriding an active decision | DEC-142 amended in place (its "non-overlay panel" premise was retired by DEC-139); router row updated; REQ-143's note repointed at the amendment |
| REQ-139 carried an unsatisfiable criterion: stack three fields that share one desktop row *and* not grow taller | Criterion replaced — phone band bounded against the 1165px baseline, desktop height increase explicitly accepted so an implementing agent does not read it as a regression |

Bookkeeping in the same round: DEC-151 now records being amended by DEC-158 (matching the
DEC-076 / DEC-078 precedent), and DEC-156's `amended by REQ-139` note was reworded — a
requirement clarifies a decision's description, it does not amend the decision.

## Second quality-check round

The second quality-check returned FAIL on three issues. Unlike the first round, **two of
these changed what the package builds**. Both product decisions were made by the product
owner on 2026-08-06.

| Issue | Resolution |
| --- | --- |
| REQ-134 contradicted REQ-091, which was active and unamended. REQ-091's acceptance criterion mandated exactly the composed-length counter that REQ-134 calls the bug, and REQ-134's own constraint ("agree on one measurement", "budget unchanged") was self-inconsistent — raw contradicted REQ-091, composed made criterion (b) unachievable | **Counter and cap measure raw editable text.** REQ-091 amended in place with a recorded note; REQ-134 gains REQ-091/REQ-011 dependencies and an explicit accepted-trade line; REQ-011 gains a clarifying note. The composed string may exceed 300 by the pill phrase — accepted against DEC-042's 1,000,000-char budget |
| REQ-141/REQ-133/DEC-158 named three consumers of `CardPresentation`; there are **five**. `ZoneCardPicker.tsx:253` (fixed `w-40` tiles in a horizontal scroller) and `ScanReviewBubble.tsx:49` were missed, and neither call site's `imageClassName` overrides the cap — `zone-card-tile-image` has no CSS rule at all. Raising a single pixel cap would break the strip; a size variant would split the shared component | **All five surfaces grow, via container-relative sizing (new DEC-160).** `max-h-32` is replaced by a rule that lets each image fill what its own container affords: ~300px on the three shell-column surfaces, ~144px inside the unchanged 160px zone tile, list-row width in scan review. One rule, no variant, no fork |
| `screen-layout.md`'s *Quick Question — pre-submit* and *In-Depth — Enrichment* rows still read "compact card image", contradicting REQ-141's floor — the same defect class the first round fixed on the *Card detail popup* row | Five rows updated: those two plus *View Context*, *In-Depth — Zone collection*, and *Scan camera surface*. Each records the sizing intent and names REQ-129 as the ceiling |

### Scope change this round

**Scan review is now in scope** for image sizing only (previously a non-goal). It is
affected solely because `ScanReviewBubble` consumes the shared `CardPresentation`. The
accepted trade: full-width images in a scrolling review list mean more scrolling to check a
multi-card scan. It degrades gracefully — the list already scrolls — and was accepted
rather than carved out, to keep one sizing rule in the shared component.

**This is the one thing to verify live before trusting the design.** If the enlarged review
bubble starves DEC-090's camera frame at 390×844, record a bounded cap on the *Scan camera
surface* catalog row. Do **not** resolve it by forking the component or adding a size prop.

### Why DEC-160 rather than a requirement amendment

DEC-151 clause (1) mandates "compact images" and REQ-129 was literally titled *Compact card
images for first-viewport fit*. A requirement cannot quietly overturn a confirmed decision,
so the mechanism change is recorded as DEC-160, and REQ-129 was retitled and reframed from a
smallness mandate into the **ceiling** that container-relative growth must respect — its two
behavioral criteria (add action `top` ≤ 844px, no page scroll) are unchanged and now do the
real constraining work.

## Third quality-check round

The third quality-check returned FAIL on one completeness issue: `ZoneCardPicker` renders
the shared card presentation twice — once as the selected-card/add preview and again in the
added-card strip — but the product truth counted only the strip. The selected-card/add
preview is a sixth user-visible card surface, so DEC-158, DEC-160, REQ-141, and the catalog
were incomplete.

The product owner reviewed three mobile mockups and approved **A — Legibility first** on
2026-08-06, then approved the focused revision in
`mockups/selected-card-add-preview-approved.png`:

- the selected card uses the large shell-column image treatment rather than the 160px strip
  tile treatment;
- the search field displays the selected card's exact canonical name while that preview is
  present;
- the duplicate standalone card-name row below the art is removed;
- the Add action sits directly below the image and must still satisfy REQ-125's `top ≤ 844px`
  mobile bound; and
- this is the sixth surface verified at both catalog viewport bands, not a component fork or
  a size-variant prop.

REQ-125 now owns this surface-specific composition. DEC-160/REQ-141 own its shared image
sizing; the *In-Depth — Zone collection* catalog row resolves the large selected preview
versus the fixed-width added-card strip without changing stack order or card-add behavior.

## Fourth quality-check round

The fourth quality-check returned FAIL on one authority mismatch: REQ-128 still required
the detail popup to open "over the card," while DEC-158 and the authoritative
*Card detail popup (suite-wide)* catalog row require a portal-hosted, content-sized bottom
sheet below `768px` and side panel at `768px`+. The product owner approved the correction
on 2026-08-06. REQ-128's description, geometry acceptance criterion, dependencies, and
Notes now explicitly follow DEC-158, and DEC-158's related-requirements list includes
REQ-128. No product behavior or package scope changed in this correction.

## Owner addition after the fourth quality-check

The product owner approved one additional Zone Collection density refinement on 2026-08-06:
the labeled Scan launcher moves beside the search field on phones, matching the existing
wider-viewport composition. The two controls stay on one non-wrapping row; Scan retains the
44px touch-target floor while search flexes into the remaining width. The reclaimed vertical
space may be spent on DEC-160's larger selected-card preview, but REQ-125/REQ-129's
first-viewport Add-action ceiling remains binding. This amends REQ-125 and the
*In-Depth — Zone collection* catalog row only; DEC-050's optional alternate-input behavior,
scanner internals, owner selection, card-add semantics, contracts, and flows are unchanged.

## Braindump → requirements

| braindump item | Lands on |
| --- | --- |
| Quick Question 1: card image too small | **REQ-141** (primary) + **DEC-160** (mechanism), REQ-133 |
| Quick Question 2: rework area beside image / Remove card | REQ-133 |
| Quick Question 3: text overlay too small, should be a popup | DEC-158 + REQ-133 — the popup exists but is bound to the image box |
| Quick Question 4: counter doesn't decrement / sticks at 35 | REQ-134 |
| Quick Question 5: click outside View Context to close | REQ-135 — already works; reframed as reachability/affordance |
| Quick Question 6: inelegant close button, should be themed X | REQ-142 / DEC-159 (all six overlays) |
| Quick Question 7: gap above "Quick question" | REQ-136 — cause is rail clearance, not stray spacing |
| In-depth 1: expand control should read as a triangle | REQ-137 — chrome + glyph size |
| In-depth 2: commander damage awkward "From" + box layout | REQ-138 via REQ-144 |
| In-depth 3: poison/energy/experience waste space | REQ-139 |
| *(sweep)* history drawer still a text `Close` | REQ-142 |
| *(sweep)* three outside-click implementations; `CounterPanel` has none | REQ-143 |
| *(sweep)* "Named counters" rows share the stranded pattern | REQ-144 |
| *(sweep)* raw ISO timestamp in Trade Balancer | REQ-145 |
| *(quality-check)* shared card presentation reaches six user-visible surfaces, not the initially counted three or later-counted five | DEC-160 + REQ-125 — zone selected-card/add preview, zone strip, and Scan review all receive explicit treatment |

## Sequencing constraint

DEC-158's popup rehost must land **before** REQ-133's consolidation. Moving card fields
into a popup that is still bound to a 92×128px box makes the reported problem worse rather
than better. REQ-142 (shared close control) should land with or before DEC-158, since the
rehosted popup consumes that control.

DEC-160's container-relative sizing should land **with or before** REQ-133, for the same
reason in the opposite direction: REQ-133 removes the sidebar to free width, and DEC-160 is
what spends it. Landing REQ-133 alone leaves a 92×128px image with empty space beside it —
visibly worse than today. DEC-160 landing first is safe on its own.

## Non-goals

- A new design system pass or pixel-perfect fidelity.
- Revisiting `responsive-containment-and-density` (ship-ready, separate scope).
- Re-deriving `sections/screen-layout.md` / DEC-149 / REQ-126's global model — targeted rows are amended when confirmed scope changes, but the catalog mechanism and shared language are not rewritten.
- Redesigning Life Tracker's `CounterPanel`/`CounterControl` stepper or its DEC-136/DEC-139
  seat-grid geometry. REQ-142 touches its close control only; REQ-143 adds outside-click only.
- Any change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, providers, or
  backend routes.
- An icon or theme system pass beyond close controls.
- Trade Balancer behavior beyond REQ-145's timestamp formatting.
- Scan behavior beyond the card **image sizing** that DEC-160 carries into `ScanReviewBubble`
  via the shared component and the approved Search/Scan launcher-row placement. Scanner
  internals, camera chrome, and capture flow are untouched.

## Implementation pointers (non-normative)

- `CardPresentation` has four direct component-level consumers but **six user-visible
  surfaces**. `CardSelectionPreview` reaches Quick Question pre-submit, its View Context
  sheet, and `ZoneCardPicker.tsx:224`'s selected-card/add preview; direct calls also live in
  `EnrichmentStep.tsx:175`, `ZoneCardPicker.tsx:253`'s added-card strip, and
  `ScanReviewBubble.tsx:49`. The `max-h-32` cap is at `CardPresentation.tsx:158`; call-site
  `imageClassName` values do not re-cap height. Fix the shared sizing rule once, shape its
  containers per the catalog, and do not fork the component or add a size prop.
- The zone selected-card/add preview additionally sets the search field to the selected
  card's exact canonical name while the preview is present and removes the standalone name
  below the art. The approved visual reference is
  `mockups/selected-card-add-preview-approved.png`; REQ-125 is normative.
- REQ-134's fix is a two-line-ish change in principle (`composedQuestion.length` →
  `question.length` at `QuickLookupApp.tsx:554`, and the same in `canSubmit` at `:234`), but it
  is a **product-truth reversal** — REQ-091 previously mandated the composed-length counter.
  The amended REQ-091 is the authority; do not "restore" the composed reading.
- REQ-134's root cause is confirmed, not suspected: `QuickLookupApp.tsx` displays
  `composedQuestion.length` while the textarea binds raw `question` and `maxLength` caps the
  raw value. `EnrichmentStep.tsx` and `FollowUpComposer.tsx` were checked and are correct.
- REQ-136 touches the portal shell, which `frontend-routing-and-code-splitting` also touches —
  check for conflicts before starting.
- REQ-143 is a behavior-preserving refactor over four files plus one addition; land it after
  REQ-142 so both shared overlay concerns settle together.
- Measure every layout change at 390×844 and 1440×900 per `screen-layout.md`'s viewport bands,
  and verify visually — most acceptance criteria here are visual judgments, not assertions a
  unit test can make alone.
- DEC-160 makes card sizing a **cross-destination** change: after implementing it, re-verify
  both In-Depth zone surfaces (selected-card Add action still in the first viewport; strip
  has no document horizontal scroll) and the Scan review bubble (camera frame not starved) —
  these can regress silently.
- Live verification captures from refinement are in `PRD/work/ui-review/.playwright-mcp/` for
  before/after comparison.

## Model recommendation

**Opus 5 for the package.** The binding constraint is not code difficulty — it is that most
acceptance criteria are visual ("does this read as a triangle", "is the card legible", "is the
gap gone"). Those require a model that can look at a screenshot and judge it while driving
Playwright across a multi-slice unattended run under `thejudge-implement-all`.

Optional split if cost matters: REQ-134 (counter) and REQ-139 (bounded selects) are
mechanically specified with exact expected values and Vitest coverage, no visual judgment —
those are safe for a Codex model. Keep DEC-158 (popup rehost), REQ-142/DEC-159 (close-control
convention), and REQ-136 (rail footprint) on Opus 5; each carries a cross-cutting design
decision that is expensive to unwind if called wrong.

Do not split more finely than that: REQ-133, REQ-141, REQ-142 and REQ-143 all touch the same
shared components, and splitting them across models invites the per-screen forking these
requirements explicitly prohibit.
