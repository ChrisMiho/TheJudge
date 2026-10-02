# Gate questions — ui-look-translation

**What you need to do:** Decide. Fill each block's `- Verdict:` with `accept`,
`edit` or `reject`, and write a `- Reason:` for any `edit` or `reject`.

Fourteen blocks. The first seven set the look rules the run needs (the
background scene, the header and glass panels, the new "one visual system"
rule, the two-row question box, column width, the General rules topics panel,
and helper text). The last seven are the first run's open owner questions, one
block each.

**How to read a block.** Three plain lines first. Then the intake's
recommendation, where it gave one, labelled as the intake's. Then the
amendment set: the grep that found every place the rule is written, with what
happens to each hit. Then the complete proposed diff against this branch's
`PRD/sections/` (PR #239's applied truth). In a diff, `-` lines are removed and
`+` lines added; a block headed "clause" replaces only the quoted text inside a
long line or table row and leaves the rest of that line as it is. Nothing here
is written to `PRD/sections/` until `build` applies the accepted blocks, by
intent, together with the code.

A few long lines are touched by two blocks, each changing a different clause
(for example `screen-layout.md` line 142). Each block's verdict governs only its
own clause.

---

## NFR-006 — the background scene can be the mockup's own canvas drawing

**What this decides:** whether the moving colour scene behind every page may be
the mockup's own hand-written drawing code, instead of the CSS-only haze the app
shows today.

**In plain terms:** behind every screen the mockup plays a living scene in the
chosen colour — drifting haze, glowing dust, the colour's badge, and the
colour's element (Blue runes and constellations, Red embers, Green falling
leaves and so on). The mockup draws it with `ambience.js`, a 541-line drawing
script written by hand for this design, painted onto a canvas (a browser drawing
surface a script repaints frame by frame), with no animation library. The motion
rule NFR-006 (keep motion lightweight and CSS-based, bring in no animation
library, honour the device's reduced-motion setting) says today that the scene
must be "CSS-animated layers" — motion done only with stylesheet rules — so the
first build shipped a faint haze instead, and that missing scene is most of why
the app does not look like the mockup. This change lets that one scene, and only
it, be the ported canvas drawing: one `AmbientScene` component behind the page,
decorative only, still tunable by one density and one opacity number, and
painted as one still frame with no animation when the player's device asks for
reduced motion. Every other motion in the app stays CSS-only, and no animation
library comes in.

**What happens if you say no:** the scene stays CSS-only. The fallback the run
builds instead is a static SVG constellation (a fixed vector drawing) with the
mockup's haze over it — closer than today's haze, but not the living scene, so
the background will still differ from the mockup.

- Recommendation (the intake's): accept.

**Amendment set.** Grep, line level:

```
grep -rn "canvas\|script-driven\|CSS-based\|ambient scene\|CSS-animated\|one density\|opacity number\|timing system" PRD/sections | grep -v '^PRD/sections/decisions.md'
```

| Hit | Disposition |
| --- | --- |
| `non-functional-requirements.md:66` (NFR-006, CSS-based) | amend — names the scene as the one exception |
| `non-functional-requirements.md:71` (NFR-006, the scene) | amend |
| `functional-requirements.md:4979` (REQ-201, no new timing system) | amend |
| `functional-requirements.md:5263` (REQ-207 title) | keep — names the scene, not how it is drawn |
| `functional-requirements.md:5265` (REQ-207 description) | amend |
| `functional-requirements.md:5273` (REQ-207, scene content) | amend |
| `functional-requirements.md:5280` (REQ-207, CSS-only constraint) | amend |
| `functional-requirements.md:5300` (REQ-207 note) | keep, plus a new note |
| `shared-chrome/README.md:359`, `:362`, `:363` (Built line) | amend |
| `user-flows.md:170` | keep — names the scene, not how it is drawn |
| `system-map.md:242` | keep — the app-wide CSS motion baseline, unchanged |
| `functional-requirements.md:1145` | keep — the scanner's capture canvas, unrelated |
| `functional-requirements.md:1357`, `:1364` (REQ-060), `:2377` | keep — other requirements' own CSS-only scope, unchanged |
| `functional-requirements.md:2799` (REQ-114) | keep — tap-target rule, unrelated |

Two lines the grep does not hit restate the same rule and are amended here too:
`functional-requirements.md:5275` (REQ-207, reduced motion) and `:5281` (REQ-207,
scene art as static files).

**Proposed diff.**

```diff
# PRD/sections/non-functional-requirements.md — NFR-006, Constraints
-  - implementation stays CSS-based — no animation library or animation-framework migration without a separate confirmed decision
+  - implementation stays CSS-based — no animation library or animation-framework migration without a separate confirmed decision; the one exception is the colour's ambient scene (below), a single hand-written canvas renderer with no library behind it
@@
-  - the colour's ambient scene (REQ-207) is CSS-animated layers with one density and one opacity number per scene, held still under reduced motion
+  - the colour's ambient scene (REQ-207) is one hand-written canvas renderer ported from the approved direction-1 mockup's own renderer (`docs/design/ui-reimagining/direction-1/ambience.js`), mounted once as the `AmbientScene` component on a fixed canvas behind the page and driven by the active colour profile; it uses no animation library or framework, is decorative only (hidden from assistive technology, takes no pointer events), keeps one density and one opacity number per scene, and under `prefers-reduced-motion` paints one still frame and runs no animation loop
@@ NFR-006, end of Dependencies
   - DEC-118
   - REQ-098
+- Notes:
+  - amended by `ui-look-translation` (2026-10-02): the ambient-scene canvas exception. The first build kept the scene CSS-only and shipped a haze; the owner's live comparison on 2026-10-02 found the missing scene was most of the gap to the mockup
```

```diff
# PRD/sections/functional-requirements.md — REQ-201, Acceptance Criteria
-  - motifs respect `prefers-reduced-motion` through the existing CSS motion
-    baseline (NFR-006); no new motion trigger or timing system is introduced
+  - motifs respect `prefers-reduced-motion` through the existing CSS motion
+    baseline, and the ambient scene through its canvas renderer's still frame
+    (NFR-006); no new motion trigger or timing system is introduced beyond that
+    one renderer's own frame loop
```

```diff
# PRD/sections/functional-requirements.md — REQ-207
-- Description: The shared frame every destination lives in takes the owner-approved direction-1 look and delivers the REQ-200 token set and REQ-201 motif kit in code. A banner header carries the Menu (☰) at the left and the brand centred; the Menu tray slides in from the left; Theme is a six-cell band; and a restrained, CSS-animated scene of the chosen colour's element plays behind every page.
+- Description: The shared frame every destination lives in takes the owner-approved direction-1 look and delivers the REQ-200 token set and REQ-201 motif kit in code. A banner header carries the Menu (☰) at the left and the brand centred; the Menu tray slides in from the left; Theme is a six-cell band; and a restrained scene of the chosen colour's element, drawn by the canvas renderer ported from the mockup (NFR-006), plays behind every page.
@@ Acceptance Criteria
-  - behind every page plays the chosen colour's **ambient scene**: two slowly drifting haze sheets, a field of glowing dust, the colour's badge large, blurred and faint in the centre, and the colour's element moving (White beams, Blue runes and constellations, Black fog and brambles, Red heat and embers, Green falling leaves, Colorless turning geometry); the same scene plays at a whisper inside the Menu tray over a pool of the colour's light fading in at its foot (Colorless's tray gets a fuller scatter of slightly brighter shapes)
+  - behind every page plays the chosen colour's **ambient scene**: two slowly drifting haze sheets, a field of glowing dust, the colour's badge large, blurred and faint in the centre, and the colour's element moving (White beams, Blue runes and constellations, Black fog and brambles, Red heat and embers, Green falling leaves, Colorless turning geometry), as the ported mockup renderer draws each one; the same scene plays at a whisper inside the Menu tray over a pool of the colour's light fading in at its foot (Colorless's tray gets a fuller scatter of slightly brighter shapes)
@@
-  - under `prefers-reduced-motion` the scene is still and every decorative motion stops (NFR-006)
+  - under `prefers-reduced-motion` the scene paints one still frame and runs no animation loop, and every decorative motion stops (NFR-006)
@@ Constraints
-  - CSS-only motion (NFR-006): the scene is layered static SVG and gradients animated with CSS transforms and opacity — no script-driven animation loop, no canvas render loop, no animation library
-  - the six symbols, badges, banner elements and scene art are the app's own drawings shipped as local static files (REQ-201); no Wizards of the Coast glyph, icon font, logo, set symbol or card art
+  - motion (NFR-006): the scene is the one hand-written canvas renderer ported from the mockup's `ambience.js`, mounted once as `AmbientScene` (page and Menu-tray variants) on a fixed canvas behind the page and driven by the active colour profile; no animation library; every other decorative motion in the frame stays CSS transforms and opacity
+  - the six symbols, badges, banner elements and scene art are the app's own drawings, shipped as local static files or drawn by the ported scene renderer from the app's own code (REQ-201); no Wizards of the Coast glyph, icon font, logo, set symbol or card art
@@ Notes
   - reserved and proposed by the `ui-reimagining-build` package (2026-09-30); the approved mockup drew the element on a script-driven canvas — this build keeps the look and moves it to CSS to stay inside NFR-006
+  - amended by `ui-look-translation` (2026-10-02): the scene returns to the mockup's own canvas renderer under NFR-006's ambient-scene exception; the CSS-only haze it replaces is retired
```

```diff
# PRD/sections/shared-chrome/README.md — ### Decorative motion baseline
 - Built: behind every page plays the chosen colour's **ambient scene** — two
   drifting haze sheets, a field of glowing dust, the colour's badge large, blurred
   and faint in the centre, and the colour's element (White beams, Blue runes, Black
-  fog, Red embers, Green leaves, Colorless turning geometry) — CSS-animated with
-  transform/opacity only, one density and one opacity number per scene, still
-  under reduced motion, and at a whisper inside the Menu tray. The ground is one
+  fog, Red embers, Green leaves, Colorless turning geometry) — drawn by one
+  hand-written canvas renderer ported from the mockup (`AmbientScene`), one
+  density and one opacity number per scene, one still frame under reduced
+  motion, and at a whisper inside the Menu tray. The ground is one
   flat colour per profile from the REQ-200 token set; one typeface (Inter,
```

- Verdict: accept
- Reason: Match the mockup's living scene. For the screenshot comparisons, seed the scene so a reduced-motion still frame is identical from run to run; mask the scene region only as a last resort, since masking it drops most of the atmosphere out of the number. (owner, 2026-10-02)
---

## REQ-207 — the header touches the top of the screen, and panels are glass

**What this decides:** two look rules for the shared frame: the header sits at
the very top of the screen, and panels are see-through glass over the
background scene instead of solid cards.

**In plain terms:** today a band of empty space sits above the header — about
20px on a phone and 48px on a desktop, as the first run's reviews measured —
because the page padding (the inner margin round every screen) wraps the header
too; the mockup's header starts at the very top. This states it outright so the
padding can never wrap the header again: padding applies only to the content
below it. In mock mode (the demo build with a stand-in AI) the "mock mode"
banner keeps its place directly under the header (REQ-123: the banner never
covers a header control). Second, REQ-207 says today that the scene "sits behind
solid panels (the card stage, every In-depth plate) so the badge shows around
them, never through them"; the mockup's panels are glass — translucent, so the
scene shows through. This gives every panel the mockup's own surface values
(glass wherever the mockup draws glass), and the same switch reaches the card
stage on Ask a Question (REQ-206) and the panel under the Trade Balancer's piles
(REQ-215). The open Menu stays fully opaque, as REQ-122 requires (no page text
readable through it), and REQ-200's measured text-contrast floors must still
hold over glass.

**What happens if you say no:** the header keeps the gap above it, and panels
stay solid as today's wording requires, so both differences from the mockup
remain. To take one half and not the other, answer `edit` and name the half.

- Recommendation (the intake's): accept. (The intake's gate item names the
  header; it states glass as part of its method, not as a separate question.)

**Amendment set — header.** Grep, line level:

```
grep -rn "banner header\|page padding\|top edge" PRD/sections | grep -v '^PRD/sections/decisions.md'
```

| Hit | Disposition |
| --- | --- |
| `screen-layout.md:33`, `:61` | keep — shell width minus padding stays true for the content |
| `screen-layout.md:89` | keep — the ☰ button's place in the header |
| `user-flows.md:227`, `system-map.md:564` | keep — name the header, not its position |
| `functional-requirements.md:1570`, `:1572`, `:1609`, `:2629`, `:2799`, `:3337` | keep — name the header, not its position |
| `functional-requirements.md:5263`, `:5265` (REQ-207) | keep — the Description change is NFR-006's block |
| `shared-chrome/README.md:110` | amend — the header's Built line |
| `shared-chrome/README.md:384`, `:406` | keep — shell width minus padding |

Also amended, though not grep hits: REQ-207's new criterion and tests line, and
`screen-layout.md:64` (the Suite shell row's Notes).

**Amendment set — glass.** Grep, line level:

```
grep -rn -i "solid panel\|solid-panel\|solid panels\|never through them\|opaque\|\bsolid\b" PRD/sections | grep -v '^PRD/sections/decisions.md'
```

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:5274` (REQ-207, solid panels) | amend |
| `functional-requirements.md:5231` (REQ-206, solid-panel stage) | amend |
| `functional-requirements.md:5506` (REQ-215, piles on a solid panel) | amend |
| `screen-layout.md:142` (Ask a Question stage) | amend (clause) |
| `screen-layout.md:234` (Trade Balancer balance) | amend (clause) |
| `trade-balancer/README.md:43` | amend (Built line) |
| `screen-layout.md:89`, `functional-requirements.md:2835`, `:2850`, `:2983`, `:5270`, `shared-chrome/README.md:131`, `:419` | keep — the open Menu stays opaque (REQ-122) |
| `functional-requirements.md:2589`, `in-depth/README.md:290`, `shared-chrome/README.md:200`, `system-map.md:382` | keep — "solid" here means a filled chat bubble, not an opaque panel |
| `integrations-and-data.md:223` | keep — unrelated ("opaque id") |

Also amended: REQ-207's contrast line (`functional-requirements.md:5276`).

**Proposed diff.**

```diff
# PRD/sections/functional-requirements.md — REQ-207, Acceptance Criteria
   - the header is a banner: ☰ at the left (at least 44px; about a quarter larger than today's trigger on a phone and a third on desktop), the brand centred (a breathing orb holding the colour's badge, the wordmark, "MTG Assistant") on a lit band with a hairline of the colour's light along its foot, and each profile's element drawn across the band (White low-sun rays at half strength; Blue a scatter of arcane shapes; Black fog pooling at the ends; Red a hot band with embers; Green a scatter of leaf and tree shapes; Colorless small triangles, rings, arcs, dots and crosses); the right-hand slot shows Trade Balancer's price date at `768px`+; the brand keeps the cat-wizard Easter egg (REQ-203)
+  - the banner header sits flush with the top edge of the viewport — its top at y=0 at every width — and the page's own padding applies only to the content below it, never wrapping or offsetting the header; in mock provider mode the mock-mode banner keeps its place directly under the header (REQ-123)
@@
-  - each scene's density and opacity are one number each, so it can be tuned down without redrawing; the scene is decorative, never carries meaning, and sits behind solid panels (the card stage, every In-depth plate) so the badge shows around them, never through them
+  - each scene's density and opacity are one number each, so it can be tuned down without redrawing; the scene is decorative and never carries meaning; panels (the card stage, every In-depth plate, the Trade Balancer piles' panel and every other panel surface) take the mockup's own surface values from the shared token layer (REQ-216) — translucent glass wherever the mockup draws glass — so the scene reads through them; the open Menu tray stays fully opaque (REQ-122)
@@
-  - the REQ-200 contrast floors hold over the scene in all six profiles; a custom Colorless colour follows REQ-099
+  - the REQ-200 contrast floors hold over the scene in all six profiles, including text on glass panels with the scene behind them; a custom Colorless colour follows REQ-099
@@
-  - tests cover the band's cell floor and arrows at 280px and 390px, the tray's close paths, reduced motion stopping the scene, the font loading from the app's own origin, and the contrast floors per profile
+  - tests cover the band's cell floor and arrows at 280px and 390px, the tray's close paths, reduced motion stopping the scene, the header's top edge at 0 at 390×844 and 1440×900, the font loading from the app's own origin, and the contrast floors per profile
@@ Notes
+  - amended by `ui-look-translation` (2026-10-02): the header sits at the top edge outside the page padding (the first build's reviews measured a band of about 20px at 390×844 and 48px at 1440×900 above it), and panels take the mockup's glass surfaces instead of solid fills
```

```diff
# PRD/sections/functional-requirements.md — REQ-206, Acceptance Criteria
-  - with no card attached there is no stage; with cards attached the front card renders full size on a solid-panel stage with the one other card peeking out each side (three or more cards peek one on each side; exactly two cards peek on one side only, so the same card is never rendered twice); a tap on a neighbour or the ‹/› arrows turns the ring
+  - with no card attached there is no stage; with cards attached the front card renders full size on a glass stage (REQ-207) with the one other card peeking out each side (three or more cards peek one on each side; exactly two cards peek on one side only, so the same card is never rendered twice); a tap on a neighbour or the ‹/› arrows turns the ring
```

```diff
# PRD/sections/functional-requirements.md — REQ-215, Acceptance Criteria
-  - two piles of gold sit on a solid panel; each pile has five relative tiers, drawn in flat gold/amber with a bronze outline and one purple gem on tiers 4-5
+  - two piles of gold sit on a glass panel (REQ-207); each pile has five relative tiers, drawn in flat gold/amber with a bronze outline and one purple gem on tiers 4-5
```

```diff
# PRD/sections/screen-layout.md — #### Ask a Question — pre-submit, row "Phone" (line 142), clause
-on a solid-panel stage
+on a glass stage (REQ-207)
```

```diff
# PRD/sections/screen-layout.md — #### Trade Balancer, row "Balance" (line 234), clause
-Two piles of gold on a solid panel
+Two piles of gold on a glass panel (REQ-207)
```

```diff
# PRD/sections/screen-layout.md — #### Suite shell, row "Notes" (line 64)
-| Notes | DEC-145, REQ-124, DEC-117. Do not invent vertical fill for empty lower bands. Life Tracker / answered workspace / scan use their own height rows |
+| Notes | DEC-145, REQ-124, DEC-117. Do not invent vertical fill for empty lower bands. Life Tracker / answered workspace / scan use their own height rows. The banner header sits above the shell's page padding, flush with the viewport's top edge (REQ-207); the padding applies to the content below it |
```

```diff
# PRD/sections/trade-balancer/README.md
-- Built: the balance is drawn as **two piles of gold** on a solid panel, each
+- Built: the balance is drawn as **two piles of gold** on a glass panel, each
```

```diff
# PRD/sections/shared-chrome/README.md — ### The Menu corner rail and tray
 - Built: the suite's single navigation affordance is the **☰ Menu button** at the
-  left of a banner header — at least 44px, about a quarter larger than the former
+  left of a banner header flush with the top edge of the screen (outside the page
+  padding) — at least 44px, about a quarter larger than the former
```

- Verdict: accept
- Reason: Match the mockup: header at the top edge, glass panels. (owner, 2026-10-02)
---

## REQ-216 — one visual system, inherited by every screen (new)

**What this decides:** whether to add one new rule that every redesigned screen
takes its whole look from one shared set of styles, so no screen carries its own
colours.

**In plain terms:** the first build re-typed the mockup's colours and sizes into
each screen by hand, and every copy drifted a little. This rule says there is one
source for every colour, glass surface, corner radius, shadow, glow, text size
and spacing — the mockup's `tokens.css` (its list of named style values), ported
once — and the six colour profiles (White, Blue, Black, Red, Green, Colorless)
live there and switch in one place. Shared styles stack in one order: the
values, then the frame (header, Menu, Theme band, sheets, background scene),
then the page parts (card stage, question box, plates, pills); a screen may use
them but may not redefine them. A screen gets a sheet, a question box or a panel
only from the shared pieces (`SheetShell`, `ConfirmSheet`, `ComposerPill`,
`CardStage`, the plate and foot bar), never from a local copy. The proof:
picking a new Theme colour in the Menu recolours every screen, sheet and overlay
at once, and any colour typed straight into a screen is a defect. It builds on
REQ-200 (one token set with named roles — page ground, panel fill, panel edge,
focus ring, text — and no per-flow palettes) and extends it from colours to every
kind of style value. The Life Tracker table stays untouched (REQ-202). Each slice
proves the rule with two checks: a search of its files for typed-in colours that
must come back empty, and a screenshot of its main screen in two Theme colours.

A few colours cannot come from a stylesheet, so they stay in code, by name, the
way they are today: the background scene's drawing (a canvas paints with colour
values, not style names), the trade pile's gold, bronze and gem artwork (fixed
materials that look the same in every Theme), the scanner's developer-only
debug outlines, each card's colour-identity ring (it comes from the card, never
the Theme — REQ-058), and the Life Tracker table (left exactly as it is —
REQ-202). The search skips those files and nothing else.

**What happens if you say no:** REQ-200's colour-only rule stays the only one;
screens may keep their own spacing, shadow and radius values, and slices are not
held to the two shared-system checks.

- Recommendation: the intake makes this the owner's own rule (set 2026-10-02)
  and asks refinement to write it as a requirement every slice cites; it gives
  no separate verdict recommendation.

**Amendment set.** New id. Reserved as the next free number:

```
grep -rhoE 'REQ-[0-9]{3}' PRD/sections | sort -u | tail -1
```

returns `REQ-215`, so `REQ-216` is reserved here. One cross-reference is added
to REQ-200's Notes; no other line restates this rule.

**Where the colours that live in code today go.** A grep on 2026-10-02 over
`apps/frontend/src` (hex, `rgb(`/`hsl(` with literal numbers, fixed Tailwind
palette classes; tests excluded) found colours in TypeScript in these files
(paths under `apps/frontend/src/`). The **token layer** is the ported
`tokens.css` plus `lib/theme/` (the profile switch and the custom-Colorless
derivation, REQ-099). **Exempt** files are skipped by the audit for the reason
given.

| Colour | File today | Home | Reason |
| --- | --- | --- | --- |
| The six Theme colours and swatches | `lib/theme/palettes.ts`, `lib/theme/applyPalette.ts` | token layer | The profile switch; any value it shares with `tokens.css` must equal it, checked by a test |
| Background scene | `components/AmbientScene.tsx` (canvas port) | exempt | A canvas paints with colour strings; the mockup's `ambience.js` values, copied unchanged and keyed by profile, kept in this one file |
| Trade pile artwork | `components/trade/TradePile.tsx` (`GOLD`, `GOLD_DARK`, `BRONZE`, `GEM`) | exempt | Fixed materials, the same in every Theme, as today |
| Scanner debug outline and overlay | `components/ScanCardOutline.tsx` (`debug` stroke; the lock-on outline already reads `--accent-soft`), `components/ScanDebugOverlay.tsx` | exempt | Opt-in developer diagnostics, fixed to read against any profile |
| Card colour-identity ring | `lib/cardIdentityRing.ts` | exempt | Derived from the card, never the profile (REQ-058; REQ-200's identity-ring constraint) |
| Life Tracker table | `components/portal/life-tracker/PlayerLifeCard.tsx`, `PlayerLifeTrackerApp.tsx` | exempt | Pixel-unchanged (REQ-202) |
| Enrichment heading | `components/EnrichmentStep.tsx` (inline `color: "#e2e8f0"`) | token layer | Primary text (REQ-200's primary-text role) |
| Scanner's dimmed surround | `components/ScanCameraSurface.tsx` (`rgba(15,23,42,0.35)` shadow) | token layer | Scanner chrome |
| Fixed `zinc-`/`slate-` classes, one-off `shadow-[…]` values, `index.css`'s 106 hex literals | many files | token layer or ported stylesheets | Ordinary redesigned chrome, moved by each screen's slice |

**You may `edit` the exemptions.** Each one keeps today's behaviour, the
safest reading (design brief A21, A22). If you would rather the scene's or the
pile's colours move into shared token values too, answer `edit` and say which.

**Audit command** (each slice records it and its two counts; the design
brief's acceptance item 5 carries the same text). `BASE` is the commit the
slice started from; `FILES` lists the TS/TSX files of the components it
rebuilds. (a1) checks those files whole; (a2) checks every line the slice adds
anywhere under `apps/frontend/src` (design brief A23).

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

**Proposed diff.**

```diff
# PRD/sections/functional-requirements.md — new entry, after REQ-215
+### REQ-216
+- Title: One visual system, inherited by every screen
+- Priority: high
+- Description: Every redesigned screen, sheet, overlay and panel takes its look from one shared visual system ported from the approved direction-1 mockup (`docs/design/ui-reimagining/direction-1/`). One token layer — the mockup's `tokens.css`, ported once — is the only place a colour, surface, radius, shadow, glow, type size or spacing value is defined, with the six colour profiles as one set of variables switched in one place. Shell styles (`shell.css`, `ambience.css`: header, Menu, Theme band, sheets, the ambient scene) build on the tokens; flow styles (`flow.css`: stage, composer, plates, pills) build on both. Nothing carries its own palette, its own profile or its own copy of a shared style, so choosing a Theme colour recolours everything at once.
+- Acceptance Criteria:
+  - the mockup's `tokens.css` is ported once, with its variable names and values, as the app's only token source; REQ-200's roles (page ground, colour wash, raised panel fill, panel edge, focus ring, primary text, muted text, filled-accent text) resolve to the ported variables rather than carrying values of their own; the theme code that switches the profile and derives the custom Colorless colour (`apps/frontend/src/lib/theme/`) belongs to this token layer, and any value it holds that `tokens.css` also defines is equal to it, checked by a test
+  - the six colour profiles live in that one token layer and switch in one place; a value the mockup does not supply (the custom Colorless colour, REQ-099) is derived the way the mockup derives its six profiles, never chosen by eye
+  - styles layer in one order — tokens, then shell (`shell.css`, `ambience.css`), then flow (`flow.css`), then a screen's own selectors; a screen's own selector may use what those layers set but may not redefine it; a style two screens need moves up a layer instead of being written twice
+  - a screen gets a sheet, a confirm, a composer, a card stage, a plate or a foot bar only through the shared components (`SheetShell`, `ConfirmSheet`, `ComposerPill`, `CardStage`, the shared plate and foot bar); a variant extends the shared one with a modifier and never forks a local copy
+  - choosing a Theme colour in the Menu (FLOW-007) recolours every screen, sheet and overlay at once, with no element left on the previous colour or on a fixed one
+  - outside the token layer, the ported shell, flow and ambience stylesheets, and the named exemptions below, no redesigned component or stylesheet declares a hex colour, an `rgb(…)` or `hsl(…)` value with literal numbers, a one-off shadow (a Tailwind `shadow-[…]` value or a `box-shadow` with literal lengths), a fixed Tailwind palette colour (such as `zinc-` or `slate-`, already barred by REQ-200), or a custom property of its own; a hit is a defect
+  - colours that cannot come from a stylesheet stay in code only in these named files (under `apps/frontend/src/`), each for its reason: the background scene's canvas drawing (`components/AmbientScene.tsx` — a canvas paints with colour strings; its colours are the mockup's `ambience.js` values copied unchanged and keyed by profile); the trade pile's gold, bronze and gem artwork (`components/trade/TradePile.tsx` — fixed materials, the same in every Theme); the scanner's opt-in developer debug outline and overlay (the `debug` stroke in `components/ScanCardOutline.tsx`, and `components/ScanDebugOverlay.tsx` — diagnostics fixed to read against any profile); each card's colour-identity ring (`lib/cardIdentityRing.ts` — derived from the card, never the profile, REQ-058); and the Life Tracker table (`components/portal/life-tracker/PlayerLifeCard.tsx`, `PlayerLifeTrackerApp.tsx` — pixel-unchanged, REQ-202); every other colour in a TS/TSX file lives in the token layer
+  - every slice that touches a redesigned screen records (a) a search for the patterns above, with the command and a count of zero, over the whole of each component it rebuilds and over every line it adds anywhere under `apps/frontend/src`, skipping the token layer, the ported stylesheets, tests and the named exemptions, and (b) a profile-switch pair — its main state at 390×844 in two Theme colours — showing every element recoloured and none left behind; review treats a hit in (a) or a left-behind element in (b) as Important
+- Constraints:
+  - presentation only; no change to request contracts, prompts, backend routes, card metadata, the data pipeline, or any behaviour another requirement sets
+  - Life Tracker's table stays pixel-unchanged and outside this requirement's ported layers (REQ-202); its sheets inherit the system like every other sheet
+  - card art and each card's colour-identity ring stay derived from the card, never from the profile (REQ-058)
+  - no theming framework and no new dependency (REQ-200)
+- Dependencies:
+  - REQ-058
+  - REQ-099
+  - REQ-200
+  - REQ-201
+  - REQ-202
+  - REQ-206
+  - REQ-207
+  - REQ-208
+  - REQ-209
+  - REQ-214
+  - REQ-215
+  - NFR-006
+  - FLOW-007
+- Notes:
+  - reserved and proposed by the `ui-look-translation` package (2026-10-02) from the owner's rule of 2026-10-02: one shared visual system that every screen, sheet, overlay and panel inherits, with nothing carrying its own palette, its own profile, or its own flow of styles. Written because the first build re-typed mockup values into the app's own tokens and every re-typing drifted
```

```diff
# PRD/sections/functional-requirements.md — REQ-200, Notes
   - amended for the `ui-reimagining-build` pass (2026-09-30): the custom-Colorless exemption is replaced by REQ-099's readability lift, the one permitted runtime colour derivation — a fixed rule, not a contrast engine. REQ-207 is the code slice that ships this token set
+  - REQ-216 extends this requirement's one-source rule from colours to every style value (surface, radius, shadow, glow, type size, spacing) and fixes the order the shared stylesheets layer in; the roles above resolve to its ported token layer
```

- Verdict: accept
- Reason: Accepted as written. The rule is rooted in one unified UI theme and scheme: one shared palette and style system every screen inherits, switched in one place. (owner, 2026-10-02)
---

## FLOW-011 — Ask a Question's question box takes the mockup's two-row shape

**What this decides:** whether Ask a Question's question box is laid out in the
mockup's two rows instead of the single-row pill the requirements describe
today.

**In plain terms:** the requirements (REQ-206 and the Ask a Question flow,
FLOW-011) describe the question box as one pill: the "Add in-depth details" chip
at the left end, then the text, the count and the send button, all in one row.
The mockup draws it in two rows: the text on top; the In-depth chip at the
bottom-left; and the mic|send pill (the microphone half for dictation, REQ-212,
beside the send arrow) at the bottom-right. Nothing it does changes: the same
chip carries the cards and question into In-depth details, the 300-character
limit is still drawn as a ring round the send pill (REQ-011, REQ-134), and
dictation works as built. Only the arrangement changes. The chip's label or icon
at each width follows the mockup instead of today's "icon-only below 480px"
rule.

**What happens if you say no:** the written rule stays one pill in one row, and
Ask a Question's question box keeps differing from the mockup.

- Recommendation: the intake gives none for this point. It names the two-row
  composer as part of the look the run must match ("Why the first pass fell
  short", point 4).

**Amendment set.** Grep, line level:

```
grep -rn "one-pill\|one pill\|question box is\|Question box" PRD/sections | grep -v '^PRD/sections/decisions.md'
```

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:5228` (REQ-206 description) | amend (clause) |
| `functional-requirements.md:5234` (REQ-206, the question box) | amend |
| `user-flows.md:252` (FLOW-011 step 2) | amend (clause) |
| `screen-layout.md:142` (Ask a Question pre-submit, Phone) | amend (clause) |
| `quick-lookup/README.md:49`, `:121` | amend (Built lines) |
| `screen-layout.md:152` (answered workspace composer) | keep — the answered state follows its own mockup state; this block changes only the pre-submit box |
| `quick-lookup/README.md:98` | keep — the locked topic "pill", unrelated |

**Proposed diff.**

```diff
# PRD/sections/user-flows.md — FLOW-011, Main Flow step 2, clause
-the one-pill question box (Add in-depth details · text · count · send)
+the two-row question box (the text on top; the Add in-depth details chip at the bottom-left and the mic|send pill at the bottom-right)
@@ FLOW-011, Notes
+  - amended by `ui-look-translation` (2026-10-02): the pre-submit question box takes the direction-1 mockup's two-row shape; what it does is unchanged
```

```diff
# PRD/sections/functional-requirements.md — REQ-206, Description, clause
-a one-pill question box with the send inside it
+a two-row question box with the send inside it
@@ REQ-206, Acceptance Criteria
-  - the question box is one pill: the Add in-depth details pill at its left end (icon-only below 480px, labelled from 480px up), the text, the character count, and the send
+  - the question box has two rows, as the mockup page draws it: the text on top; the Add in-depth details chip at the bottom-left (labelled or icon-only at each width as the mockup shows) and the send pill, with its microphone half (REQ-212), at the bottom-right; the character count sits where the mockup places it
```

```diff
# PRD/sections/screen-layout.md — #### Ask a Question — pre-submit, row "Phone" (line 142), clause
-**Question box:** one pill (Add in-depth details · text · count · send pill)
+**Question box:** two rows (text on top; Add in-depth details chip bottom-left, mic|send pill bottom-right)
```

```diff
# PRD/sections/quick-lookup/README.md — ### Entry and pre-submit layout
-  the one-pill Question box, then the "General rules topics" outer
+  the two-row Question box, then the "General rules topics" outer
@@
-- Built: the Question box is one pill — the Add in-depth details pill at its
-  left end, the text, the character count, and the round send pill. One line
+- Built: the Question box has two rows — the text on top, the Add in-depth
+  details chip at the bottom-left and the round mic|send pill at the
+  bottom-right, with the character count where the mockup places it. One line
```

- Verdict: accept
- Reason: Match the mockup's two-row question box. (owner, 2026-10-02)
---

## REQ-124 — a redesigned screen's column takes its mockup width on desktop

**What this decides:** whether a redesigned screen's content column on a
desktop may be narrower than the app's standard 768px, to match the width its
mockup page draws.

**In plain terms:** on a desktop the app's content sits in a column 92% of the
window wide, capped at 48rem — 768px on a 1440px-wide screen (REQ-124). Its note
says that cap "still binds the redesign". Some mockup pages draw a narrower
column: the first run's review measured In-depth details' mockup column at 36rem
(576px) against the app's 768px. This keeps 48rem as the ceiling but lets each
redesigned screen's column take the width its mockup page draws, inside that
ceiling. Phones are unchanged, and the rule that a full-width button never
stretches into a band still holds.

**What happens if you say no:** every redesigned screen keeps the full 768px
column on a desktop, and In-depth details (and any other narrower mockup page)
stays wider than the mockup.

- Recommendation: the intake gives none for this point. The width difference is
  the first run's review 1 note, carried in its receipt.

**Amendment set.** Grep, line level:

```
grep -rn "48rem\|36rem" PRD/sections | grep -v '^PRD/sections/decisions.md'
```

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:3024` (REQ-124, shell width) | keep, with a new criterion after it |
| `functional-requirements.md:3025` (REQ-124, ultra-wide cap) | keep |
| `functional-requirements.md:3043` (REQ-124 note: the cap "still binds the redesign") | keep, with a new note after it |
| `screen-layout.md:34` (shared layout rule) | amend — one sentence added |
| `screen-layout.md:62` (Suite shell, desktop) | keep — the shell's own width is unchanged |
| `screen-layout.md:143`, `:163`, `:183`, `:232` (per-screen desktop rows) | keep — they name the shell cap, which stays the ceiling; the column rule comes from line 34 |
| `trade-balancer/README.md:190`, `shared-chrome/README.md:385`, `:407` | keep — describe the shell cap, unchanged |
| `screen-layout.md:130`, `functional-requirements.md:3314`, `:3315`, `shared-chrome/README.md:432` | keep — View Context's sheet height (`48rem` as a height), unrelated |

**Proposed diff.**

```diff
# PRD/sections/functional-requirements.md — REQ-124, Acceptance Criteria
   - the shell width is `min(48rem, 92vw)`; at 1440x900 the measured shell width is 768px (baseline: 670px)
+  - on the direction-1 redesigned screens (Ask a Question, In-depth details, Trade Balancer, the card scanner's chrome, Life Tracker's sheets) a screen's content column inside the shell takes the width its mockup page draws, never wider than the shell; the shell's own width and cap above are unchanged and remain the ceiling
@@ REQ-124, Notes
+  - amended by `ui-look-translation` (2026-10-02): the 48rem cap stays the ceiling, but a redesigned screen's content column follows its mockup page's own width inside it; the first build's review measured In-depth details' mockup column at 36rem (576px) at 1440×900 against the app's 768px
```

```diff
# PRD/sections/screen-layout.md — shared layout rules (line 34), sentence appended
-  - **tablet/desktop:** shell ≈ **92%** of viewport width, capped at `min(48rem, 92vw)` (DEC-145 / REQ-124). Tune the rem cap in product truth when mocks prove a different reading width; do not jump to edge-to-edge without a catalog/DEC update.
+  - **tablet/desktop:** shell ≈ **92%** of viewport width, capped at `min(48rem, 92vw)` (DEC-145 / REQ-124). Tune the rem cap in product truth when mocks prove a different reading width; do not jump to edge-to-edge without a catalog/DEC update. On the direction-1 redesigned screens a screen's content column takes its mockup page's own width inside this cap (REQ-124).
```

- Verdict: accept
- Reason: Match each mockup page's column width. (owner, 2026-10-02)
---

## REQ-079 — keep the "General rules topics" panel, directly under the question box

**What this decides:** whether the "General rules topics" panel stays on Ask a
Question in the new look, and where it sits — or is retired.

**In plain terms:** "General rules topics" is a collapsed list under the
question box of core rules (the stack and priority, targeting, combat, layers)
that a player can read on the spot, with no AI call; each row also has "Use this
topic", which locks that topic's phrase into the question as a pill (REQ-091).
The first run's gate kept it on the redesigned page; the mockup has no such
panel, and nobody recorded why it was kept. This proposal keeps it, because
taking away something players can use today needs your say-so: it sits directly
under the question box as one collapsed glass plate in the shared style
(REQ-216), the one element on Ask a Question the mockup does not draw. Its
behaviour is unchanged. In the side-by-side screenshot comparisons its strip is a
named mask (left out of the pixel count), since the mockup has nothing there.

**What happens if you say no:** the panel stays where it is today, below the
question box, with no placement or styling rule from this run. **To retire it
instead,** answer `edit` with "retire": `build` then removes the panel from Ask a
Question, marks REQ-079 retired, and amends the locked topic pill (REQ-091,
reachable only from a topic row), REQ-206's line that keeps both, REQ-073's
layout line, FLOW-011 steps 2 and 4, FLOW-023 step 2, and the `quick-lookup`
spec.

- Recommendation (the intake's): owner's call — the intake does not know why the
  panel was kept.

**Amendment set.** Grep, line level:

```
grep -rn "General rules topics" PRD/sections | grep -v '^PRD/sections/decisions.md'
```

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:1870` (REQ-079, placement) | amend |
| `functional-requirements.md:5239` (REQ-206, keeps the panel) | amend |
| `quick-lookup/README.md:84` (Built line, placement; non-hit continuation of the `:82` section) | amend |
| `functional-requirements.md:1754` (REQ-073 layout order), `user-flows.md:252` (FLOW-011), `:523` (FLOW-023) | keep — already put the panel after the question box |
| `functional-requirements.md:1866`, `:1868`, `:1871`, `:1890` (REQ-079 title, description, summary rule, history) | keep |
| `functional-requirements.md:2148`, `:2181` (REQ-091) | keep — the locked pill is unchanged |
| `user-flows.md:254`, `:258`, `:261`, `:263`, `:279`, `system-map.md:536`, `quick-lookup/README.md:49`, `:82` | keep — behaviour and order unchanged |

**Proposed diff.**

```diff
# PRD/sections/functional-requirements.md — REQ-079, Acceptance Criteria
-  - the pre-submit view shows a collapsed-by-default outer "General rules topics" disclosure below the Question field; expanding it reveals a short set of core rules topics (e.g. the stack & priority, targeting, combat, layers)
+  - the pre-submit view shows a collapsed-by-default outer "General rules topics" disclosure directly below the question box, drawn as one collapsed plate in the shared visual system (REQ-216) — the one element of the redesigned Ask a Question page the direction-1 mockup does not draw; expanding it reveals a short set of core rules topics (e.g. the stack & priority, targeting, combat, layers)
@@ REQ-079, Notes
+  - amended by `ui-look-translation` (2026-10-02): kept on the redesigned Ask a Question page, directly under the question box as one shared plate; the mockup has no such panel
```

```diff
# PRD/sections/functional-requirements.md — REQ-206, Acceptance Criteria
-  - the General rules topics disclosure (REQ-079) and the locked topic pill (REQ-091) stay on the page, unchanged in behaviour
+  - the General rules topics disclosure (REQ-079) and the locked topic pill (REQ-091) stay on the page, unchanged in behaviour; the disclosure sits directly below the question box as one collapsed plate (REQ-079)
```

```diff
# PRD/sections/quick-lookup/README.md — ### General rules topics browse
-- Built: below the Question field sits a collapsed-by-default "General rules
-  topics" outer disclosure whose summary stays visible in every pre-submit state
+- Built: directly below the Question box sits a collapsed-by-default "General
+  rules topics" outer disclosure, drawn as one plate in the shared visual system
+  (REQ-216), whose summary stays visible in every pre-submit state
```

- Verdict: edit
- Reason: retire. Remove the General rules topics panel from Ask a Question; the mockup was made without it on purpose. Apply the retire path the block spells out (REQ-079 retired; REQ-091, REQ-206, REQ-073, FLOW-011 steps 2 and 4, FLOW-023 step 2 and the quick-lookup spec amended). (owner, 2026-10-02)
---

## REQ-070 — helper text on the redesigned screens follows the mockup

**What this decides:** whether the small helper lines on the redesigned screens
may use the mockup's wording and placement — including leaving a line out where
the mockup has none — instead of staying word for word as they are.

**In plain terms:** a 2026 copy rule (REQ-070 — the rule the intake calls
DEC-092, a decision-log entry that is now retired, so the rule lives here)
sharpened two helper lines and froze every other on-screen helper line
"byte-for-byte" — exactly as written, character for character — and banned any
new guidance text. That freeze is why In-depth details' Cards step still shows
the "Add cards to zones" heading and its lede, and the line "Stack order is
bottom to top. The first card you add is the bottom; each new card is added on
top.", where the mockup shows neither. This makes an exception for the
redesigned screens (Ask a Question, In-depth details, Trade Balancer, the
scanner's chrome, and Life Tracker's Game Setup and Counters sheets): there,
helper text follows that screen's mockup page — its wording, its place, and
whether a line appears at all. The freeze still covers every other screen, and
on these screens still covers the scanner's tuned hints (the "move closer" and
"too dark" style coaching, "Locking on …" and "Camera unavailable"), the waiting
panel's copy, and every control's accessible name (what a screen reader
announces). The same freeze is restated in REQ-100 (the players-in-game helper),
REQ-073 (Ask a Question's old "Add a card for context…" line, which today's page
already does not show), the In-depth spec and the system map; this block amends
each.

**What happens if you say no:** the freeze stands. The redesigned screens keep
today's helper lines word for word, including the two In-depth Cards lines the
mockup does not have.

- Recommendation (the intake's): allow the mockup's wording for the redesigned
  screens.

**Amendment set.** Grep, line level:

```
grep -rn "reads exactly\|remains exactly\|byte-for-byte unchanged\|no net-new guidance\|no new visible guidance\|new guidance copy\|guidance copy\|stack-order note\|Add cards to zones" PRD/sections | grep -v '^PRD/sections/decisions.md'
```

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:1665`, `:1666` (REQ-070, the two sharpened lines) | amend — clause added |
| `functional-requirements.md:1667` (REQ-070, byte-for-byte freeze) | keep, with the exception added after it |
| `functional-requirements.md:1668` (REQ-070, no net-new guidance) | amend |
| `functional-requirements.md:1661`, `:1663` (REQ-070 title, description of its own pass) | keep |
| `functional-requirements.md:1753` (REQ-073, "Add a card for context…") | amend |
| `functional-requirements.md:1770` (REQ-073 history note) | keep |
| `functional-requirements.md:2453` (REQ-100, players helper) | amend |
| `functional-requirements.md:2458` (REQ-100's own scope) | keep |
| `in-depth/README.md:142`, `:154` (Built lines) | amend |
| `system-map.md:536` (Quick Lookup summary, inline guidance copy) | amend (clause) |
| `functional-requirements.md:1115`, `:1119` (REQ-052), `:1698` (REQ-071) | keep — tuned scanner copy stays frozen |
| `non-functional-requirements.md:271`, `functional-requirements.md:3741` | keep — unrelated ("reads exactly like" a working hook) |

**Proposed diff.**

```diff
# PRD/sections/functional-requirements.md — REQ-070, Acceptance Criteria
-  - the game-context "Players in game" helper text reads exactly `Tap ▾ to set names and life totals — 2 players start at 20, 3+ at 40.` (replacing `2 players start at 20 life. 3+ players default to 40 life.`), naming the `▾` expander control while preserving the 20/40 defaults behavior in a single line
-  - the zone-confirmation helper text reads exactly `Select all zones that apply to your question.` (replacing `Select the zones relevant to your question. Defaults are pre-checked based on the turn phase.`); the prior turn-phase-defaults clause is intentionally dropped
+  - the game-context "Players in game" helper text reads exactly `Tap ▾ to set names and life totals — 2 players start at 20, 3+ at 40.` (replacing `2 players start at 20 life. 3+ players default to 40 life.`), naming the `▾` expander control while preserving the 20/40 defaults behavior in a single line; on the redesigned In-depth details Game station the mockup's wording governs instead (redesigned-screens exception below)
+  - the zone-confirmation helper text reads exactly `Select all zones that apply to your question.` (replacing `Select the zones relevant to your question. Defaults are pre-checked based on the turn phase.`); the prior turn-phase-defaults clause is intentionally dropped; on the redesigned In-depth details Zones station the mockup's wording governs instead (redesigned-screens exception below)
   - no other on-screen guidance/helper text is changed: the "Add cards to zones" helper, the context-enrichment screen (other than its ready-state helper text, whose pointer to the send control is governed by DEC-153/REQ-132 rather than this preserve), the answered/follow-up view, the scan on-open state, the stack-order note, the tuned scan cause-hints, and the fallback-question note are byte-for-byte unchanged
+  - redesigned-screens exception (`ui-look-translation`, 2026-10-02): on Ask a Question (REQ-206), In-depth details (REQ-209), Trade Balancer (REQ-215), the card scanner's chrome (REQ-214) and Life Tracker's Game Setup and Counters sheets (REQ-202), guidance and helper text — its wording, its placement, and whether a line appears at all — follows that screen's approved mockup page under `docs/design/ui-reimagining/direction-1/`. Where the mockup page shows no such line, none renders (for example the In-depth Cards step's "Add cards to zones" heading and lede, and the stack-order note `Stack order is bottom to top. The first card you add is the bottom; each new card is added on top.`); where it shows one, its wording is the mockup's. On these screens the byte-for-byte preserve still holds for the tuned scan condition-aware cause-hints and the scanner's `locking` / `camera-error` state copy (REQ-052, REQ-071), the waiting panel's thresholds and copy (DEC-031, DEC-041), and every control's accessible name
-  - no net-new guidance text is introduced anywhere — no new intro/orientation lines, tooltips, popovers, coachmarks, modals, or onboarding flow
+  - no net-new guidance text is introduced anywhere — no new intro/orientation lines, tooltips, popovers, coachmarks, modals, or onboarding flow — except a line a redesigned screen's mockup page shows (exception above)
@@ REQ-070, Notes
+  - amended by `ui-look-translation` (2026-10-02): the redesigned-screens exception above. The decision-index row DEC-092 that first set this preserve is retired, so the rule is amended here
```

```diff
# PRD/sections/functional-requirements.md — REQ-073, Acceptance Criteria
-  - the pre-submit view's guidance copy reads exactly **"Add a card for context or ask any Magic related question."**, shown inline as a suffix on the "Optional card" label after an em dash (e.g. "OPTIONAL CARD — Add a card for context or ask any Magic related question."), not as a standalone line under the header (DEC-113)
+  - the pre-submit view's guidance copy follows the Ask a Question mockup page (REQ-070's redesigned-screens exception); the redesigned page carries no hint line under the title (REQ-206), so the former inline suffix "Add a card for context or ask any Magic related question." on the "Optional card" label no longer renders (today's build already omits it)
```

```diff
# PRD/sections/functional-requirements.md — REQ-100, Acceptance Criteria
-  - the helper copy remains exactly `Tap ▾ to set names and life totals — 2 players start at 20, 3+ at 40.`; no new visible guidance text is introduced
+  - the helper copy remains exactly `Tap ▾ to set names and life totals — 2 players start at 20, 3+ at 40.`, or on the redesigned Game station the mockup's wording (REQ-070's redesigned-screens exception); no other new visible guidance text is introduced
```

```diff
# PRD/sections/in-depth/README.md — ### Step 1 and ### Step 2
-- Built: the "Players in game" helper reads exactly `Tap ▾ to set names and life
-  totals — 2 players start at 20, 3+ at 40.`; the count-driven starting-life
-  behavior (2 → 20, 3+ → 40) is unchanged, this is copy only. (DEC-092, REQ-070)
+- Built: the "Players in game" helper reads as the In-depth details mockup's Game
+  station shows it (REQ-070's redesigned-screens exception; before this pass it
+  read exactly `Tap ▾ to set names and life totals — 2 players start at 20, 3+ at
+  40.`); the count-driven starting-life behavior (2 → 20, 3+ → 40) is unchanged,
+  this is copy only. (DEC-092, REQ-070)
@@
-- Built: the zone-confirmation helper reads exactly `Select all zones that apply
-  to your question.`; the prior turn-phase-defaults clause was intentionally
-  dropped. (DEC-092, REQ-070)
+- Built: the zone-confirmation helper reads as the In-depth details mockup's
+  Zones station shows it (REQ-070's redesigned-screens exception; before this
+  pass it read exactly `Select all zones that apply to your question.`). (DEC-092,
+  REQ-070)
```

```diff
# PRD/sections/system-map.md — Quick Lookup summary (line 536), clause
-The pre-submit card label carries the guidance copy inline after an em dash.
+Pre-submit guidance copy follows the Ask a Question mockup page (REQ-070's redesigned-screens exception); today none renders.
```

- Verdict: accept
- Reason: Helper text on the redesigned screens follows the mockup. (owner, 2026-10-02)
---

## REQ-206 — position dots replace the `n / 10` card counter (owner question 1)

**What this decides:** whether Ask a Question's card counter becomes the
mockup's row of position dots instead of today's number pill.

**In plain terms:** when a player attaches cards to Ask a Question they sit on a
stage — the front card full size, its neighbours peeking — and today a dark pill
reads how many are attached out of the cap of 10 (REQ-167), for example
`3 / 10`. The mockup shows a row of dots instead, one per attached card, with the
front card's dot lit, so the player sees where they are as they turn the ring.
The first build kept the number pill and only borrowed the dots' styling. This
swaps the pill for the dots. The cap of 10 is still told to the player by the
existing message when they try to add an eleventh ("You've added 10 cards, the
most one Quick Question can use. Remove a card below to add another."), and the
dots carry an accessible name such as "Card 2 of 3" for screen readers.

**What happens if you say no:** the number pill stays, with the mockup's dot
styling, as today.

- Recommendation (the intake's): match the mockup unless you say otherwise.

**Amendment set.** Grep, line level:

```
grep -rn "count pill\|n / cap\|n / 10\|n / <cap>" PRD/sections | grep -v '^PRD/sections/decisions.md'
```

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:5232` (REQ-206, the count pill) | amend |
| `quick-lookup/README.md:55` (Built line) | amend |
| `screen-layout.md:142` (Ask a Question pre-submit, Phone) | amend (clause) |
| `user-flows.md:135`, `:136`, `system-map.md:323`, `functional-requirements.md:5468`, `:5470`, `:5477`, `:5498`, `scan/README.md:107`, `:199`, `screen-layout.md:212`, `:213`, `:214` | keep — the scanner's own count pill, a different control |

Also amended, though not grep hits: REQ-206's tests line and Notes. REQ-167's
"enforced and stated to the player" criterion is kept: the existing cap message
states it.

**Proposed diff.**

```diff
# PRD/sections/functional-requirements.md — REQ-206, Acceptance Criteria
-  - ✕ Remove and ⓘ Details straddle the front card's top corners; a dark count pill reads `n / <cap>`, where the cap is REQ-167's
+  - ✕ Remove and ⓘ Details straddle the front card's top corners; a row of position dots, one per attached card with the front card's dot lit, shows where the player is in the ring, placed and drawn as the mockup page shows it, with the accessible name "Card <n> of <total>"; there is no `n / <cap>` count pill, and the cap (REQ-167) is stated by the existing message when the player tries to add past it
@@ REQ-206, tests line, clause
-turning the ring (tap and arrows, wrapping, no duplicate neighbour at exactly two cards)
+turning the ring (tap and arrows, wrapping, no duplicate neighbour at exactly two cards, the lit position dot following the front card)
@@ REQ-206, Notes
+  - amended by `ui-look-translation` (2026-10-02): position dots replace the count pill, matching the mockup (the first build's owner question 1)
```

```diff
# PRD/sections/quick-lookup/README.md — ### Entry and pre-submit layout
-  straddle the front card's top corners; a dark count pill reads `n / 10`.
+  straddle the front card's top corners; a row of position dots lights the front
+  card's place in the ring.
```

```diff
# PRD/sections/screen-layout.md — #### Ask a Question — pre-submit, row "Phone" (line 142), clause
-a dark count pill reads `n / cap`
+a row of position dots lights the front card's place
```

- Verdict: accept
- Reason: Position dots, as the mockup shows. (owner, 2026-10-02)
---

## REQ-167 — Ask a Question's card search opens before three letters (owner question 2)

**What this decides:** whether Ask a Question's card search starts showing
suggestions before the player has typed three letters.

**In plain terms:** today every card search in the app waits until three
characters are typed before it shows any suggestions (the shared search code
returns nothing for shorter text). The mockup's Add-card search on Ask a Question
opens its list sooner. This makes Ask a Question's Add-card search open its list
at the threshold the mockup's own search uses — read from the mockup's script
(`flow.js`) at build and written into this requirement's note, so the number is
the mockup's, not a guess; the first run's receipt says only "before three
characters". Every other card search (In-depth details, Trade Balancer) keeps
three characters. Which card gets attached, and what is sent to the AI, do not
change.

**What happens if you say no:** Ask a Question's search keeps the
three-character minimum, as today.

- Recommendation (the intake's): match the mockup unless you say otherwise.

**Amendment set.** Grep, line level:

```
grep -rn "three characters\|3 characters\|3-character\|three-character" PRD/sections | grep -v '^PRD/sections/decisions.md'
```

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:3382` (REQ-139, a control "of at most three characters") | keep — unrelated |

The three-character minimum is not written in `PRD/sections/` today; it lives in
code (`apps/frontend/src/lib/search.ts:109`,
`apps/frontend/src/hooks/useAutocompleteKeyboard.ts:4`). The diff writes the
new rule into REQ-167, the Ask a Question card-list requirement.

**Proposed diff.**

```diff
# PRD/sections/functional-requirements.md — REQ-167, Acceptance Criteria
   - The pre-submit view lets the player add, preview, and remove more than one card; an explicit cap of **10 cards** — the same number as the Stack's limit (REQ-010) — is enforced and stated to the player so the prompt stays bounded.
+  - On Ask a Question (REQ-206) the Add-card search opens its result list before three characters are typed, at the threshold the direction-1 mockup's own search uses (`docs/design/ui-reimagining/direction-1/flow.js`, read at build and recorded in this requirement's Notes); every other card search in the suite keeps its three-character minimum. Which card resolves, and what the request carries, are unchanged.
@@ REQ-167, Notes
+  - amended by `ui-look-translation` (2026-10-02): Ask a Question's search threshold (the first build's owner question 2); `build` records the mockup's number here
```

- Verdict: accept
- Reason: Use the mockup's own search threshold, read from its script at build. (owner, 2026-10-02)
---

## REQ-209 — the ruling's ✎ Edit button appears and goes back to the review (owner question 3)

**What this decides:** whether In-depth details' ruling screen shows the
"✎ Edit" button, and what happens to the answer already on screen when the
player uses it.

**In plain terms:** after a ruling arrives in In-depth details, the requirement
(REQ-209) already says a "✎ Edit" button returns to the review step with
everything kept, but the first build never drew it — today the player sees only
"◈ View context" and "↺ Start over". The mockup has the Edit chip. This makes it
appear beside View context and Start over, and settles what it does with the
answer, mirroring Ask a Question's own "✎ Edit cards" (REQ-206): it goes back to
the review with the game context, every card's details and the question exactly
as they were; the answered conversation leaves the screen, already saved to
Question History, where it reopens live (REQ-103, REQ-213); and the next send
starts a new conversation. Start over still clears everything except the player
roster (REQ-029).

**What happens if you say no:** the existing line still asks for an Edit button
but leaves open what happens to the sent answer, so the build would have to
guess; today's screen keeps showing no Edit button. To keep the answer on screen
after Edit instead, answer `edit` and say so.

- Recommendation (the intake's): match the mockup unless you say otherwise.

**Amendment set.** Grep, line level:

```
grep -rn "✎ Edit\*\*\|✎ Edit returns" PRD/sections | grep -v '^PRD/sections/decisions.md'
```

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:5348` (REQ-209, the chat) | amend |

Also amended, though not grep hits: REQ-209's tests line, Dependencies and
Notes, and a new Built line in `in-depth/README.md`.

**Proposed diff.**

```diff
# PRD/sections/functional-requirements.md — REQ-209, Acceptance Criteria
-  - **the chat** is the shared workspace with the Cards strip, **View Context** beside the title, and the same bubble, wait, chips and send pill as Ask a Question; **✎ Edit** returns to the review with everything kept (the conversation is saved to history first); **↺ Start over** follows REQ-029
+  - **the chat** is the shared workspace with the Cards strip, **View Context** beside the title, and the same bubble, wait, chips and send pill as Ask a Question; **✎ Edit** renders beside View Context and ↺ Start over once a ruling exists and, mirroring Ask a Question's ✎ Edit cards (REQ-206), returns to the review with the game context, every card's details and the question exactly as they were — the answered conversation leaves the screen, already saved to Question History (REQ-103, REQ-213), and the next send starts a new conversation; **↺ Start over** follows REQ-029
-  - tests cover rail navigation and the Context bounce, the carried-card guardrail and Leave out, drag and button reorder with tag renumbering, the Stack order reaching the request, and the menu's Move to and Remove
+  - tests cover rail navigation and the Context bounce, the carried-card guardrail and Leave out, drag and button reorder with tag renumbering, the Stack order reaching the request, the menu's Move to and Remove, and ✎ Edit rendering once a ruling exists and returning to the review with everything kept and the conversation saved
@@ REQ-209, Dependencies
   - REQ-100
+  - REQ-103
   - REQ-108
   - REQ-206
   - REQ-208
+  - REQ-213
   - FLOW-001
@@ REQ-209, Notes
+  - amended by `ui-look-translation` (2026-10-02): the ✎ Edit chip renders and mirrors Ask a Question's ✎ Edit cards (the first build's owner question 3; that build drew no Edit control)
```

```diff
# PRD/sections/in-depth/README.md — new bullet directly after the "- Built: **↺ Start over** is visible once…" bullet
+- Built: **✎ Edit** sits beside View Context and ↺ Start over once a ruling
+  exists. It returns to the review with the game context, every card's details
+  and the question kept; the answered conversation is already saved to Question
+  History, and the next send starts a new conversation. (REQ-209)
```

- Verdict:
- Reason:

---

## REQ-215 — the same printing added twice becomes one row with a quantity (owner question 4)

**What this decides:** whether adding the exact same card printing to a trade
side twice shows one row with a quantity of 2, or two separate rows as today.

**In plain terms:** in the Trade Balancer each side lists the cards being
traded, and each row already has a − / number / + quantity stepper (REQ-065
allows the same card "via repeated adds and/or a per-entry quantity control").
Today, adding the identical card again — same printing (the specific set and
collector number) and same finish (foil or not) — adds a second row. The mockup
shows it merged: one row with its quantity. This makes a repeat add raise the
existing row's quantity by one; the row keeps its place in the list, and cards
committed from the scanner merge the same way. A different printing or finish
stays its own row. Totals do not change — two rows of $3 and one row of 2 × $3
both add $6.

**What happens if you say no:** a repeat add keeps creating a second separate
row, as today.

- Recommendation (the intake's): match the mockup unless you say otherwise.

**Amendment set.** Grep, line level:

```
grep -rn -i "duplicates allowed\|more than once on a side\|appear multiple times\|separate row\|second separate" PRD/sections | grep -v '^PRD/sections/decisions.md'
```

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:1518` (REQ-065, quantity/multiples) | amend |
| `functional-requirements.md:1511` (REQ-065 description: "the same card can appear more than once on a side") | keep — still true, as a quantity |
| `user-flows.md:211` (FLOW-009, same card more than once on a side) | keep — still true |
| `trade-balancer/README.md:171` (quantity ≥ 1, duplicates allowed) | keep — still true |

Also amended, though not grep hits: REQ-215's entry criterion, tests line and
Notes, and a new Built line in `trade-balancer/README.md`.

**Proposed diff.**

```diff
# PRD/sections/functional-requirements.md — REQ-215, Acceptance Criteria
-  - every entry shows its card image (a tap opens the card detail); entries keep add order; changing a printing or finish edits the row in place; the foil toggle on each trade row stays
+  - every entry shows its card image (a tap opens the card detail); entries keep add order; changing a printing or finish edits the row in place; the foil toggle on each trade row stays; adding a card whose printing and finish match a row already on that side raises that row's quantity by one instead of adding a second row (the row keeps its place in add order, and a scanner commit merges the same way), so identical copies read as one row with its quantity
@@
-  - tests cover each tier boundary, each verdict band and Even, the New trade confirm and its no-op when empty, renaming, and totals unchanged by any of it
+  - tests cover each tier boundary, each verdict band and Even, the New trade confirm and its no-op when empty, renaming, a repeat add merging into one row's quantity (and a different printing or finish staying separate), and totals unchanged by any of it
@@ REQ-215, Notes
+  - amended by `ui-look-translation` (2026-10-02): a repeat add of the same printing and finish merges into one row's quantity, matching the mockup (the first build's owner question 4); totals are unchanged
```

```diff
# PRD/sections/functional-requirements.md — REQ-065, Acceptance Criteria
-  - **quantity/multiples:** the same card (or printing) may appear multiple times on a side, via repeated adds and/or a per-entry quantity control; each unit counts toward the side total; the stack duplicate-block does not apply
+  - **quantity/multiples:** the same card may appear multiple times on a side: a repeated add of the same printing and finish raises that entry's quantity (REQ-215), a different printing or finish is its own entry, and the per-entry quantity control adjusts it; each unit counts toward the side total; the stack duplicate-block does not apply
```

```diff
# PRD/sections/trade-balancer/README.md — new bullet, with the README's other entry-row Built lines
+- Built: adding a card whose printing and finish match a row already on that
+  side raises that row's quantity instead of adding a second row; a different
+  printing or finish stays its own row. Totals are unchanged. (REQ-065, REQ-215)
```

- Verdict: accept
- Reason: Merge repeat adds into one row with a quantity, as the mockup shows. (owner, 2026-10-02)
---

## REQ-214 — the scanner gets the mockup's hint line (owner question 5)

**What this decides:** whether the card scanner shows a one-line hint telling
the player that scanned cards join their destination when they close the
scanner, worded as the mockup words it.

**In plain terms:** since the first run, a scanned card waits in the scanner's
own holding list, shown by a count pill in the top-right, and joins the zone,
question or trade side only when the player closes the scanner (REQ-214, as you
edited it). Nothing on the scanner screen says so except the pill's own footer
("Joins <destination>"). The first run asked whether to add a hint line and what
it should say; no hint line exists in today's build. This adds one static line
under the viewfinder (the camera window), in the wording and place the mockup's
scanner page shows. If the mockup page turns out to have no such line, nothing
is added and `build` records that. It is plain text, not a button, changes no
scanning behaviour, and is an allowed exception to REQ-070's ban on new guidance
text.

**What happens if you say no:** no hint line; the pill's "Joins <destination>"
footer stays the only explanation. To choose your own wording, answer `edit`
with the words.

- Recommendation (the intake's): match the mockup unless you say otherwise.

**Amendment set.** Grep, line level:

```
grep -rn -i "hint line\|close the scanner\|Joins <" PRD/sections | grep -v '^PRD/sections/decisions.md'
```

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:5235` (REQ-206, "no hint line under the title") | keep — Ask a Question's title, not the scanner |
| `functional-requirements.md:5497`, `:5498` (REQ-214 notes) | keep |

The hint line changes the scanner screen's shape, so its layout row is checked
too:

```
grep -n "^| Chrome | A square ✕ exit box" PRD/sections/screen-layout.md
```

| Hit | Disposition |
| --- | --- |
| `screen-layout.md:213` (Scan camera surface, Chrome row) | amend — add the hint line beneath the camera frame |

Also amended, though not grep hits: REQ-214's criteria, tests line and Notes,
and a new Built line in `scan/README.md`.

**Proposed diff.**

```diff
# PRD/sections/functional-requirements.md — REQ-214, Acceptance Criteria
   - a caution control beside the count pill opens a one-line note that card scanning is experimental, dismissed with "Got it"
+  - a one-line static hint under the viewfinder tells the player that held cards join the zone, question or trade side when the scanner closes, in the wording and position the mockup's scanner page (`docs/design/ui-reimagining/direction-1/card-scan.html`) shows; it is text, not a control, and is an allowed exception to REQ-070's no-net-new-guidance rule; if the mockup page carries no such line, none renders
@@
-  - tests cover the holding-list accumulate/commit-on-close/Remove behaviour, the hold-time duplicate/cap check, and that detection/lock/capture are unchanged
+  - tests cover the holding-list accumulate/commit-on-close/Remove behaviour, the hold-time duplicate/cap check, the hint line on every host, and that detection/lock/capture are unchanged
@@ REQ-214, Notes
+  - amended by `ui-look-translation` (2026-10-02): the mockup's hint line (the first build's owner question 5; that build had none)
```

```diff
# PRD/sections/scan/README.md — new bullet directly after the "- Built: a top-right **count pill** holds…" bullet
+- Built: a one-line hint under the viewfinder, worded as the mockup's scanner
+  page words it, tells the player that held cards join their destination when
+  the scanner closes. (REQ-214, REQ-070)
```

```diff
# PRD/sections/screen-layout.md — Scan camera surface, Chrome row
-| Chrome | A square ✕ exit box sits above the camera's top-right corner on every host (accessible name "Exit scan"); the count pill (and, when open, its caution note) sits beneath it, non-overlapping; the opt-in Debug panel keeps its own bottom-left placement with a themed accent border (REQ-214) |
+| Chrome | A square ✕ exit box sits above the camera's top-right corner on every host (accessible name "Exit scan"); the count pill (and, when open, its caution note) sits beneath it, non-overlapping; the opt-in Debug panel keeps its own bottom-left placement with a themed accent border (REQ-214); when the mockup's scanner page carries the hint line, one line of static text sits under the camera frame in the mockup's position — text, not a control, never overlapping the camera frame, the count pill or the review list (REQ-214, REQ-070) |
```

- Verdict: accept
- Reason: Whatever the mockup's scanner page has is what we need: add its hint line in its words if it has one, add nothing if it does not. (owner, 2026-10-02)
---

## REQ-202 — Game Setup gets "Edit names ▾" and a "Done ›" bar (owner question 6)

**What this decides:** whether Life Tracker's Game Setup sheet tucks the player
name boxes behind an "Edit names ▾" toggle and gains a "Done ›" bar at its foot,
as the mockup draws it.

**In plain terms:** Game Setup is the Life Tracker sheet where players set the
player count (2–8), starting life and layout. Today every player's name box is
always showing (two to a row, each with its seat number), and the sheet closes
only with its ✕. The mockup puts the name boxes behind an "Edit names ▾" toggle
(closed when the sheet opens; tapping it shows them) and adds a "Done ›" bar at
the foot that closes the sheet. The older Life Tracker rules (REQ-081 and the
Life Tracker flow, FLOW-013) already describe names behind an "Edit names"
disclosure, so this brings the redesign back in line with them. Done saves
nothing extra — every Game Setup change already takes effect as it is made — and
✕, Escape and a tap outside still close the sheet. Every control, option,
default and range stays the same, and the life table itself is untouched.

**What happens if you say no:** the name boxes stay always visible and ✕ stays
the only close, as the first build made them. To take one change and not the
other, answer `edit` and name it.

- Recommendation (the intake's): match the mockup unless you say otherwise.

**Amendment set.** Grep, line level:

```
grep -rn "Edit names\|name fields\|Done ›\|Game Setup fits" PRD/sections | grep -v '^PRD/sections/decisions.md'
```

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:5071` (REQ-202 Notes, name fields) | amend |
| `life-tracker/README.md:93` (Built line, name fields) | amend |
| `screen-layout.md:223` (Life Tracker sheets) | amend (Game Setup clause) |
| `functional-requirements.md:1917` (REQ-081, "Edit names disclosure") | keep — already says this |
| `user-flows.md:294` (FLOW-013, "Edit names disclosure") | keep — already says this |
| `life-tracker/README.md:106` (Game Setup fits one phone screen) | keep |

Also amended, though not a grep hit: REQ-202's criterion that sheets keep
"every control, option, default and range unchanged" (it gains the two named
additions).

**Proposed diff.**

```diff
# PRD/sections/functional-requirements.md — REQ-202, Acceptance Criteria
   - `lib/lifeTracker/` state, persistence, commander-damage and counter values,
     day/night, and the one-way MTG Assistant seed are untouched; Game Setup,
     Reset / New Game and a player's Counters change only their presentation
     (the shared sheet, REQ-208), keeping every control, option, default and range
-    unchanged
+    unchanged, except that Game Setup's name fields sit behind an **Edit names ▾**
+    collapse (closed when the sheet opens) and the sheet gains a **Done ›** foot bar
+    that closes it; every Game Setup change still applies as it is made, and ✕,
+    Escape and a tap outside still close the sheet (REQ-081, FLOW-013)
@@ REQ-202, Notes
-    Players stepper (2-8) with name fields two to a row, each carrying its
+    Players stepper (2-8) with an **Edit names ▾** collapse (closed when the
+    sheet opens) holding the name fields two to a row, each carrying its
@@ REQ-202, Notes, end
+  - amended by `ui-look-translation` (2026-10-02): Game Setup's Edit names ▾ collapse and Done › foot bar, matching the mockup and REQ-081 / FLOW-013 (the first build's owner question 6)
```

```diff
# PRD/sections/life-tracker/README.md — ### Game Setup
-- Built: display names are edited in Game Setup's name fields — compact boxes
-  carrying the seat number, two to a row under the Players stepper. In-Depth
+- Built: display names are edited in Game Setup's name fields — compact boxes
+  carrying the seat number, two to a row behind an **Edit names ▾** collapse
+  under the Players stepper (closed when the sheet opens). A **Done ›** foot bar
+  closes the sheet. In-Depth
```

```diff
# PRD/sections/screen-layout.md — #### Player Life Tracker, row "Sheets" (line 223), clause
-Game Setup fits one phone screen;
+Game Setup fits one phone screen, with names behind an Edit names ▾ collapse and a Done › foot bar;
```

- Verdict: accept
- Reason: Edit names collapse and Done bar, as the mockup shows. (owner, 2026-10-02)
---

## REQ-082 — the Counters sheet becomes content-sized like every other sheet (owner question 7)

**What this decides:** whether a player's Counters panel in Life Tracker stops
filling the whole screen height and becomes a content-sized sheet like every
other sheet in the app.

**In plain terms:** tapping a player in Life Tracker opens their Counters: two
tabs, commander damage and the named counters (Monarch, Treasure, Poison and the
rest). Since 2026 that panel deliberately fills the full height of the screen —
a rule first recorded as DEC-139, now written in REQ-082 as "the panel's surface
fills the available shell height rather than sizing to its content" — and the
content-sized version was listed as a closed door. Every other sheet in the
redesign uses the shared sheet (REQ-208): a bottom sheet on phones narrower than
600px and a floating centred card from 600px up, sized to its content, with only
its body scrolling when it is long. The mockup draws Counters that way too. This
moves Counters onto that shared sheet. The two tabs and every counter, value,
range and control stay the same; only the panel's shape changes. Several places
restate the full-height rule (REQ-202, REQ-208, REQ-173, `screen-layout.md`, the
system map and the Life Tracker spec); this block amends each.

**What happens if you say no:** Counters keeps its full-height panel, as today,
and keeps differing from the mockup's sheet.

- Recommendation (the intake's): match the mockup unless you say otherwise.

**Amendment set.** Grep, line level:

```
grep -rn "DEC-139\|full-height\|full height" PRD/sections | grep -v '^PRD/sections/decisions.md'
```

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:1947` (REQ-082, full shell height) | amend |
| `functional-requirements.md:1954` (REQ-082 dependency on DEC-139) | keep — history; REQ-208 added |
| `functional-requirements.md:4075` (REQ-173, do not reopen the shape) | amend |
| `functional-requirements.md:4081` (REQ-173 dependency) | keep |
| `functional-requirements.md:5033` (REQ-202, full-height panel unaffected) | amend |
| `functional-requirements.md:5055` (REQ-202 dependency) | keep |
| `functional-requirements.md:5311` (REQ-208, counter panel keeps full height) | amend |
| `functional-requirements.md:3479` (REQ-142, scope of a past change) | keep — history |
| `functional-requirements.md:3507` (REQ-143 note on dismissal) | keep — history; outside-tap dismissal is unchanged |
| `screen-layout.md:103` (Shared sheet Notes) | amend (clause) |
| `screen-layout.md:222` (Life Tracker Fit) | amend (clause) |
| `screen-layout.md:223` (Life Tracker Sheets) | amend (Counters clause) |
| `screen-layout.md:224` (Life Tracker Notes) | amend |
| `system-map.md:543` (Life Tracker summary) | amend (clause) |
| `life-tracker/README.md:67`, `:69` (Built bullet at lines 64–68) | amend |
| `life-tracker/README.md:147`, `:148` (Measured bounds) | amend |
| `life-tracker/README.md:161` (closed door) | amend |
| `life-tracker/README.md:9`, `system-map.md:545` (Backed by lists) | keep — history |
| `screen-layout.md:89`, `:90`, `:121`, `functional-requirements.md:1599`, `:2118`, `:2794`, `:5270`, `shared-chrome/README.md:114`, `:418`, `:426`, `:470`, `goals-and-non-goals.md:44` | keep — the Menu tray and history drawer, unrelated |
| `functional-requirements.md:3386` (REQ-139) | keep — unrelated control |

**Proposed diff.**

```diff
# PRD/sections/functional-requirements.md — REQ-082, Acceptance Criteria
-  - the panel's surface fills the available shell height rather than sizing to its content, joining the Menu tray and history drawer's overlay family, and scrolls internally when its content exceeds that height (DEC-139)
-  - no dead scrim band remains above the panel at any player count
+  - the panel is hosted on the suite's shared sheet (REQ-208) and sized to its content like every other sheet — a bottom sheet below `600px` and a floating centred card from `600px` up, never taller than the viewport, with only its body scrolling when the content is taller; this replaces the former full-height overlay (DEC-139)
+  - its two tabs (Commander damage · Counters) and every counter, value, range and control are unchanged (REQ-202)
@@ REQ-082, Dependencies
   - REQ-112
+  - REQ-208
@@ REQ-082, Notes
+  - amended by `ui-look-translation` (2026-10-02): the content-sized shared sheet replaces the full-height overlay, matching the mockup (the first build's owner question 7)
```

```diff
# PRD/sections/functional-requirements.md — REQ-173, Constraints
-  - do not reopen the counter-panel overlay/tray shape (DEC-139) — change only the matrix arrangement inside the panel, never its height or overlay treatment
+  - do not reopen the counter-panel overlay/tray shape — change only the matrix arrangement inside the panel, never its height or overlay treatment (this bound REQ-173's own change; the panel's shape is now REQ-082's content-sized shared sheet)
```

```diff
# PRD/sections/functional-requirements.md — REQ-202, Acceptance Criteria
-  - Life Tracker's one-screen fit at every supported player count (DEC-136) and
-    its full-height counter panel (DEC-139) are unaffected
+  - Life Tracker's one-screen fit at every supported player count (DEC-136) is
+    unaffected; a player's Counters panel is the content-sized shared sheet
+    (REQ-082 as amended)
```

```diff
# PRD/sections/functional-requirements.md — REQ-208, Acceptance Criteria
-  - View Context keeps its own bottom sheet / right drawer at the `768px` boundary (REQ-135), and Life Tracker's counter panel keeps its full-height overlay (DEC-139)
+  - View Context keeps its own bottom sheet / right drawer at the `768px` boundary (REQ-135); Life Tracker's counter panel is hosted on this shell (REQ-082 as amended)
```

```diff
# PRD/sections/screen-layout.md — #### Shared sheet, row "Notes" (line 103), clause
-Life Tracker's counter panel keeps DEC-139
+Life Tracker's counter panel is hosted here too (REQ-082)
@@ #### Player Life Tracker, row "Fit" (line 222), clause
-counter panel is full-height overlay (DEC-139)
+the counter panel is the content-sized shared sheet (REQ-082, REQ-208)
@@ #### Player Life Tracker, row "Sheets" (line 223), clause
-a player's Counters panel keeps its full-height overlay (DEC-139) with two tabs
+a player's Counters panel is the content-sized shared sheet (REQ-082, REQ-208) with two tabs
@@ #### Player Life Tracker, row "Notes" (line 224)
-| Notes | DEC-101, DEC-136, DEC-139 |
+| Notes | DEC-101, DEC-136, DEC-139 (retired by REQ-082 as amended), REQ-082 |
```

```diff
# PRD/sections/system-map.md — Life Tracker summary (line 543), clause
-a full-height counter-panel overlay (DEC-139)
+a content-sized shared-sheet counter panel (REQ-082, REQ-208)
```

```diff
# PRD/sections/life-tracker/README.md
-- Built: the panel's surface fills the available shell height rather than
-  sizing to its content, joining the suite's Menu-tray/history-drawer
-  full-height overlay family, and scrolls internally when its content
-  exceeds that height. No dead scrim band remains above it at any player
-  count. (DEC-139)
+- Built: the panel is the suite's shared sheet (REQ-208), sized to its content:
+  a bottom sheet below `600px`, a floating centred card from `600px` up, with
+  only its body scrolling when the content is taller. (REQ-082)
@@ ## Measured bounds
-- The counter panel is full-height with no dead scrim band at any player
-  count (DEC-139).
+- The counter panel is the content-sized shared sheet, never taller than the
+  viewport (REQ-082, REQ-208).
@@ ## Rejected alternatives and deferred scope
-- **Content-sized bottom-sheet counter panel (original DEC-101 shape) —
-  closed door.** DEC-139 replaced it with the full-height overlay family
-  described in **How it works**, above.
+- **Full-height counter panel (DEC-139) — retired.** The content-sized shared
+  sheet (REQ-082 as amended by `ui-look-translation`, matching the direction-1
+  mockup) replaced it; the content-sized shape returned on the suite's shared
+  sheet rather than a bespoke bottom sheet.
```

- Verdict: accept
- Reason: Content-sized Counters sheet, as the mockup shows; the earlier full-height decision is knowingly reopened. (owner, 2026-10-02)