# Design brief — ui-look-translation

**What this is:** the plan for making every redesigned screen look exactly like
the approved direction-1 mockup. The first build (PR #239) got the behaviour
right; the app still does not look like the mockup.

**What you need to do:** Decide. Answer each block in `GATE-QUESTIONS.md` with
accept, edit or reject. There are fourteen: the ambient scene, the header, the
new "one visual system" rule, five look rules the mockup needs, and the seven
small questions the first run left open.

**What it changes:** how every redesigned screen looks. Behaviour changes only
where you accept a gate block.

## The player-facing outcome

Open any screen in the app next to the same screen in the mockup and you cannot
tell which is which, except where an accepted rule says the app must behave
differently.

What the player sees: a header that touches the top of the screen; a living
constellation scene behind translucent glass panels; the front card centred on
a glowing stage with its neighbours peeking; a two-row question box; and the
same treatment carried through In-depth details, the Trade Balancer, the card
scanner and the Life Tracker's Game Setup and Counters sheets. Nothing moves,
nothing is renamed, nothing works differently, except the points the owner
accepts at this gate.

The run's own final check is the owner opening the app and the mockup side by
side (build on 5273/3100, mockup on 5300) and saying yes per screen. The code PR
stays `IN PROGRESS` until then.

## Why the first pass fell short (settled facts)

These are the intake's observations from the owner's live comparison on
2026-10-02 and the first run's three reviews. The brief carries them as settled
and designs around them; it does not re-derive them.

1. **The background scene was ruled out before any code existed.** NFR-006 (the
   rule for lightweight, performant motion) says the colour's ambient scene is
   "CSS-animated layers with one density and one opacity number per scene". The
   mockup's scene is `ambience.js`, a hand-written 541-line canvas renderer (not
   a library) that already honours reduced motion. The builder honoured NFR-006,
   shipped a haze, and listed the canvas as a non-goal. The scene is most of the
   mockup's atmosphere, so its absence is most of the gap. Code agrees:
   `apps/frontend/src/components/AmbientScene.tsx` documents itself as "CSS
   transform/opacity animation only (NFR-006) — no canvas".
2. **Surfaces were rebuilt opaque.** The mockup's panels are glass over the
   scene; the app's are solid dark cards. Product truth asks for this today:
   REQ-207 says the scene "sits behind solid panels (the card stage, every
   In-depth plate) so the badge shows around them, never through them", and
   REQ-206, REQ-215 and two `screen-layout.md` rows say "solid panel".
3. **The header floats below the top edge.** `.page-shell`'s page padding wraps
   the header, leaving an empty band above it (the reviews measured about 48px
   at 1440×900 and about 20px at 390×844). The mockup's header sits at y=0. Code
   agrees: `apps/frontend/src/index.css` gives `.page-shell` both
   `padding-block` and `padding-inline`, and the header renders inside it.
4. **Composition was matched bullet by bullet, not as a whole.** The look pass
   worked from a list of differences; each bullet was closed and graded alone.
   The stage (front card centred, neighbours peeking, halo behind) and the
   composer (two rows: text on top; In-depth chip bottom-left, mic|send pill
   bottom-right) still do not match, because no bullet named the whole shape.
   Product truth also pins the old shape: REQ-206 says "the question box is one
   pill".
5. **Values were re-approximated instead of ported.** Slices cited mockup
   `file:line` values and re-typed them into the app's own token system. Every
   re-typing drifted a little, and the drift compounds. Code agrees:
   `apps/frontend/src/index.css` holds 106 hex colour literals, and
   `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx` still
   styles with fixed `zinc-` classes.

## Method — port the mockup, do not re-approximate it

This is the one design decision the intake makes for the run, because it is
what the first pass got wrong. It applies to every slice.

### Port the stylesheets as a layer

`tokens.css`, `shell.css`, `flow.css` and `ambience.css` come into the app as
the styling layer for the redesigned screens, with the same selectors and the
same values. The app's existing tokens map onto the mockup's, not the other way
round: REQ-200's named roles (page ground, colour wash, raised panel fill,
panel edge, focus ring, primary text, muted text, filled-accent text) resolve to
the ported variables instead of carrying values of their own. Where the app
needs a colour-profile variant the mockup lacks (the custom Colorless colour,
REQ-099), it is derived the way the mockup derives its six profiles
(`?profile=`), never by eye.

### Mirror the mockup's DOM order, per screen

Each React screen renders the same element order and class names its mockup
page uses, so the ported CSS applies unchanged. A screen is built by reading its
mockup page top to bottom, not by restyling the existing component tree. The
shared components from the first run (`PageShell`, `SheetShell`,
`ConfirmSheet`, `ComposerPill`, `CardStage`, `StationsRail`, `TradePile`, the
scanner chrome, the Life Tracker panels) are re-rendered in that order; their
props, state and tests for behaviour stay.

### Port `ambience.js` as one `AmbientScene`

One `AmbientScene` mounts the mockup's renderer on a fixed canvas behind the
page, driven by the active colour profile, and holds still (one painted frame)
under reduced motion. It replaces the internals of today's
`apps/frontend/src/components/AmbientScene.tsx` (which already has the page and
Menu-tray variants); there is no second scene component. This needs the NFR-006
gate block.

### Glass over the scene

Panels take the mockup's translucent surface values so the scene reads through
them. This needs the REQ-207 gate block (it replaces "solid panels").

### The requirement wins on behaviour; the mockup wins on look

Where the mockup and an accepted requirement disagree on behaviour, the
requirement wins. The intake names: REQ-206, REQ-210 and REQ-214 post-date the
mockup (the Draft starts at the first attached card; Mana spent on every zone;
scanned cards wait in a holding list until the scanner closes); REQ-018 keeps
every zone one tap away; REQ-142 keeps the palette-derived close colour; REQ-058
keeps each card's colour-identity ring. This brief adds the ones the code and
specs show will collide: the 44px touch floor (REQ-205), the opaque Menu tray
(REQ-122), the measured contrast floors (REQ-200), the untouched Life Tracker
table (REQ-202) and the mock-mode banner (REQ-123).

Where they disagree on look only, the mockup wins, full stop. If a look change
cannot be made without a behaviour change, it is a gate question for the owner,
never a builder's call: during build that means the slice parks the point for
the owner rather than choosing.

## One visual system, inherited everywhere (cross-cutting, REQ-216)

The owner set this rule on 2026-10-02 above every slice: there is one shared
visual system, and every screen, sheet, overlay and panel inherits it. Nothing
carries its own palette, its own profile, or its own flow of styles. The brief
writes it as a new requirement, REQ-216 (gate block in `GATE-QUESTIONS.md`),
and **every slice cites REQ-216**.

- **One token source.** The ported `tokens.css` is the only place a colour,
  surface, radius, shadow, glow, type size or spacing value is defined. The six
  colour profiles live there as one set of variables, switched in one place.
- **One layering, in order.** Tokens → shell (`shell.css`, `ambience.css`:
  header, Menu, Theme band, sheets, the ambient scene) → flow (`flow.css`:
  stage, composer, plates, pills). A screen may add a selector that uses those
  layers; it may not redefine what they set. If two screens need the same thing,
  it moves up a layer.
- **One sheet, one composer, one plate.** The shared components are the only
  way a screen gets a sheet, a composer or a panel. A variant extends the shared
  one with a modifier; it never forks a local copy.
- **Profile switching proves it.** Changing the Theme in the Menu recolours
  every screen, sheet and overlay at once.
- **Hard-coded values are defects.** A hex colour, an `rgb(…)`, a one-off
  shadow, a fixed Tailwind palette colour, or a local `--my-panel-bg` inside a
  component is a finding, not a style note — outside the named exemptions
  below.

Review grades REQ-216 with the same weight as the pixel comparison.

### Where the colours that live in code today go

Some colours sit in TypeScript today, not in a stylesheet. A grep on
2026-10-02 over `apps/frontend/src` (hex, `rgb(`/`hsl(` with literal numbers,
fixed Tailwind palette classes; tests excluded) found them in the files below.
Each gets one home. **Token layer** means the ported `tokens.css` plus
`apps/frontend/src/lib/theme/`, the code that switches the colour profile and
derives the custom Colorless colour (REQ-099) (A21). **Exempt** means the file
is on the audit's named allowlist (acceptance item 5) for the reason given.
Every exemption keeps today's behaviour; the owner may `edit` the list at the
REQ-216 gate block (A22).

| What the player sees | Where it lives today (under `apps/frontend/src/`) | Home | Why |
| --- | --- | --- | --- |
| The six Theme colours and their swatches | `lib/theme/palettes.ts` (swatch hexes, channel values), `lib/theme/applyPalette.ts` (sets the variables) | token layer | It is the profile switch, REQ-200's one token source today. Any value it holds that `tokens.css` also defines must equal it, checked by a test the frame slice adds. |
| The background scene | `components/AmbientScene.tsx` (CSS today; the canvas port carries colours per profile) | exempt | A canvas draws with colour strings, not stylesheet variables. Its colours are the mockup's `ambience.js` values, copied unchanged, keyed by profile so a Theme change still recolours the scene, and kept in this one file. |
| The trade pile's gold, bronze and gem artwork | `components/trade/TradePile.tsx` (`GOLD`, `GOLD_DARK`, `BRONZE`, `GEM`) | exempt | An illustration of fixed materials that looks the same in every Theme today, and keeps doing so. |
| The scanner's developer debug outline and read-region overlay | `components/ScanCardOutline.tsx` (the `debug` stroke only; the lock-on outline already reads `--accent-soft`), `components/ScanDebugOverlay.tsx` | exempt | Opt-in, developer-only diagnostics, fixed so they read against any profile; the code itself marks the debug outline "developer-only, not part of this look pass". |
| Each card's colour-identity ring | `lib/cardIdentityRing.ts` (five colour values, silver grey, and the `--card-identity-ring` property) | exempt | The ring comes from the card's own colours, never from the profile (REQ-058; REQ-200: "card-identity rings stay derived from card colours and independent of the profile"). |
| The Life Tracker table | `components/portal/life-tracker/PlayerLifeCard.tsx`, `PlayerLifeTrackerApp.tsx` (fixed `zinc-` classes) | exempt | Out of scope and pixel-unchanged (REQ-202). |
| In-depth details' enrichment heading | `components/EnrichmentStep.tsx` (inline `color: "#e2e8f0"`) | token layer | Plain primary text (REQ-200's primary-text role); the In-depth slice swaps it for the token. |
| The scanner's dimmed surround | `components/ScanCameraSurface.tsx` (the viewfinder's `rgba(15,23,42,0.35)` shadow) | token layer | Scanner chrome; the scanner slice moves it. |
| Everything else: fixed `zinc-`/`slate-` classes and one-off `shadow-[…]` values across the redesigned components, and `index.css`'s 106 hex literals | many files | token layer or the ported stylesheets | Ordinary redesigned chrome; each screen's slice moves its own values as it rebuilds that screen. |

## Screens, and how each is ported

One slice per mockup page, in this order, after the frame slice. Every screen
uses the token and shell layers; the "Flow layer" column says whether it also
uses `flow.css`. Mockup pages live under `docs/design/ui-reimagining/direction-1/`.

| Screen | Mockup page (visual source) | States to pair | Flow layer | Rebuilt in mockup DOM order | Behaviour rules that win | Gate blocks (REQ-216 binds every row except the Life Tracker table) |
| --- | --- | --- | --- | --- | --- | --- |
| Frame: header, ambient scene, Menu tray, Theme band, shared sheets (card detail, Send feedback, Question History) | `shared-chrome-menu.html` | at rest; Menu open; Send feedback; Question History with rows; card detail | yes (plates, pills inside sheets) | `PageShell` + `StagedStepHeader` (header outside page padding), `FeaturePortalMenu`, `ThemeSection`, `AmbientScene` (canvas port), `SheetShell`, `ConfirmSheet`, `ConversationHistoryDrawer`, the Send feedback and card-detail sheets | REQ-122 opaque tray; REQ-123 mock banner; REQ-205 44px floor; REQ-213 history list; REQ-142 close colour | NFR-006, REQ-207, REQ-216 |
| Ask a Question | `quick-question.html` | default with cards; Add-card search open; answered with follow-up | yes (stage, composer, pills) | `QuickLookupApp`, `CardStage`, `ComposerPill`, `ConversationThread`, the General rules topics plate if kept | REQ-206 (no duplicate neighbour at two cards, the carry, the Draft); REQ-167 cap of 10; REQ-011/REQ-134 300-character ring; REQ-212 dictation | FLOW-011, REQ-079, REQ-206, REQ-167, REQ-070, REQ-124 |
| In-depth details | `in-depth-question.html` | Game; Zones; Cards (6 cards, 3 zones); Placing (carried cards); Context (with a target); Review (filter pills); Ruling | yes (plates, shelf, pills) | `MtgAssistantApp`, `StationsRail`, `ZoneCollectionStep`, `ZoneCardPicker`, `ZoneCardMenu`, `ZoneConfirmStep`, `EnrichmentStep`, the chat | REQ-018 every zone one tap away; REQ-209 stations and guardrails; REQ-210 Mana spent on every zone; REQ-211 Copies; REQ-058 identity ring on every enrichment row | REQ-070, REQ-209, REQ-124 |
| Trade Balancer | `trade-balancer.html` | default trade both sides; printing picker | yes (plates, pills) | `TradeBalancer`, `TradeSide`, `TradeEntryRow`, `TradePile`, `PrintingPicker` | REQ-064/REQ-065 totals and pricing unchanged; REQ-215 tiers and verdict bands | REQ-215, REQ-207 (glass panel) |
| Card scanner | `card-scan.html` | locking on; camera unavailable (mockup reference only) | no | `ScanCameraSurface` chrome, `ScanReviewBubble`, `ScanDebugOverlay` | REQ-214 holding list and close-commit; detection, lock, ding and tuned cause-hints unchanged (DEC-052 family) | REQ-214 |
| Life Tracker menus | `life-tracker-menus.html` | Game setup; Reset confirm; Counters; Counters tab; table re-check | yes (plates, pills) | `GameSetupPanel`, `CounterPanel`, `ConfirmSheet` | REQ-202 every control, option, default and range unchanged; `lib/lifeTracker/` untouched | REQ-202, REQ-082 |
| Life Tracker table | none — out of scope | before/after pair at both widths | — | nothing | REQ-202: the table is pixel-unchanged | — |

## Slice planning note

The first slice is the frame. It ports the stylesheet layer (`tokens.css` →
`shell.css` → `flow.css` / `ambience.css`) and the ambient scene, puts the
header at the top edge, and switches surfaces to glass, **before any screen is
touched**. It also creates the pixel-comparison script every later slice runs
(acceptance item 2). Every later slice then only re-orders its screen's DOM onto layers
that already exist.

After the frame, one slice per screen in the table's order. Each slice names
its mockup page as its visual source and carries the acceptance criteria below.
Map-out owns the GAMEPLAN, the slice letters and the exact file paths.

## Acceptance every slice carries

The intake lists these; map-out copies them into every slice doc, beside the
slice's own criteria.

1. **Side-by-side pairs.** Every state in the screens table, build next to
   mockup, same colour profile and state, at 390×844 and 1440×900, saved under
   `docs/design/ui-reimagining/build-screenshots/translation/<screen>/`.
2. **A pixel comparison per pair, not a reading.** A script diffs the build
   capture against the mockup capture inside the content box and reports the
   differing fraction. The slice sets its own threshold in its doc, below 5%,
   and records the number. Card art and live data regions may be masked, and
   every mask is named.
   - **Owner and path.** The frame slice creates
     `scripts/compare-screenshot-pair.mjs` and its test
     `scripts/compare-screenshot-pair.test.mjs`, which `npm run test:scripts`
     already runs (`scripts/*.test.mjs`). It reads PNGs with `pngjs`, already a
     root devDependency, so nothing new is installed (A24).
   - **Usage.** `node scripts/compare-screenshot-pair.mjs --build <build.png>
     --mockup <mockup.png> [--mask <mask.json>] [--tolerance <0-255>]`. The two
     PNGs must be the same pixel size; if not, it exits non-zero and prints
     both sizes. `--tolerance` is the per-channel difference a pixel may have
     and still count as matching; it defaults to `0`, and a slice that uses
     another value records it beside its threshold.
   - **Output.** One JSON line on stdout: `{"build", "mockup", "mask"
     (path or null), "tolerance", "comparedPixels", "maskedPixels",
     "differingPixels", "differingFraction"}`. `differingFraction` is
     `differingPixels / comparedPixels`, counting only pixels inside the
     content box and outside every mask region.
   - **Files beside each pair**, in
     `docs/design/ui-reimagining/build-screenshots/translation/<screen>/`,
     named the way the first run named its pairs (`life-tracker-after-390x844.png`):
     `<state>-build-<viewport>.png`, `<state>-mockup-<viewport>.png` and, when
     the pair needs one, `<state>-mask-<viewport>.json`, where `<viewport>` is
     `390x844` or `1440x900`.
   - **Mask format.** JSON: `{"contentBox": {"x", "y", "width", "height"},
     "regions": [{"name", "reason", "x", "y", "width", "height"}]}`.
     Coordinates are the capture's own pixels; regions are rectangles;
     `contentBox` is optional (the whole capture when absent); every region
     carries a name and a reason (for example card art, live data, A4's opaque
     tray, A5's touch floor, A8's banner, A17's topics plate).
   - **Where the number goes.** Each slice adds one row per pair to
     `translation/<screen>/DIFF-RESULTS.md` (pair, mask file or none,
     tolerance, differing fraction, the slice's threshold) and cites that file
     in its slice doc. It sits beside the pairs, outside `PRD/work/`, so the
     package's close does not delete it.

   The 5% ceiling is the
   intake's figure and has not been measured; this brief sets no other number.
   Each slice measures its own pairs first and sets its threshold from that
   evidence; a pair that cannot get under the ceiling for a reason the slice
   cannot fix goes to review with the reason, not to a quietly raised ceiling.
3. **Tests green:** `npm run quality:check`,
   `npm --workspace apps/frontend run test`,
   `npm --workspace apps/backend run test`.
4. **Review compares the pairs and the numbers,** sends back any screen over its
   threshold, and treats "matched the bullets" as no defence. The build node's
   hook evidence log earns nothing (known gap), so review is the real integrity
   gate.
5. **Shared-system audit, two checks (REQ-216).** (a) A search for
   hard-coded style values, run two ways, each recorded with its command and a
   count that must be zero: **(a1)** the whole of every TS/TSX file of the
   components the slice rebuilds (its row in the screens table; map-out lists
   the files), and **(a2)** every line the slice adds anywhere under
   `apps/frontend/src`, which covers `index.css` and any file it edits without
   rebuilding (A23). Both skip the token layer, the ported stylesheets, tests,
   and the exempt files in "Where the colours that live in code today go". The
   patterns: a hex colour; `rgb(`/`rgba(`/`hsl(`/`hsla(` with a literal number
   (`rgb(var(--accent))` reads a token and is not a hit); a fixed Tailwind
   palette class (`zinc-`, `slate-` and the rest of Tailwind's default palette
   names; REQ-200 already bars zinc/slate); a one-off shadow (`shadow-[…]`, or
   `box-shadow:` with literal lengths); and a custom property declared or set
   outside the token layer (`--name:`, `setProperty(`). The command, verbatim,
   with `BASE` the commit the slice started from and `FILES` its rebuilt
   components' paths:

   ```sh
   PAT='#[0-9a-fA-F]{3,8}\b|rgba?\( *[0-9.]|hsla?\( *[0-9.]|\b(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b|shadow-\[|box-shadow: *-?[0-9]|--[a-zA-Z][a-zA-Z0-9-]*"? *:|setProperty\('
   SKIP='\.test\.tsx?$|/(tokens|shell|flow|ambience)\.css$|^apps/frontend/src/lib/theme/|^apps/frontend/src/components/AmbientScene\.tsx$|^apps/frontend/src/components/trade/TradePile\.tsx$|^apps/frontend/src/components/(ScanCardOutline|ScanDebugOverlay)\.tsx$|^apps/frontend/src/lib/cardIdentityRing\.ts$|^apps/frontend/src/components/portal/life-tracker/(PlayerLifeCard|PlayerLifeTrackerApp)\.tsx$'
   # (a1) rebuilt components, whole file
   printf '%s\n' $FILES | grep -vE "$SKIP" | while read -r f; do cat "$f"; done | grep -cE "$PAT"
   # (a2) every added line under apps/frontend/src
   git diff -U0 "$BASE"..HEAD -- apps/frontend/src \
     | SKIP="$SKIP" awk '/^\+\+\+ /{f=substr($0,7); keep=(f !~ ENVIRON["SKIP"]); next} keep && /^\+/' \
     | grep -cE "$PAT"
   ```

   (b) A profile-switch
   pair: the slice's main state in two different Theme colours at 390×844,
   saved beside the other pairs, showing every element recoloured and none left
   behind. Review treats a hit in (a) or a left-behind element in (b) as
   Important.

Every slice that touches shared chrome, the token set or the shared stylesheet
also attaches the Life Tracker before/after pair (REQ-202). That pair is
reviewed by the owner; a diff number may be recorded for it, but under REQ-202
no pixel count blocks a slice on its own.

## Proposed product-truth changes

All of these are proposals in `GATE-QUESTIONS.md`, one block per stable id.
Nothing is written to `PRD/sections/` until `build` applies the accepted ones.

| ID | New or amended | What it decides |
| --- | --- | --- |
| NFR-006 | amended | The ambient scene may be the one hand-written canvas renderer ported from the mockup (still frame under reduced motion, no library). Fallback on reject: a static SVG constellation with the mockup's haze. |
| REQ-207 | amended | The header sits at the top edge so page padding never wraps it; panels are glass over the scene instead of solid. |
| REQ-216 | new | One visual system, inherited by every screen (the cross-cutting rule above). |
| FLOW-011 | amended | Ask a Question's question box is the mockup's two-row composer, not one pill. |
| REQ-124 | amended | A redesigned screen's column takes its mockup page's width inside the 48rem shell cap. |
| REQ-079 | amended | Keep the "General rules topics" panel on Ask a Question, directly under the composer (the brief's proposal; retire is the alternative). |
| REQ-070 | amended | Helper text on the redesigned screens follows the mockup's wording and placement (the rule the intake calls DEC-092). |
| REQ-206 | amended | Owner question 1: position dots replace the `n / 10` count pill. |
| REQ-167 | amended | Owner question 2: Ask a Question's card search opens before three characters. |
| REQ-209 | amended | Owner question 3: the ruling's ✎ Edit chip renders and returns to the review. |
| REQ-215 | amended | Owner question 4: adding the same printing twice merges into one row with a quantity. |
| REQ-214 | amended | Owner question 5: the scanner gets the mockup's hint line (also the scanner's Chrome row in `screen-layout.md`). |
| REQ-202 | amended | Owner question 6: Game Setup gets an "Edit names ▾" collapse and a "Done ›" foot bar. |
| REQ-082 | amended | Owner question 7: the Counters sheet becomes content-sized like every other sheet. |

The intake's recommendation is accept for NFR-006 and REQ-207, "allow the
mockup's wording" for REQ-070, "owner's call" for REQ-079, and "match the
mockup unless the owner says otherwise" for the seven owner questions. The
blocks carry these labelled as the intake's.

**Where the intake's "DEC-092" rule lives.** The decision log is retired;
DEC-092 is an index row in `PRD/sections/decisions.md`. The byte-for-byte
helper-text rule it named now lives in REQ-070's acceptance criteria ("no other
on-screen guidance/helper text is changed … byte-for-byte unchanged" and "no
net-new guidance text is introduced anywhere"), restated in REQ-100, REQ-073 and
`sections/in-depth/README.md`. The REQ-070 block amends all of them.

## Constraints

- **Base:** this package's branch is cut from
  `origin/thejudge-auto/ui-reimagining-build-work` (PR #239's branch), by the
  owner's decision; the docs PR targets that branch and the build stacks on PR
  #239's code and applied truth. This supersedes the intake's "Base:
  `origin/main` after PR #239 merges".
- The 57 ids PR #239 applied stand; this run amends only what the gate blocks
  name. Direction 1 is the design; no new rounds or alternatives. Dictation
  (REQ-212) and Copies (REQ-211) stay as built.
- Playwright MCP resolves relative screenshot paths against the launch checkout:
  always pass absolute paths.
- Never stash in a run.
- Ports 5273, 3100 and 5300 are the owner's. A run never starts, stops or reuses
  them; it serves its own build and its own copy of the mockup folder on other
  ports.
- Mock mode: `VITE_ASK_AI_PROVIDER=mock PORT=<port> FRONTEND_PORT=<port> node scripts/dev.mjs`.
- The build node's cap is 4000 calls; the practical bound is the builder's own
  context, so the driver re-dispatches from the next slice when a builder stops
  clean.
- Presentation only, except where an accepted gate block says otherwise: no
  change to `AskAiRequest`, Zod schemas, prompts, backend routes, card metadata,
  scan matching, or the data pipeline.

## Non-goals

- No new design direction and no alternative mockups.
- No behaviour change beyond the accepted gate blocks.
- The Life Tracker table: out of scope and pixel-unchanged (REQ-202).
- The scanner's detection, lock thresholds, stabilizer, ding and tuned
  cause-hints (DEC-052 family): unchanged.
- No animation library, theming framework or new dependency.
- No light theme (REQ-200 stays dark-only).

## Assumptions

Each was resolved with the preparation contract's ladder (1 PRD truth, 2 tested
behaviour, 3 local patterns, 4 smallest reversible scope, 5 preserve what the
player sees, 6 nothing new without scope).

| # | Assumption | Evidence | Rung |
| --- | --- | --- | --- |
| A1 | The base is PR #239's branch, not `origin/main` after merge. | Owner's decision in the dispatch; `README.md` `## Autonomous metadata` records `origin/thejudge-auto/ui-reimagining-build-work`. | owner |
| A2 | The intake's "DEC-092" rule lives in REQ-070, REQ-100, REQ-073 and `in-depth/README.md`; the amendment goes there, with no new DEC. | `decisions.md:133` lists DEC-092 as retired; grep recorded in the REQ-070 block. | 1 |
| A3 | The canvas port replaces the internals of the existing `AmbientScene` (page and tray variants); no second scene component. | `apps/frontend/src/components/AmbientScene.tsx` already has `variant: "page" \| "tray"`. | 3 |
| A4 | The Menu tray stays fully opaque. If the mockup draws it translucent, that region is a named mask with REQ-122 as the reason. | REQ-122's measured criterion (`functional-requirements.md:2983`: tray alpha `1`). | 1 |
| A5 | The 44px touch floor wins over any smaller mockup control; the painted control is 44px, and the difference is a named mask. Hit areas are not widened invisibly, because REQ-114 says suite chrome takes no taps outside what it paints. | REQ-205; REQ-114 (`functional-requirements.md:2799`). | 1 |
| A6 | The REQ-200 contrast floors hold over glass and the canvas scene; where a mockup glass value breaks a floor, the requirement wins and the slice raises it. | REQ-200 floors; REQ-207 "the REQ-200 contrast floors hold over the scene in all six profiles". | 1 |
| A7 | Pixel captures run with reduced motion emulated on both sides, so the scene is one still frame. If that frame is not the same from run to run, the frame slice records how it handles the scene region before any screen slice relies on it. | NFR-006 / REQ-207 reduced-motion still frame; the intake's per-pair diff needs a fixed frame. | 4 |
| A8 | Captures run in mock mode. If the mockup page draws no mock-mode banner, the banner strip is a named mask. | Intake's mock-mode command; REQ-123; `index.css` places the banner in flow under the header. | 4 |
| A9 | The Life Tracker table re-check pair may record a diff number for information only; the owner's review decides it. | REQ-202: "no automated diff threshold and no pixel count that blocks the slice on its own". | 1 |
| A10 | The hard-coded-value grep adds fixed Tailwind palette classes (`zinc-`, `slate-` and the like) to the intake's patterns. | REQ-200: "no in-scope component hard-codes a zinc/slate colour value"; `CounterPanel.tsx` uses `zinc-`. | 1 |
| A11 | The 5% ceiling is the intake's unmeasured figure. Each slice measures, then sets its own threshold below it; the brief sets none. | Intake acceptance 2; no measurement exists yet. | 4 |
| A12 | Each owner-question block takes "the mockup's state" from the first run's receipt wording; the mockup pages were not opened. | `PRD/instructions/receipts/ui-reimagining-build-2026-10-02.md` `## Owner questions`. | intake rule |
| A13 | Game Setup's "Edit names ▾" collapse starts closed, and "Done ›" only closes the sheet, because every Game Setup change already applies as it is made. | `GameSetupPanel.tsx` calls `onDisplayNameChange` on each keystroke; REQ-081 and FLOW-013 already describe an "Edit names disclosure". | 2 |
| A14 | Two trade rows merge only when card, printing and finish all match; the per-row quantity stepper already exists. | `TradeEntryRow.tsx` (−/qty/+); REQ-065 already allows "repeated adds and/or a per-entry quantity control". | 2 |
| A15 | The earlier search opening applies to Ask a Question's Add-card search only; every other card search keeps three characters. The exact threshold is read from the mockup's own search at build. | `lib/search.ts:109` and `useAutocompleteKeyboard.ts:4` hard-code 3 for every search; the receipt names only Ask a Question. | 4 |
| A16 | The ruling's ✎ Edit mirrors Ask a Question's ✎ Edit cards: back to the review with everything kept, the answered thread leaves the page already saved to Question History, the next send starts a new conversation. | REQ-206's Edit cards; REQ-209 already says "✎ Edit returns to the review with everything kept (the conversation is saved to history first)". | 1 |
| A17 | The General rules topics panel is kept, directly under the composer, as one collapsed plate; in Ask a Question pairs it is a named mask, since the mockup has no such panel. | Ladder rung 5 (preserve what the player has); REQ-079 already places it "below the Question field". | 5 |
| A18 | REQ-124's column change uses only the one measured mockup width the receipt gives (In-depth details, 36rem / 576px at 1440×900); each other screen's slice measures its own. | Receipt, review 1 Minor notes. | 4 |
| A19 | Ported stylesheets are loaded so Tailwind's base layer cannot override them; the exact folder and import order are map-out's call. | `apps/frontend/src/index.css` begins with `@tailwind base`. | 3 |
| A20 | The answered Ask a Question composer and In-depth details' follow-up composer follow their own mockup states; this proposal only changes the pre-submit composer's written shape. | FLOW-011 / REQ-206 describe the pre-submit box; `screen-layout.md:152` describes the answered composer separately. | 4 |
| A21 | The token layer is the ported `tokens.css` plus `apps/frontend/src/lib/theme/` (the profile switch and the REQ-099 custom-Colorless derivation); any value in `lib/theme/` that `tokens.css` also defines must equal it, checked by a test. | `lib/theme/palettes.ts` holds the six profiles' swatches and channel values and `applyPalette.ts` sets `--accent` … `--focus-ring` today; REQ-200: "one authoritative frontend source for the token set"; REQ-099's derivation runs in code. | 3 |
| A22 | Five kinds of colour stay in code by name, as today: the background scene's canvas colours (`AmbientScene.tsx`), the trade pile artwork (`TradePile.tsx`), the scanner's debug outline and overlay (`ScanCardOutline.tsx` debug stroke, `ScanDebugOverlay.tsx`), the identity ring (`cardIdentityRing.ts`), and the Life Tracker table (`PlayerLifeCard.tsx`, `PlayerLifeTrackerApp.tsx`). Moving the scene's or the pile's colours into token variables is the alternative; the owner may `edit` the REQ-216 block to choose it. | Grep of 2026-10-02 (hit list in "Where the colours that live in code today go"); REQ-058 and REQ-200's identity-ring constraint; REQ-202; `ScanCardOutline.tsx` comment "developer-only, not part of this look pass". | 5 |
| A23 | The hard-coded-value audit runs two ways: whole file over the components a slice rebuilds, added lines only everywhere else. | `index.css` holds 106 hex literals spread across every screen's selectors (`.tb-`, `.lt-`, `.cs-` and others), and a Life Tracker menus slice may edit `PlayerLifeTrackerApp.tsx`; a whole-file grep of every touched file would charge the first slice that edits `index.css` with later screens' values. | 4 |
| A24 | The pixel-comparison script is a Node `.mjs` script on `pngjs`, not a `python3`/PIL script; the per-pixel tolerance defaults to `0`. | Root `package.json` devDependencies carry `pngjs` (used by `scripts/build-card-hashes.mjs` and `scripts/build-scan-vectors.mjs`); `scripts/` holds no Python file; `test:scripts` runs `scripts/*.test.mjs`. | 3, 6 |

## Risks for planning

- **Tailwind's base layer against ported CSS.** The mockup has no Tailwind; the
  frame slice must prove the ported selectors win (A19).
- **Mockup token names.** REQ-200 bans a token name that encodes a theme mode.
  If `tokens.css` uses such a name, mapping it is a gate point to raise, not a
  rename the builder chooses.
- **Canvas cost on phones.** NFR-006 still requires mobile-safe motion and no
  regression of NFR-001/NFR-002; the frame slice should show the scene does not
  slow the question loop.
- **Contrast over glass.** Glass lets bright scene points behind text; REQ-200's
  floors are measured against the wash, and must still hold (A6).
- **Scanner "locking on" state.** The first run's test browser had no camera and
  never reached the locking state; the scanner slice must plan how it captures
  that state.
- **Test anchors.** Many frontend tests use the "Add cards to zones" heading as
  an anchor (`appTestHelpers.tsx:403` and five test files). If the REQ-070 block
  is accepted and the heading goes, those anchors move.
- **Search cost.** Opening Ask a Question's search before three characters runs
  the local search on very short queries; the slice should check it stays fast.
- **Review follow-ups carried from the first run** (receipt `## Review
  follow-ups`): Send feedback is about 667px tall against the mockup's about
  465px; the In-depth Cards row reads "＋ Add card" where the mockup and the
  requirement say "＋ Add to Stack"; Placing's zone buttons are small pills, not
  the mockup's 48px tiles; Trade Balancer's pile artwork and the printing
  picker's missing mana cost; a faint accent ring round the Cards shelf. Each
  is a look difference the matching slice closes.

## Evidence and citations

Recorded as citations only; not opened by refinement.

- The look: `docs/design/ui-reimagining/direction-1/` — `shared-chrome-menu.html`,
  `quick-question.html`, `in-depth-question.html`, `trade-balancer.html`,
  `card-scan.html`, `life-tracker-menus.html`, `tokens.css`, `shell.css`,
  `flow.css`, `flow.js`, `ambience.css`, `ambience.js`, `motifs.js`, `motifs/`.
- The first run's 232 capture pairs: `docs/design/ui-reimagining/build-screenshots/`.
- The first run's gap list and reviews, in branch history on
  `thejudge-auto/ui-reimagining-build-work`: `LOOK-GAPS.md` at `aab421e`,
  `REVIEW-1.md` at `77acb4a`, `REVIEW-2.md` at `7d15458`, `REVIEW-3.md` at
  `129808c`.
- The owner's live comparison captures (2026-10-02): `.playwright-mcp/compare-*.png`
  in the launch checkout.
- PR #239 on GitHub.

Read as input: the request at `intake/GRAPH-BRIEF-2-look-translation.md`;
`PRD/sections/`; `apps/frontend/src/`.

## Prior runs

- `PRD/instructions/receipts/ui-reimagining-build-2026-10-02.md` — the first
  build (PR #239). Its `## Owner questions` feed seven gate blocks; its review
  follow-ups feed the risks above.
- `PRD/instructions/receipts/ui-reimagining-2026-09-24.md` — the direction-1
  design run. Listed, not read.
- The other seven `## Prior run` lines in `IDEA.md` are weak keyword matches,
  offered as input, not scope.
