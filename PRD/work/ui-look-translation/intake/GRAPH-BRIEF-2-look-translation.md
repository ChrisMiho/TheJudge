# Graph-run brief 2 — translate direction 1 into the app, faithfully

Self-contained intake for `graph-kickoff`. The first build
(`ui-reimagining-build`, PR #239) put every direction-1 piece in place and the
behaviour is right, but the app still does not look like the mockup. The owner
compared them live on 2026-10-02 and said so. This run exists to close that
gap, and nothing else.

The test for done is simple enough to say out loud: **open any screen in the
app next to the same screen in the mockup and you cannot tell which is which,
except where an accepted rule says the app must behave differently.**

Two sources of truth travel together, same as the first brief:

- **The look** is the static mockup at `docs/design/ui-reimagining/direction-1/`:
  `shared-chrome-menu.html`, `quick-question.html`, `in-depth-question.html`,
  `trade-balancer.html`, `card-scan.html`, `life-tracker-menus.html`, with
  `tokens.css`, `shell.css`, `flow.css`/`flow.js`, `ambience.css`/`ambience.js`,
  `motifs.js`, `motifs/`. Serve the folder (`python3 -m http.server 5300`) and
  add `?profile=<colour>` to preview any colour. The mockup is the source of
  truth for *everything the player sees*: layout, spacing, type, colour,
  surfaces, glow, the background scene, motion.
- **The behaviour** is `PRD/sections/` as it stands after PR #239 merges. It
  is already applied; this run changes behaviour only where a gate question
  below says so.

## What the player gets

Every screen they already use, looking exactly like the approved design: a
header that touches the top of the screen, a living constellation scene behind
translucent glass panels, the front card centred on a glowing stage, a two-row
composer, and the same treatment carried through In-depth details, the Trade
Balancer, the scanner and the Life Tracker menus. Nothing moves, nothing is
renamed, nothing works differently, except the handful of points the owner
decides at the gate.

## Why the first pass fell short (settled — do not re-derive)

These are observed facts from the 2026-10-02 comparison and the three
reviews, not opinions. Refinement reads them and designs around them.

1. **The background scene was ruled out before any code existed.** NFR-006
   says the colour's ambient scene is "CSS-animated layers with one density
   and one opacity number per scene". The mockup's scene is `ambience.js`, a
   hand-written 541-line canvas renderer (not a library) that already honours
   `prefers-reduced-motion`. The builder honoured NFR-006, shipped a haze, and
   carried the canvas as a non-goal. The scene is most of the mockup's
   atmosphere, so its absence is most of the gap.
2. **Surfaces were rebuilt opaque.** The mockup's panels are glass over the
   scene; the app's panels are solid dark cards. With no scene behind them the
   difference was invisible in the gap list.
3. **The header floats below the top edge.** `.page-shell`'s page padding wraps
   the header, leaving an empty band above it (about 48px at 1440×900, about
   20px at 390×844). The mockup's header sits at y=0. Two reviews marked this
   Minor as pre-existing.
4. **Composition was matched bullet by bullet, not as a whole.** The look pass
   worked from `LOOK-GAPS.md`, a list of differences; the builder closed each
   bullet and the reviewers graded each bullet. The stage (front card centred,
   neighbours peeking both sides, halo behind it) and the composer (two rows:
   text on top; In-depth chip bottom-left, mic|send pill bottom-right) still
   do not match because no bullet named the whole shape.
5. **Values were re-approximated instead of ported.** Slices cited mockup
   `file:line` values and re-typed them into the app's own token system. Every
   re-typing drifted a little; the drift compounds.

## Method — port the mockup, do not re-approximate it

This is the one design decision this brief makes for refinement, because it
is what the first pass got wrong:

- **Port the stylesheets as a layer.** `tokens.css`, `shell.css`, `flow.css`
  and `ambience.css` come into the app as the styling layer for the redesigned
  screens, with the same selectors and the same values. The app's existing
  tokens map onto the mockup's, not the other way round. Where the app needs
  a colour-profile variant the mockup lacks, derive it the way the mockup
  derives its six profiles (`?profile=`), never by eye.
- **Mirror the mockup's DOM order per screen.** Each React screen renders the
  same element order and class names the mockup page uses, so the ported CSS
  applies unchanged. A screen is built by reading its mockup page top to
  bottom, not by restyling the existing component tree.
- **Port `ambience.js` as a component.** One `AmbientScene` that mounts the
  mockup's renderer on a fixed canvas behind the page, driven by the active
  colour profile, held still (one painted frame) under reduced motion. This
  requires the NFR-006 gate question below.
- **Glass over the scene.** Panels take the mockup's translucent surface
  values so the scene reads through them.
- **Behaviour stays as the accepted rules say.** Where the mockup and an
  accepted requirement disagree on *behaviour*, the requirement wins, exactly
  as before (REQ-206, REQ-210, REQ-214 post-date the mockup; REQ-018 keeps
  every zone one tap away; REQ-142 keeps the palette-derived close colour;
  REQ-058 keeps the card-identity ring on every enrichment row). Where they
  disagree on *look only*, the mockup wins, full stop. If a look change
  cannot be made without a behaviour change, it is a gate question, never a
  builder's call.

## One visual system, inherited everywhere (owner's rule, 2026-10-02)

Most of this run is visual work, so the owner set one rule above every slice:
**there is one shared visual system, and every screen, sheet, overlay and
panel inherits it. Nothing carries its own palette, its own profile, or its
own flow of styles.**

What that means in practice:

- **One token source.** The mockup's `tokens.css` is ported once and is the
  only place a colour, surface, radius, shadow, glow, type size or spacing
  value is defined. The six colour profiles (`?profile=`) live there as one
  set of variables, switched in one place. No component, sheet or page
  declares a colour or a surface of its own; it reads the shared variable.
- **One layering, in order.** Tokens → shell (`shell.css`: header, Menu,
  Theme band, sheets, the ambient scene) → flow (`flow.css`: stage, composer,
  plates, pills). A screen may add a selector that *uses* those layers; it
  may not redefine what they set. If two screens need the same thing, it
  moves up a layer rather than being written twice.
- **One sheet, one composer, one plate.** The shared components from the
  first run (`SheetShell`, `ConfirmSheet`, `ComposerPill`, `CardStage`, the
  plate and foot bar) are the only way a screen gets a sheet, a composer or
  a panel. A screen that needs a variant extends the shared one with a
  modifier; it never forks a local copy.
- **Profile switching proves it.** Changing the Theme in the Menu must
  recolour every screen, sheet and overlay at once, with no screen left on
  the old colour and no element on a hard-coded one.
- **Hard-coded values are defects.** A hex colour, an `rgb(...)`, a one-off
  shadow or a local `--my-panel-bg` inside a component is a finding, not a
  style note, because it is exactly how the first pass drifted.

Refinement writes this as a cross-cutting requirement that every slice
cites; map-out gives it the two acceptance criteria below in every slice;
review grades it with the same weight as the pixel diff.

## Screens and states in scope

One slice per mockup page, in this order, each with the states the first
pass captured (the pairs under `docs/design/ui-reimagining/build-screenshots/`
name them):

| Screen | Mockup page | States |
| --- | --- | --- |
| Frame: header, ambient scene, Menu tray, Theme band, shared sheets (card detail, Send feedback, Question History) | `shared-chrome-menu.html` | at rest; Menu open; Send feedback; Question History with rows; card detail |
| Ask a Question | `quick-question.html` | default with cards; Add-card search open; answered with follow-up |
| In-depth details | `in-depth-question.html` | Game; Zones; Cards (6 cards, 3 zones); Placing (carried cards); Context (with a target); Review (filter pills); Ruling |
| Trade Balancer | `trade-balancer.html` | default trade both sides; printing picker |
| Card scanner | `card-scan.html` | locking on; camera unavailable (mockup reference only) |
| Life Tracker menus | `life-tracker-menus.html` | Game setup; Reset confirm; Counters; Counters tab; table re-check (must be unchanged, REQ-202) |

The Life Tracker **table** is out of scope and must be pixel-unchanged
(REQ-202 before/after pair at both widths, as every slice before).

## Product truth to gate (refinement writes these as gate blocks)

The run must raise these as accept / edit / reject questions; it must not
decide them.

1. **NFR-006 — the ambient scene.** Amend the line "the colour's ambient scene
   (REQ-207) is CSS-animated layers with one density and one opacity number
   per scene" to allow the one hand-written canvas renderer ported from the
   mockup, reduced-motion-aware (still frame), no animation library.
   Recommendation: accept. Rejecting means a static SVG constellation with the
   mockup's haze instead — name that as the fallback in the block.
2. **REQ-207 — the header sits at the top edge.** State it explicitly so the
   page padding can never wrap the header again. Recommendation: accept.
3. **A6 — "General rules topics".** The first gate kept this panel on Ask a
   Question; the mockup has no such panel. Keep it (and say where it goes in
   the mockup's layout) or retire it. Recommendation: owner's call; the brief
   does not know why it was kept.
4. **DEC-092 — helper text byte-for-byte.** This rule kept the "Add cards to
   zones" heading and lede, and the "Stack order is bottom to top…" line, on
   the In-depth Cards step where the mockup has neither. Keep the rule as is,
   or allow the mockup's wording and placement on the redesigned screens.
   Recommendation: allow the mockup's wording for the redesigned screens.
5. **The seven open owner questions from the first run's receipt**
   (`PRD/instructions/receipts/ui-reimagining-build-2026-10-02.md`,
   `## Owner questions`), each as its own block with the first run's "today"
   state and the mockup's state spelled out: the stage count pill vs position
   dots (REQ-167); the 3-character search minimum (REQ-167); the Ruling "Edit"
   chip (REQ-209); duplicate printings merged with a quantity or as separate
   rows (REQ-215); a scanner hint line (REQ-214); Game Setup's "Edit names"
   collapse and "Done" foot bar; the Counters sheet's full-height carve-out
   (DEC-139, `screen-layout.md` "Shared sheet" row, REQ-143 Notes).
   Recommendation per block: match the mockup unless the owner says otherwise.

## Decisions already made — do not re-litigate

- Direction 1 is the design. No new rounds, no alternative directions.
- The 57 ids applied by PR #239 stand; this run amends only what the gate
  blocks above name.
- The three owner edits from the first gate stand: Mana spent on every zone
  (REQ-210); the Draft starts at the first attached card and carried cards
  survive a reload (REQ-206); scanned cards wait in a holding list until the
  scanner closes (REQ-214).
- The requirement wins on behaviour; the mockup wins on look.
- Dictation (REQ-212) and Copies (REQ-211) stay as built.

## Acceptance — what "done" means for a slice

Every slice carries the same four criteria, in addition to its own:

1. **Side-by-side pairs** for every state in the table above, build next to
   mockup, same colour profile and state, at 390×844 and 1440×900, saved
   under `docs/design/ui-reimagining/build-screenshots/translation/<screen>/`.
2. **A pixel comparison per pair**, not a reading: a script (PIL is available
   to `python3`) that diffs the build capture against the mockup capture
   inside the content box and reports the differing fraction. The slice sets
   its own threshold in the doc, below 5%, and records the number. Card art
   and live data regions may be masked, and the mask must be named.
3. **Tests green**: `npm run quality:check`, `npm --workspace apps/frontend run test`,
   `npm --workspace apps/backend run test`.
4. **Review compares the pairs and the diff numbers**, sends back any screen
   over its threshold, and treats "matched the bullets" as no defence.
5. **Shared-system audit, two checks.** (a) A grep over the slice's touched
   files for hard-coded colours, shadows and local tokens (`#[0-9a-f]{3,8}`,
   `rgb(`, `hsl(`, a `--` variable declared outside the ported `tokens.css`)
   returns zero hits outside the token layer, and the slice records the
   command and its count. (b) A profile-switch pair: the slice's main state
   captured in two different Theme colours at 390×844, saved beside the other
   pairs, showing every element recoloured and none left behind.

Review treats a hit in 5(a) or an unrecoloured element in 5(b) as Important:
a screen that looks right in one profile but owns its own colours is not done.

The run's own final gate is the owner opening the app and the mockup side by
side (build on 5273/3100, mockup on 5300, as before) and saying yes per
screen. The PR stays `IN PROGRESS` until then.

## Constraints (do not rediscover)

- **Base:** `origin/main` **after PR #239 merges** — this run builds on the
  first run's components (`PageShell`, `SheetShell`, `ComposerPill`,
  `CardStage`, `StationsRail`, `TradePile`, the scanner chrome, the Life
  Tracker panels). Do not start it before that merge.
- Playwright MCP resolves relative screenshot paths against the launch
  checkout; always pass absolute paths. Never stash in a run.
- The owner watches on ports 5273/3100 (build) and 5300 (mockup); a run never
  starts, stops or reuses those ports.
- Mock mode needs `VITE_ASK_AI_PROVIDER=mock PORT=<port> FRONTEND_PORT=<port> node scripts/dev.mjs`.
- The hook's evidence log earns nothing for the build node (known gap); the
  review node is the real integrity gate, which is why acceptance 4 exists.
- The build node's cap is 4000 calls; the practical bound is the builder's own
  context, so the driver re-dispatches from the next slice when a builder
  stops clean.

## Evidence and reusable tooling

- The first run's receipt: `PRD/instructions/receipts/ui-reimagining-build-2026-10-02.md`
  (full ledger, the seven owner questions, every review's Minor notes).
- 232 capture pairs: `docs/design/ui-reimagining/build-screenshots/` (`a`–`q`
  per slice, `look-gaps/` for the 92 pre-pass pairs).
- The gap list and the three reviews are deleted with the first package but
  live in the work branch's history: `LOOK-GAPS.md` at commit `aab421e`,
  `REVIEW-1.md` at `77acb4a`, `REVIEW-2.md` at `7d15458`, `REVIEW-3.md` at
  `129808c` on `thejudge-auto/ui-reimagining-build-work`.
- The owner's live comparison captures from 2026-10-02 (Ask a Question, phone
  and desktop, green and blue): `.playwright-mcp/compare-*.png` in the launch
  checkout (ignored, disposable).

## What the graph run should produce

- A `DESIGN-BRIEF.md` whose method section is the "port, do not
  re-approximate" rule above, with the stylesheet-layer and DOM-order
  approach stated per screen, and the "one visual system, inherited
  everywhere" rule as a cross-cutting requirement every slice cites.
- `GATE-QUESTIONS.md` with one block per item under "Product truth to gate",
  each with the three plain-language lines, the complete diff, and the
  recommendation.
- A GAMEPLAN with one slice per screen in the table, each naming its mockup
  page as the visual source and carrying the four acceptance criteria above,
  plus a first slice that ports the stylesheet layer and the ambient scene
  (the frame) before any screen is touched.

## How to hand this off

Run `/graph-kickoff` with this file as the request, after PR #239 has merged:

```
/graph-kickoff docs/design/ui-reimagining/GRAPH-BRIEF-2-look-translation.md
```

Proposed slug: `ui-look-translation`. The run stops at quality-check PASS
with a docs-only PR; answer its gate blocks and merge, and `graph-implement`
builds it.
