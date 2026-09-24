# GATE QUESTIONS — ui-reimagining

**What you need to do:** for each block below, fill in `- Verdict:` with
`accept`, `edit`, or `reject`, and `- Reason:` whenever you edit or reject. Then
merge the docs PR. That merge starts the build.

Seventeen blocks: six new requirements, eleven amendments to rules that would
otherwise forbid the redesign you asked for. Nothing here is written into
`PRD/sections/` yet — the build applies whatever you approve.

Every number in these diffs was measured in the running app on 2026-09-24. The
full measurement record is in `DESIGN-BRIEF.md`.

---

## REQ-200 — the mana colour you pick becomes the whole screen, not just the buttons

**What this decides:** whether the White / Blue / Black / Red / Green /
Colorless colour a player picks in the Menu drives the entire surface — the
background wash behind everything, the fill and edge of every panel, the ring
around whatever they are typing in, the waiting panel while the AI thinks, and
the card-detail popup — or stays what it is today, a tint on buttons and the
wordmark.

**In plain terms:** today six palettes each set four colour slots — a main
accent, a stronger one, a softer one, and the text colour that sits on a filled
accent button (that is `REQ-099`'s "four-token" system). Everything else is
hard-coded near-black zinc: the page background is fixed at
`linear-gradient(135deg, #09090B, #18181B, #09090B)` no matter which colour you
pick, because two existing rules require exactly that (`REQ-046` and `REQ-060`
both say the page background stays "palette-agnostic slate and is not
palette-tinted"). This requirement replaces those four slots with one named set
of surface roles — ground, raised panel, panel edge, colour wash, focus ring,
text — so picking Red actually makes the app read red. The intensity is bounded
by what is measured today, not by taste: body text keeps at least 14.37:1
contrast (today's worst measured pairing, `#E2E8F0` on `#18181B`), accent text
keeps at least 6.19:1 (today's worst, Red's `accent-soft` on the darkest
background stop), and text on a filled accent button keeps at least 5.42:1
(today's worst, Green). Token names carry no "dark" in them and no component
hard-codes a zinc value, so a light theme can be added later without a second
redesign — this pass ships dark values only. (New; amends `REQ-046`,
`REQ-060`, `REQ-099`, `NFR-011`, `FLOW-007`, all below.)

**What happens if you say no:** the palette stays a button tint, the background
stays fixed zinc for all six colours, and the app keeps reading as a plain dark
form — the thing your UX-engineer friend called generic.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ (new entry, inserted in numeric order after REQ-199)
+### REQ-200
+- Title: A theme built around the chosen colour
+- Priority: high
+- Description: The selected colour profile is the basis of a restrained theme,
+  not a fill layered on top of the existing surface. One authoritative token
+  set replaces the four-token accent-only contract with named surface roles —
+  page ground, raised panel fill, panel edge, colour wash, focus ring, and
+  text — each supplied per profile, so choosing White, Blue, Black, Red, Green,
+  or Colorless visibly changes the background wash, surface edges, focus rings,
+  the Ask AI waiting panel, and the card-detail popup across shared chrome,
+  Quick Question, In-Depth Question, and Trade Balancer, at a restrained
+  intensity that keeps neutral surfaces (ground and panel fills) the visual
+  majority in every profile and readability the first constraint. Dark values
+  only in this pass; the token roles are named without reference to dark or
+  light so a light theme is additive later rather than a second redesign.
+- Acceptance Criteria:
+  - the token set covers at least these roles and every in-scope surface reads
+    its colour from them rather than from a hard-coded zinc/slate value: page
+    ground, colour wash over the ground, raised panel fill, panel edge, focus
+    ring, primary text, muted text, and the filled-accent text pairing carried
+    over from REQ-099
+  - each of the six profiles supplies its own values for every role; switching
+    profile through FLOW-007 visibly changes the background wash, at least one
+    panel edge, the focus ring, the waiting panel, and the card-detail popup
+    without resetting destination or workflow state
+  - the wash stays restrained: neutral ground and panel fills remain the visual
+    majority of every screen in every profile; the profile colour reads as a
+    wash, edges, rings, and accents, never as a dominant fill
+  - measured contrast floors hold in all six profiles, at 390x844 and 1440x900,
+    against the darkest and lightest point of that profile's wash: primary body
+    text at least 14.37:1, accent text (`accent-soft` role) at least 6.19:1, and
+    the filled-accent text pairing at least 5.42:1. These are the values measured
+    in the shipped app on 2026-09-24 (`#E2E8F0` on `#18181B` = 14.37:1; Red
+    `accent-soft` `#FF4D6D` on `#09090B` = 6.19:1; Green `accent-contrast`
+    `#FFFFFF` on `accent` `#0A7A42` = 5.42:1) and are floors, not targets
+  - the wash never goes fully black: its darkest point stays at or above the
+    measured `#09090B` luminance, so the app survives a bright game store
+  - deliberately uncorrected custom Colorless RGB (REQ-099) stays exempt from the
+    contrast floors, exactly as it is today
+  - no token name encodes a theme mode, and no in-scope component hard-codes a
+    zinc/slate colour value; adding a light theme later requires new values for
+    the existing roles and no new component work
+  - tests cover the token set resolving per profile, one re-themed surface per
+    in-scope flow, and the measured contrast floors across all six profiles;
+    the Life Tracker inheritance and its screenshot-pair review are REQ-202's
+    gate, not this entry's
+- Constraints:
+  - one authoritative frontend source for the token set; no duplicated colour
+    constants, no per-component theme overrides, no per-flow palettes
+  - CSS/token plumbing and basic React state only; no theming framework, no
+    generated contrast engine, no runtime colour derivation beyond what the
+    profile values already declare
+  - presentation only; no change to `AskAiRequest`, Zod schemas, `GameContext`,
+    prompt assembly, providers, backend routes, card metadata, scan
+    matching/stabilizer logic, stack ordering, or the data pipeline
+  - dark values only in this pass; this requirement defines no light-theme values
+    and does not add a theme-mode control
+  - no Wizards of the Coast mana glyphs, icon font, logos, or card art (REQ-201)
+  - card-identity rings stay derived from card colours and independent of the
+    profile (REQ-058)
+- Dependencies:
+  - REQ-044
+  - REQ-046
+  - REQ-060
+  - REQ-099
+  - REQ-201
+  - REQ-202
+  - NFR-001
+  - NFR-006
+  - NFR-011
+  - FLOW-007
+- Notes:
+  - supersedes the palette-agnostic-background rule asserted in REQ-046's
+    description and criteria, REQ-060's criteria, REQ-099's constraints, and
+    NFR-011's constraints; each is amended in place rather than retired
+  - the current-state `Built:` lines that still describe the neutral background
+    are accurate until the code ships and are updated by the code slice, not by
+    this entry: `sections/scan/README.md` (scan background stays neutralized),
+    `sections/shared-chrome/README.md` (no palette-tinted page background;
+    composer ambient treatment), `sections/in-depth/README.md` (slim brand
+    block), and `sections/system-map.md`'s Theme entry
+  - the contrast floors are measured current behaviour, not new quality targets:
+    the redesign may not make any of the three worse than it is today
```

```diff
--- a/PRD/sections/goals-and-non-goals.md
+++ b/PRD/sections/goals-and-non-goals.md
@@ line 41
-- predefined browser-local palette personalization hosted in the feature-portal Menu (DEC-066, DEC-110, REQ-044)
+- predefined browser-local palette personalization hosted in the feature-portal Menu, the basis of a restrained theme across the app surface — background wash, panel fills and edges, focus rings, waiting panel, card-detail popup — through one named token set, with neutral surfaces kept the visual majority (DEC-066, DEC-110, REQ-044, REQ-200)
@@ line 80
-- arbitrary theme color input outside the Colorless-only custom RGB exception in DEC-119/REQ-099, per-component theme overrides, server-synced theme preferences, account-based theme settings, and dark/light mode redesign for theme customization (DEC-066, DEC-119)
+- arbitrary theme color input outside the Colorless-only custom RGB exception in DEC-119/REQ-099, per-component theme overrides, server-synced theme preferences, and account-based theme settings (DEC-066, DEC-119). A **light theme** is no longer excluded outright: REQ-200 names theme-mode-agnostic token roles so light values can be added later, and this pass ships dark values only and adds no theme-mode control
```

```diff
--- a/PRD/sections/system-map.md
+++ b/PRD/sections/system-map.md
@@ line 221 (### Theme settings — Summary)
-Palette reach extends beyond primary-accent surfaces to the page background end-stop (neutralized to slate, not palette-tinted), previously-fixed semantic green states, and the camera scanner UI.
+Palette reach extends beyond primary-accent surfaces to previously-fixed semantic green states and the camera scanner UI. **REQ-200** extends it further to a restrained theme across the surface through one named token set — page ground, colour wash, raised panel fill, panel edge, focus ring, and text roles, with neutral surfaces kept the visual majority — so the page background is palette-driven rather than neutralized to slate; Life Tracker inherits every shared role like any other destination, reviewed by a before/after screenshot pair rather than pinned (REQ-202).
-static chrome, card-identity rings, and tuned scanner motion stay neutral/unchanged
+card-identity rings and tuned scanner motion stay unchanged; static chrome now reads the REQ-200 surface roles rather than staying neutral
```

- Verdict: edit
- Reason: the chosen colour is the basis of a theme, not a fill. It informs the background wash, panel edges, focus rings, waiting panel and card-detail popup at a restrained intensity, with neutral surfaces still the majority and readability the first constraint (the three measured contrast floors stand). Retitle from 'palette-driven surface system / drives the whole app surface' to 'a theme built around the chosen colour'; keep the one named token set and the per-profile roles, since they are what makes the theme buildable. Drop the acceptance criterion that excludes Life Tracker from the token roles (see REQ-202)

---

## REQ-201 — our own arcane motifs, no Wizards artwork

**What this decides:** whether the Magic feel comes from artwork we draw
ourselves — a sun, a drop, a skull, a flame, a tree, a diamond, re-expressed as
our own gradients, textures and icons — or from the official mana symbols.

**In plain terms:** the official glyphs are Wizards of the Coast property. Fan
projects ship them under the Fan Content Policy, which only covers free,
non-commercial use, so shipping them would close the commercial door forever.
You already chose our own motifs (intake D2). Today's product truth bans the
artwork as a side clause inside the palette requirement (`REQ-099` forbids
"Magic mana symbols/logos/card art"); this turns that ban into a positive brief:
each of the six colours gets a named motif language — White's warm gilded
authority, Blue's charged cyan energy, Black's decay with one hot glow, Red's
heat inside darkness, Green's forest at dusk, Colorless's bone-and-brass
artifact — expressed as our own assets, all local and static, with no external
font or art request at runtime. (New; keeps `REQ-099`'s artwork ban.)

**What happens if you say no:** the redesign has colour but no imagery, and the
per-colour character in the 86 reference images you collected goes unused.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ (new entry, after REQ-200)
+### REQ-201
+- Title: Original per-colour motif kit
+- Priority: medium
+- Description: The app's Magic character must come from original motifs drawn
+  for this product, never from Wizards of the Coast artwork. Each of the six
+  colour profiles carries a named motif language — shape, texture, and glow
+  behaviour — used for background texture, iconography, empty-state art, and the
+  brand mark, so a profile reads as its colour's character and not only as its
+  hue.
+- Acceptance Criteria:
+  - each profile declares a motif language: White warm luminous authority (cream
+    and gold light, gilded filigree, tall verticals); Blue charged energy
+    (glowing cyan, lightning, vortices); Black decay with one hot accent
+    (charcoal ground, jagged organic edges); Red heat against darkness (one hot
+    red-orange light inside a dark field, a burst not a fill); Green forest at
+    dusk (deep mossy greens, pinpoint lime glow, vines and roots); Colorless
+    artifact (bone, brass and stone, one inner glow, inscribed bands)
+  - every motif asset ships from the repository as a local static file; no
+    runtime request to an external icon font, CDN, or art source
+  - motifs are decorative: no motif is the sole carrier of meaning, state, or an
+    action, and removing one leaves every control usable and labelled
+  - motifs respect `prefers-reduced-motion` through the existing CSS motion
+    baseline (NFR-006); no new motion trigger or timing system is introduced
+  - the brand mark may keep, adapt, or replace today's gradient text wordmark,
+    and whatever it becomes keeps the Easter-egg tap trigger (REQ-203)
+- Constraints:
+  - no official Wizards of the Coast mana symbol, icon font (including the
+    community Mana font), logo, set symbol, or card art ships, in any build or
+    any asset pipeline
+  - card art rendered from the existing card corpus is unaffected: this
+    requirement governs chrome and decoration, not card images
+  - presentation only; no change to request contracts, prompts, backend routes,
+    card metadata, or the data pipeline
+  - motif assets stay within today's frontend asset budget; no new font or art
+    ceiling is introduced and none is relaxed (NFR-013)
+- Dependencies:
+  - REQ-200
+  - REQ-058
+  - REQ-099
+  - NFR-006
+  - NFR-013
+- Notes:
+  - this makes REQ-099's "no Magic mana symbols/logos/card art" constraint a
+    positive brief rather than only a prohibition; the prohibition itself is
+    unchanged and stays enforceable
+  - the reference images that informed the six motif languages live in the work
+    package's `intake/inspiration/`; none of them is a shipped product asset
```

- Verdict: accept
- Reason: owner approved 2026-09-24 in session, taking the driver's recommendation

---

## REQ-202 — Life Tracker does not move by a single pixel, and every slice proves it

**What this decides:** whether "Life Tracker untouched" means pinned to today's
exact pixels, or inherits the new look and you approve each drift.

**In plain terms:** the Menu rail, the brand mark, the theme section, the
overlay close buttons, the card popup and the page shell are shared by every
destination, Life Tracker included. Any shared change reaches Life Tracker
unless it is pinned. You chose reading (a) — pixel-identical, with one
deliberate matching pass later if you want it (intake E1). This makes the pin a
requirement and gives it a test: Life Tracker renders bit-identical, and every
slice that touches shared chrome, the token set, or the shared stylesheet
attaches a screenshot comparison at phone and desktop width that must show
**zero** differing pixels. Zero is fair rather than harsh because it was
measured: three captures at 390x844 and two at 1440x900, across full page
reloads, differed by 0 pixels out of 329,160 and 0 out of 1,296,000. The
renderer is deterministic here, so one changed pixel is a real change, not
noise. (New; `DEC-136` keeps Life Tracker's one-screen fit, `DEC-139` its
full-height counter panel.)

**What happens if you say no:** Life Tracker drifts with the shared chrome, and
the one screen your UX-engineer friend said was fine changes along with
everything else.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ (new entry, after REQ-201)
+### REQ-202
+- Title: Life Tracker inherits shared chrome, reviewed by a screenshot pair at
+  every touching slice
+- Priority: high
+- Description: Player Life Tracker inherits shared chrome, the REQ-200 token
+  set, and shared stylesheet changes the same way every other destination
+  does — the menu rail, brand mark, theme section, overlays, and page shell.
+  Life Tracker's own screens, counters, layout, and `lib/lifeTracker/` state
+  are untouched by the redesign. Every slice that touches shared chrome, the
+  token set, or the shared stylesheet attaches a Life Tracker before/after
+  screenshot pair at 390x844 and 1440x900 to its PR, so the owner sees exactly
+  what changed before merging. There is no automated pixel-diff gate; the
+  owner's review on the PR is the check.
+- Acceptance Criteria:
+  - within the Life Tracker destination, shared chrome and every REQ-200
+    surface role resolve the same way they do everywhere else — no
+    destination-scoped override, no forked shared component, no pinned value
+  - any change to shared chrome, the REQ-200 token set, or the shared
+    stylesheet attaches a Life Tracker before/after screenshot pair at
+    390x844 and 1440x900 to its PR description, captured with the same
+    viewport, profile, reduced-motion setting, and starting tracker state
+  - the owner reviews the pair on the PR and approves or requests changes;
+    there is no automated diff threshold and no pixel count that blocks the
+    slice on its own
+  - Life Tracker's one-screen fit at every supported player count (DEC-136) and
+    its full-height counter panel (DEC-139) are unaffected
+  - `lib/lifeTracker/` state, persistence, the commander-damage matrix, the
+    counter palette, day/night, Game Setup, Reset/New Game, and the one-way MTG
+    Assistant seed are untouched by the redesign packages
+  - automated coverage asserts Life Tracker's own screens, counters, layout,
+    and `lib/lifeTracker/` state are unchanged by each redesign slice; the
+    shared-chrome inheritance itself is confirmed by the screenshot pair, not
+    by an automated pixel assertion
+- Constraints:
+  - Life Tracker must not fork a shared component or add a per-destination
+    override; it consumes shared chrome and the token set exactly as every
+    other destination does
+  - no Life Tracker behaviour, copy, layout, or state change of any kind in the
+    redesign packages
+  - the screenshot pair is a PR review attachment, not a CI job: it does not
+    enter `npm run quality:check`, cannot block a merge automatically, and
+    cannot fail an unrelated build
+- Dependencies:
+  - REQ-200
+  - DEC-136
+  - DEC-139
+  - REQ-081
+  - NFR-001
+- Notes:
+  - shared chrome changes reach Life Tracker automatically as each slice
+    ships, reviewed by the screenshot pair; there is no separate deferred
+    pass for shared chrome. Life Tracker's own screens remain a distinct,
+    not-yet-scheduled redesign, same as before
+  - the baseline captures taken during refinement live in the work package's
+    git-ignored `.playwright-mcp/` folder; each build slice captures its own
+    before/after pair at merge time for the PR review, not as an automated
+    pixel-diff gate
```

- Verdict: edit
- Reason: Life Tracker inherits shared chrome changes (menu rail, brand mark, theme section, overlays, page shell) rather than pinning them. Its own screens, counters, layout and lib/lifeTracker/ state are untouched. Every slice that touches shared chrome, the token set, or the shared stylesheet attaches a Life Tracker before/after screenshot pair at 390x844 and 1440x900 to its PR for the owner to review; there is no zero-pixel gate. Retitle accordingly and rewrite the criteria around the review pair, not the pin

---

## REQ-203 — ten taps on the brand mark anywhere reveals the cat wizard everywhere

**What this decides:** whether the cat-wizard Easter egg stays reachable only on
the In-Depth game-context step, or spreads to every screen in the redesign, with
one shared tap count.

**In plain terms:** today, tapping the `TheJudge` title ten times on the
In-Depth game-context step reveals a cat-wizard picture for the rest of the
browser session (`REQ-056`, `DEC-076`). Nowhere else wires that tap. You asked
for it on every in-scope screen that shows the brand mark — Quick Question,
every In-Depth step and its answer, Trade Balancer — and the recommendation was
one session-wide count, so ten taps spread across different screens still add
up and the reveal then holds everywhere. Life Tracker keeps its own title and
stays out, as you said. Where the cat actually appears on a screen with no hero
slot is left to the mockup. Related and measured: that brand-mark button is
108x29 today, under the 44px touch floor — `REQ-205` fixes it, which makes the
egg easier to find by hand as a side effect. (New; amends `REQ-056`'s
game-context-only criterion and `REQ-045`'s note.)

**What happens if you say no:** the egg stays a single-screen secret and the
brand mark on the other screens is inert.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ (new entry, after REQ-202)
+### REQ-203
+- Title: Suite-wide brand-mark Easter egg
+- Priority: low
+- Description: The cat-wizard Easter egg must be reachable from the brand mark
+  on every in-scope screen, not only the In-Depth game-context step, driven by
+  one session-wide tap count shared across screens.
+- Acceptance Criteria:
+  - the brand mark is a tap target on every in-scope screen that shows it:
+    Quick Question pre-submit and answered, every In-Depth Question step and its
+    answered workspace, and Trade Balancer
+  - one session-wide count accumulates taps across screens; the tenth tap,
+    wherever it lands, reveals the cat wizard (`/assets/cats-homescreen.png`)
+    and the reveal then holds on every in-scope screen for the rest of the
+    browser session, surviving destination switches
+  - before the tenth tap the image is not in the document on any screen
+  - the reveal is session-only: a reload clears it, exactly as today
+  - Life Tracker shows the same redesigned brand mark as every other screen,
+    inherited as shared chrome (REQ-202), but is excluded from the tap count:
+    it wires no tap handler and never reveals the cat wizard on its own screen
+  - whatever the brand mark becomes visually (REQ-201) keeps this trigger
+  - the brand-mark tap target meets the 44px touch floor (REQ-205); a tap that
+    reveals nothing yet changes no other state and never navigates
+  - tests cover the shared count accumulating across two different screens, the
+    reveal holding after a destination switch, the reload clearing it, and Life
+    Tracker not participating
+- Constraints:
+  - presentation only; no change to step names, step ordering, flow logic,
+    request contracts, prompts, or backend behaviour
+  - the count is in-memory session state; it introduces no persisted key and
+    survives no reload
+  - no new asset: the existing `cats-homescreen.png` is reused
+- Dependencies:
+  - REQ-056
+  - REQ-201
+  - REQ-205
+  - DEC-076
+  - FLOW-001
+- Notes:
+  - where the cat appears on screens with no hero slot is a mockup decision,
+    deliberately not fixed here
+  - the egg is protected scope: it survives every mockup direction
```

```diff
--- a/PRD/sections/user-flows.md
+++ b/PRD/sections/user-flows.md
@@ line 10 (FLOW-001, Main Flow step 1)
-Turn phase and active player appear in one merged panel; the cat-wizard hero image is hidden until the user clicks the brand title 10 times on this step (session-only reveal).
+Turn phase and active player appear in one merged panel; the cat-wizard hero image is hidden until the user taps the brand mark 10 times, counted session-wide across every in-scope screen rather than only on this step (session-only reveal; REQ-203).
```

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ line 924 (REQ-045, Notes)
-  - refines header chrome only; the cat-wizard image is hidden by default on the game-context screen and revealed session-only after 10 brand clicks (DEC-076, REQ-056)
+  - refines header chrome only; the cat-wizard image is hidden by default and revealed session-only after 10 brand-mark taps counted across every in-scope screen (DEC-076, REQ-056, REQ-203)
```

- Verdict: accept
- Reason: owner approved 2026-09-24 in session, taking the driver's recommendation

---

## REQ-204 — on a phone, Trade Balancer's two sides become tabs

**What this decides:** whether a phone shows Side A and Side B stacked one above
the other, as today, or as two tabs you flip between.

**In plain terms:** the two-sides-stacked layout is the shipped rule, written
into the layout catalog and the Trade Balancer spec ("sides stack on phone").
Measured at 390x844 with both sides still empty, Side A's heading sits at y 305
and Side B's at y 529 — 224px per side spent before a single card is added, and
it only gets worse as a side fills. You asked for tabs on phone so each side
gets the room, and for desktop's side-by-side layout to stay exactly as it is
(intake A4). Nothing about pricing, printings, scanning, totals or the
difference readout changes — this is where the two sides sit, not what they do.
(New; amends the `screen-layout.md` Trade Balancer row and
`trade-balancer/README.md`'s layout bound; the feature itself is `REQ-064`.)

**What happens if you say no:** phone keeps stacking, and adding several cards
to one side keeps pushing the other side out of sight.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ (new entry, after REQ-203)
+### REQ-204
+- Title: Trade Balancer phone side tabs
+- Priority: medium
+- Description: Below the phone/tablet boundary the Trade Balancer presents Side A
+  and Side B as two tabs sharing one panel instead of stacking them vertically,
+  so each side gets the full shell width and height available. At and above the
+  boundary the paired side-by-side composition is unchanged.
+- Acceptance Criteria:
+  - below `768px` exactly one side's entry list, search, scan control, and side
+    total render at a time, selected by a two-tab control; at `768px` and above
+    both sides render side by side exactly as today
+  - the difference readout and both side totals stay visible in the first
+    viewport whichever tab is active, so the player never switches tabs to learn
+    the balance
+  - switching tabs preserves every entry, quantity, foil toggle, chosen printing,
+    and in-flight search on both sides; it fetches no price and re-fetches
+    nothing
+  - the inactive side's total updates live while hidden
+  - the tab control meets the 44px touch floor and is reachable by keyboard with
+    a visible focus ring (REQ-205, REQ-200)
+  - scan-onto-a-side, the printing picker's region scroll and `40vh` cap
+    (REQ-065), the price-freshness line (REQ-145), the warm-up ping, and the
+    ephemeral no-persistence posture are all unchanged
+  - no page scroll for totals or primary actions at 390x844 with either tab
+    active, with the entry list region-scrolling as today
+  - measured baseline this replaces (2026-09-24, 390x844, both sides empty):
+    Side A heading at y 305, Side B heading at y 529
+  - tests cover tab switching preserving both sides' state, both totals and the
+    difference staying visible, and the desktop composition being unchanged
+- Constraints:
+  - layout only — this is not a re-sequencing of the flow and adds no step; no
+    change to pricing, printing selection, scan input, totals arithmetic, the
+    price route, or the ephemeral state posture
+  - one fluid component tree, mobile-first CSS, a structural media query at the
+    existing `768px` boundary; no UA sniffing, JS device detection, or a second
+    desktop tree (DEC-117, NFR-011)
+- Dependencies:
+  - REQ-064
+  - REQ-065
+  - REQ-145
+  - REQ-205
+  - DEC-117
+  - DEC-149
+  - NFR-001
+  - FLOW-009
+- Notes:
+  - desktop's side-by-side layout is explicitly protected scope
+  - whether the tabs read as tabs, a segmented control, or a swipe pager is a
+    mockup decision; the state-preservation and visible-totals criteria bind
+    whichever form wins
```

```diff
--- a/PRD/sections/screen-layout.md
+++ b/PRD/sections/screen-layout.md
@@ #### Trade Balancer
-| Phone | Shell/full destination width; sides stack; lists region-scroll; primary totals visible without hunting |
+| Phone | Shell/full destination width; the two sides are **tabs sharing one panel**, not stacked (REQ-204) — one side's list, search, scan control and total render at a time, while both side totals and the difference stay visible whichever tab is active; lists region-scroll. Superseded geometry: vertically stacked sides, measured 2026-09-24 at 390x844 with both sides empty as Side A heading y 305 / Side B heading y 529, i.e. 224px per side before a card is added |
@@ | Notes |
-| Notes | DEC-087, DEC-145, REQ-145, REQ-065 |
+| Notes | DEC-087, DEC-145, REQ-145, REQ-065, REQ-204. Desktop/tablet paired sides are protected scope — the phone tab treatment must not reach the `768px`+ composition |
```

```diff
--- a/PRD/sections/trade-balancer/README.md
+++ b/PRD/sections/trade-balancer/README.md
@@ line 170 (Measured bounds)
-- Layout/fit: sides stack on phone and the entry lists region-scroll; totals and
+- Layout/fit: on phone the two sides are tabs sharing one panel (REQ-204 — not
+  yet built; the shipped build stacks them) and the entry lists region-scroll; totals and
   primary actions stay visible with no page scroll; desktop/tablet uses the
   shell width (92% / 48rem or destination equivalent) rather than unused
   ultra-wide bands, content-sized vertically. Mobile-first and touch-friendly.
   (`screen-layout.md`, NFR-001)
```

- Verdict: accept
- Reason: owner approved 2026-09-24 in session, taking the driver's recommendation

---

## REQ-205 — every control on the redesigned screens is big enough to tap

**What this decides:** whether the redesign also brings the controls that are
smaller than the app's own 44px minimum up to it.

**In plain terms:** the app already requires a 44px minimum touch target
(`NFR-001` mobile-first usability, `NFR-011`'s "touch-friendly across supported
viewports", and `REQ-101`'s explicit "at least 44x44px"). Walking the app at
390x844 on 2026-09-24 found ten controls below it, on screens this redesign is
already touching: Quick Question's card search (299x38) and Scan button
(299x38); In-Depth game context's brand mark (108x29 — the Easter-egg target),
turn-phase select (307x37), active-player select (307x37) and Confirm button
(333x40); zone confirmation's Back and Continue (160x42) and its zone checkbox
inputs (16x16, with the row label carrying the real hit area); and Trade
Balancer's per-side search (299x38) and Scan button (299x40). In-Depth zone
collection already clears the floor (search 223x44, Scan 67x44), so this is
reachable without a layout fight. No new number is invented — the floor already
exists and this brings the stragglers up to it. (New; enforces `NFR-001`,
`NFR-011`, `REQ-101`.)

**What happens if you say no:** the app keeps ten below-floor controls on the
very screens being redrawn, and the redesign would be re-opening each of those
layouts later to fix them.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ (new entry, after REQ-204)
+### REQ-205
+- Title: Touch-floor conformance on the re-imagined screens
+- Priority: medium
+- Description: Every interactive control on the re-imagined screens must meet the
+  app's existing 44px minimum touch target. This closes the measured gap on
+  shared chrome, Quick Question, In-Depth Question, and Trade Balancer; it
+  introduces no new number.
+- Acceptance Criteria:
+  - at 390x844 every interactive control on shared chrome, Quick Question
+    (pre-submit and answered), every In-Depth Question step and its answered
+    workspace, and Trade Balancer measures at least 44px in its smaller
+    dimension, or sits inside a labelled hit area that does
+  - the measured 2026-09-24 offenders each clear the floor after the change:
+    Quick Question card search input (was 299x38), Quick Question Scan button
+    (was 299x38), In-Depth brand-mark button (was 108x29), turn-phase select
+    (was 307x37), active-player select (was 307x37), Confirm game context (was
+    333x40), zone confirmation Back and Continue (were 160x42), zone checkbox
+    row hit area (input was 16x16), Trade Balancer per-side search input (was
+    299x38), Trade Balancer per-side Scan button (was 299x40)
+  - growing a control does not push its screen's primary action out of the first
+    viewport (REQ-129) or introduce page scroll where there is none today
+  - controls already at or above the floor keep their size — In-Depth zone
+    collection's search row (223x44 input, 67x44 Scan, REQ-125/DEC-050) and the
+    corner-rail zones (44x44 each, REQ-114) are unchanged
+  - keyboard focus rings remain visible on every enlarged control (REQ-200)
+  - Life Tracker is out of scope (REQ-202)
+  - automated coverage asserts the floor for the named controls
+- Constraints:
+  - presentation only; no control is removed, merged, relabelled in meaning, or
+    moved to a different step to buy room
+  - no change to the 44px value itself and no new accessibility target
+  - hit area may exceed the painted affordance only where the label is visibly
+    part of the control; suite chrome's painted-equals-interactive rule
+    (REQ-114) is unchanged
+- Dependencies:
+  - NFR-001
+  - NFR-011
+  - REQ-101
+  - REQ-114
+  - REQ-125
+  - REQ-129
+  - REQ-200
+  - REQ-203
+- Notes:
+  - measured live at 390x844 on 2026-09-24 in the shipped app; the sizes above
+    are the baseline this requirement closes, not targets
+  - the brand-mark entry also makes the REQ-203 Easter-egg trigger comfortably
+    tappable
```

- Verdict: accept
- Reason: owner approved 2026-09-24 in session, taking the driver's recommendation

---

## REQ-044 — allow the token set to be light-theme-ready

**What this decides:** whether the palette requirement keeps forbidding anything
that looks like a light/dark theme redesign.

**In plain terms:** `REQ-044` is the requirement that gives you the Theme
section in the Menu: pick a colour, it applies immediately and is remembered for
that browser. One of its constraints bans "dark/light mode redesign" outright.
The redesign ships dark values only, but it names the token roles without a mode
in them so light values can be added later without redrawing the app — and that
is exactly what you agreed to (intake E5). The constraint has to yield on
light-readiness only; everything else about it stays. (Amends `REQ-044`, which
also depends on `REQ-099`'s six-profile catalog.)

**What happens if you say no:** the redesign must hard-code dark values, and a
light theme later means a second full redesign pass.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ line 884 (REQ-044, Acceptance Criteria)
-  - selecting a palette immediately restyles primary accent surfaces such as primary buttons, active controls, focus/selection accents, badges, and prominent status highlights
+  - selecting a palette immediately restyles primary accent surfaces such as primary buttons, active controls, focus/selection accents, badges, and prominent status highlights; REQ-200 extends the same immediate restyle to the whole surface — background wash, panel fills and edges, focus rings, waiting panel, card-detail popup
@@ line 891 (REQ-044, Constraints)
-  - arbitrary RGB input is permitted only for Colorless under REQ-099; no per-component theme overrides, server-synced preferences, accounts, or dark/light mode redesign
+  - arbitrary RGB input is permitted only for Colorless under REQ-099; no per-component theme overrides, server-synced preferences, or accounts. No theme-mode control and no light-theme values ship in this pass; REQ-200's token roles are named without a theme mode so light values can be added later without a second redesign
@@ REQ-044 Notes
   - DEC-119 / REQ-099 supersede the former predefined catalog and no-arbitrary-color constraint while preserving this requirement's global-control, immediate-apply, persistence, and state-preservation behavior
+  - REQ-200 supersedes this requirement's accent-only reach: one palette choice now drives the whole surface through a named token set, and the "no dark/light mode redesign" constraint narrows to "no theme-mode control and no light values in this pass"
```

- Verdict: accept
- Reason: owner approved 2026-09-24 in session, taking the driver's recommendation

---

## REQ-046 — the page background may now carry the colour

**What this decides:** whether the rule that deliberately drained colour out of
the page background still stands.

**In plain terms:** `REQ-046` is the pass that broadened the palette beyond
buttons — it re-themed the semantic green states, the scanner accents — and at
the same time it **neutralised** the page background on purpose, to a "palette-
agnostic slate" that must not bias toward any colour. It also forbids adding
token roles beyond the four, forbids palette-tinted backgrounds, and states
"static neutral slate chrome stays neutral by design". Every one of those is the
opposite of what you asked for in intake D3. This amendment records that the
neutral backdrop was the right call for that pass, and that `REQ-200` now
supersedes it; the `REQ-046` work itself (green states, scanner accents, single
source of colour truth) stays in force. (Amends `REQ-046`; superseded by
`REQ-200`.)

**What happens if you say no:** `REQ-200` contradicts live product truth, and
the background stays zinc no matter which colour is picked.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ line 930 (REQ-046, Description)
-- Description: The frontend must broaden the reach of the existing single-color palette personalization (REQ-044) so one palette choice produces a coherent themed experience: remaining hardcoded primary-accent surfaces, the previously-fixed semantic green states, and the camera scanner UI all respond to the selected palette, while the dominant page background is neutralized to a palette-agnostic slate backdrop.
+- Description: The frontend must broaden the reach of the existing single-color palette personalization (REQ-044) so one palette choice produces a coherent themed experience: remaining hardcoded primary-accent surfaces, the previously-fixed semantic green states, and the camera scanner UI all respond to the selected palette. This requirement also neutralized the dominant page background to a palette-agnostic slate backdrop; **REQ-200 supersedes that half** — the background is now palette-driven through a named token set. The semantic-state and scanner reach below is unchanged.
@@ line 932 (REQ-046, Acceptance Criteria)
-  - the page background gradient on every staged screen and the answered view no longer uses a hardcoded blue end-stop; the backdrop is a neutral slate that does not visibly bias toward any palette and is not palette-tinted
+  - the page background gradient on every staged screen and the answered view no longer uses a hardcoded blue end-stop. The "neutral slate that does not visibly bias toward any palette and is not palette-tinted" half is **superseded by REQ-200**, which makes the background wash palette-driven within measured contrast floors; what survives here is that no single palette's hue is hardcoded into the background
@@ line 940 (REQ-046, Constraints)
-  - reuse the existing four palette tokens (`accent`, `accent-strong`, `accent-soft`, `accent-contrast`); do not add token roles; fixed values remain authoritative in REQ-099
+  - reuse the palette token set; fixed values remain authoritative in REQ-099. The "do not add token roles" clause is **superseded by REQ-200**, which replaces the four-token contract with one authoritative named set of surface roles — still a single source, still no per-component override
@@ line 943 (REQ-046, Constraints)
-  - arbitrary RGB input is permitted only for Colorless under REQ-099; no per-component theme overrides, palette-tinted backgrounds, server-synced preferences, accounts, dark/light mode redesign, or theming-framework migration
+  - arbitrary RGB input is permitted only for Colorless under REQ-099; no per-component theme overrides, server-synced preferences, accounts, or theming-framework migration. Palette-driven backgrounds are now permitted and bounded by REQ-200's measured contrast floors; no theme-mode control or light-theme values ship in this pass
@@ line 944 (REQ-046, Constraints)
-  - static neutral slate chrome stays neutral by design; DEC-081 / REQ-060 permits restrained palette-derived treatment only on REQ-060's closed minimum surface inventory
+  - the "static neutral slate chrome stays neutral by design" rule and REQ-060's closed surface inventory are **superseded by REQ-200**: static chrome now reads the REQ-200 surface roles. Card-identity rings (REQ-058) stay outside the profile; Life Tracker (REQ-202) inherits the profile through shared chrome like every other destination, reviewed by a screenshot pair rather than pinned
@@ REQ-046 Dependencies
   - DEC-050
+  - REQ-200
@@ REQ-046 Notes
   - scanner inclusion is an approved exception to DEC-050's separate scoping for presentation tokens only; it does not alter scan capture, matching, or lock behavior
+  - amended for the `ui-reimagining` pass (2026-09-24): REQ-200 supersedes the palette-agnostic-background half and the four-token-only constraint. The neutral backdrop was deliberate for this pass and is recorded here rather than deleted, so the reversal is auditable
```

- Verdict: accept
- Reason: owner approved 2026-09-24 in session, taking the driver's recommendation

---

## REQ-060 — the colour is no longer restricted to a fixed list of surfaces

**What this decides:** whether the palette's reach stays limited to one closed
list of surfaces, with everything else neutral.

**In plain terms:** `REQ-060` is the "restrained ambient accents" pass. It named
an exhaustive list of surfaces that may carry a faint palette glow — the player-
count row, zone option rows, zone tabs, the enrichment containers, the View
Context trigger, the follow-up composer — and said everything outside that list
stays neutral, the page background stays "palette-agnostic slate and is not
palette-tinted", and no token role may be added. `REQ-200` replaces the closed
list with a surface system: the colour reaches everything in scope, at a measured
intensity. What survives from `REQ-060` is the part worth keeping — resting,
hover/focus, and selected/current intensities defined once in shared styling,
never hover alone as the carrier of state, and reduced motion honoured.
(Amends `REQ-060`; superseded by `REQ-200`.)

**What happens if you say no:** `REQ-200` contradicts live truth, and the colour
stops at the edge of a six-item list.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ line 1318 (REQ-060, Description)
-- Description: The frontend must make the selected theme palette feel cohesive across the four staged screens and the answered/conversation view by giving the closed minimum surface inventory below a faint palette accent at rest, strengthening it during hover/focus where interactive, and sustaining a stronger restrained treatment for selected/current states.
+- Description: The frontend must make the selected theme palette feel cohesive across the four staged screens and the answered/conversation view by giving the surface inventory below a faint palette accent at rest, strengthening it during hover/focus where interactive, and sustaining a stronger restrained treatment for selected/current states. **REQ-200 supersedes the "closed minimum inventory" half**: the palette now reaches every in-scope surface through a named token set, and the inventory below becomes the minimum that must carry the resting/enhanced/current hierarchy rather than a ceiling on reach.
@@ line 1329 (REQ-060, Acceptance Criteria)
-  - this inventory is exhaustive for REQ-060; surfaces outside it remain neutral unless another existing requirement, especially REQ-046, already themes them
+  - this inventory is the **minimum** that must carry the resting/enhanced/current hierarchy; it is no longer exhaustive. Surfaces outside it are themed by REQ-200's surface roles rather than left neutral
@@ line 1331 (REQ-060, Acceptance Criteria)
-  - the dominant page background remains palette-agnostic slate and is not palette-tinted
+  - the dominant page background is palette-driven under REQ-200, within its measured contrast floors; the former palette-agnostic-slate rule is superseded
@@ line 1337 (REQ-060, Constraints)
-  - reuse only the existing `accent`, `accent-strong`, `accent-soft`, and `accent-contrast` palette tokens; do not add token roles; fixed profile values remain authoritative in REQ-099
+  - reuse the authoritative palette token set; fixed profile values remain authoritative in REQ-099. The "do not add token roles" clause is superseded by REQ-200's named surface roles, which remain a single source with no per-component overrides
@@ REQ-060 Dependencies
   - REQ-097
+  - REQ-200
@@ REQ-060 Notes
-  - this defines ambient expression, not the palette model or selection mechanism; DEC-119/REQ-099 own the expanded catalog and Colorless interaction
+  - this defines ambient expression, not the palette model or selection mechanism; DEC-119/REQ-099 own the expanded catalog and Colorless interaction
+  - amended for the `ui-reimagining` pass (2026-09-24): REQ-200 supersedes the closed-inventory ceiling and the palette-agnostic background. The resting / enhanced hover-focus / selected-current hierarchy, the "hover is never the sole carrier of state" rule, and the reduced-motion behaviour all survive unchanged and now apply across the whole surface
```

- Verdict: accept
- Reason: owner approved 2026-09-24 in session, taking the driver's recommendation

---

## REQ-099 — the six profiles keep their values and gain surface roles

**What this decides:** whether the six-profile catalog keeps its three
prohibitions that block the redesign — no tinted background, no new token roles,
no light mode — while keeping the one that protects you, the artwork ban.

**In plain terms:** `REQ-099` is where the six colours are actually defined:
White, Blue, Black, Red, Green, Colorless in that order, Blue the default, each
with four exact hex values, plus Colorless's custom-RGB input and Reset. All of
that stays. Three of its constraints block `REQ-200` — it may not "tint the
neutral slate page background", may not "add token roles", and excludes "light
mode". The fourth, "no Magic mana symbols/logos/card art", is the licensing
protection you chose to keep, and it stays exactly as written and becomes
`REQ-201`'s positive brief. The existing four values per profile also stay
authoritative; the new surface roles are added per profile alongside them. Your
Colorless "artifact" answer (steel, brushed metal, a hint of warmth — intake D4)
lands in those new roles, not by changing Colorless's published hex values.
(Amends `REQ-099`; the Colorless artifact reading is expressed through
`REQ-200` roles and `REQ-201` motifs.)

**What happens if you say no:** `REQ-200` and `REQ-201` both contradict live
truth and cannot be built.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ line 2380 (REQ-099, Constraints)
-  - reuse the single authoritative four-token frontend theme system; do not add token roles, per-flow palettes, per-profile component overrides, or a generated theming/contrast engine
+  - reuse the single authoritative frontend theme system; no per-flow palettes, per-profile component overrides, or generated theming/contrast engine. The four-token restriction is **superseded by REQ-200**, which adds named surface roles to the same single source; each profile supplies values for the new roles alongside the four published above, which stay authoritative and unchanged
@@ line 2381 (REQ-099, Constraints)
-  - do not broaden REQ-060's closed ambient-surface inventory, tint the neutral slate page background, recolor card-identity rings, or change scanner behavior/motion
+  - do not recolor card-identity rings (REQ-058) or change scanner behavior/motion. REQ-200 supersedes the closed-inventory and untinted-background clauses: the surface is palette-driven within REQ-200's measured contrast floors
@@ line 2383 (REQ-099, Constraints)
-  - no per-player themes, Magic mana symbols/logos/card art, customization of the five fixed Magic profiles, custom-Colorless contrast guarantee, light mode, accounts, or server synchronization
+  - no per-player themes, Magic mana symbols/logos/card art (the licensing ban stays absolute — REQ-201 gives it a positive brief), customization of the five fixed Magic profiles, custom-Colorless contrast guarantee, accounts, or server synchronization. No theme-mode control and no light-theme values ship in this pass; REQ-200's roles are named so light values can be added later
@@ REQ-099 Dependencies
   - NFR-011
+  - REQ-200
+  - REQ-201
@@ REQ-099 Notes
   - the refinement comparison image is preview-only and is not a shipped product asset
+  - amended for the `ui-reimagining` pass (2026-09-24): REQ-200 adds surface roles per profile without changing any published hex value or the Colorless custom-RGB contract. Colorless's "artifact" reading — steel, brushed metal, a hint of warmth — is expressed through those new roles and REQ-201's motif language, not by editing Colorless's four published values
```

- Verdict: accept
- Reason: owner approved 2026-09-24 in session, taking the driver's recommendation

---

## REQ-124 — lift the "no theme, typography, or brand redesign" bar

**What this decides:** whether a constraint written to keep one small layout fix
narrow still forbids the redesign you are commissioning.

**In plain terms:** `REQ-124` is the desktop shell width change — it widened the
content column to `min(48rem, 92vw)` so paired controls have room, measured at
768px wide on a 1440px screen. To keep that change from sprawling, it carries
the constraint "no theme, typography, or brand redesign". That constraint was
about its own pass, not a standing ban, but it reads as one, so it gets an
explicit carve-out. The width cap itself, and its measurement, stay untouched.
(Amends `REQ-124`; width cap unchanged.)

**What happens if you say no:** a constraint from a width fix blocks the whole
redesign on a technicality.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ line 2987 (REQ-124, Constraints)
-  - no theme, typography, or brand redesign
+  - no theme, typography, or brand redesign **as part of this width change** — the constraint scopes REQ-124's own pass and is not a standing ban; REQ-200 / REQ-201 own the theme, typography, and brand-mark redesign and must not change this requirement's measured shell width cap
@@ REQ-124 Notes
   - width was chosen by comparing to-scale mocks of 42/48/64/90rem; rendered CTA width, not percentage of viewport filled, was the deciding measure
+  - amended for the `ui-reimagining` pass (2026-09-24): the "no theme/typography/brand redesign" constraint is scoped to this requirement's own change. The `min(48rem, 92vw)` cap and its 768px-at-1440px measurement are unchanged and still bind the redesign
```

- Verdict: accept
- Reason: owner approved 2026-09-24 in session, taking the driver's recommendation

---

## REQ-129 — Send Request must stay on screen when several cards are attached

**What this decides:** whether the "everything important fits the first screen"
rule counts the whole Quick Question page, or only each card image on its own.

**In plain terms:** `REQ-129` is the rule that however big card images get, the
screen's main button must still be reachable without scrolling past it. When
Quick Question gained multi-card attachment (`REQ-167`), the layout catalog
recorded an explicit trade: each image stays capped, so stacking several of them
necessarily makes the page longer, and that was accepted as "not a new
violation". Measured on 2026-09-24 at 390x844 with just **two** cards attached:
the page is 1159px tall against an 844px viewport and **Send Request sits 179px
below the fold**. That is precisely the friction you reported (intake A2.1), so
the accepted trade is reversed: with up to the full five cards attached, the
composer and Send Request must stay in the first viewport, which means the
attached cards become a bounded strip rather than a vertical stack. (Amends
`REQ-129` and the `screen-layout.md` Quick Question pre-submit row; the 5-card
cap is `REQ-167`, the container-relative sizing is `DEC-160`.)

**What happens if you say no:** attaching a second card keeps pushing Send
Request off the bottom of the phone screen.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ REQ-129 Acceptance Criteria
-  - In-Depth Enrichment and Quick Question pre-submit card surfaces do not force page scroll solely because of card image size
+  - In-Depth Enrichment and Quick Question pre-submit card surfaces do not force page scroll solely because of card image size
+  - on Quick Question pre-submit at 390x844, the composer and **Send Request** stay inside the first viewport (`bottom` no greater than 844px) with **every permitted number of attached cards up to the REQ-167 cap of five**, not only with one. Measured baseline this replaces (2026-09-24): with two cards attached the document measured 1159px against an 844px viewport and Send Request sat at `top` 1023 / `bottom` 1067, 179px below the fold. The per-image cap is not the fix — the attached-card list becomes a bounded region (a strip and/or a region-scrolled list) so total attached-card height stops growing with the card count
@@ REQ-129 Dependencies
   - NFR-001
+  - REQ-167
+  - REQ-204
@@ REQ-129 Notes
   - **amended during the `ui-review` pass (2026-08-06)**: originally titled "Compact card images for first-viewport fit" and framed as a smallness mandate, which DEC-160 retires — a 92×128px image on every surface at every viewport width was the defect REQ-141 exists to fix. The behavioral criteria are unchanged and now serve as the ceiling on growth rather than as a floor on shrinking.
+  - **amended during the `ui-reimagining` pass (2026-09-24)**: the multi-card consequence the layout catalog accepted on 2026-08-30 — "the page now scrolls past the composer with 2+ cards attached … an accepted consequence of the per-image cap holding" — is reversed. It was measured again live and is the owner-reported friction. The ceiling now binds the pre-submit page as a whole at the full five-card cap, not each image in isolation.
```

```diff
--- a/PRD/sections/screen-layout.md
+++ b/PRD/sections/screen-layout.md
@@ #### Quick Question — pre-submit
-| Phone | Shell 100% width band; content-sized vertically (DEC-145); each attached card image sizes to the content column (DEC-160) — a clear majority of column width, replacing the 92×128px `max-h-32` render — with the corner detail popup for metadata (DEC-151/DEC-158); only **Remove card** beside/below each image (REQ-133); primary fields and **Send Request** submit in first viewport when practical; topics/lists may region-scroll |
+| Phone | Shell 100% width band; content-sized vertically (DEC-145); each attached card image sizes to the content column (DEC-160) — with the corner detail popup for metadata (DEC-151/DEC-158); only **Remove card** beside/below each image (REQ-133); **the attached-card list is a bounded region — a horizontal strip and/or region-scrolled list — so total attached-card height does not grow with the card count (REQ-129 as amended, REQ-167's 5-card cap)**; primary fields and **Send Request** stay in the first viewport at every attached-card count up to five; topics/lists may region-scroll |
@@ | Fit | (appended to the existing measured-bound paragraph)
-Stacking multiple capped images necessarily grows total document height, so the page now scrolls past the composer with 2+ cards attached — an accepted consequence of the per-image cap holding, not a new violation: REQ-129 bounds each image's height, not the page's total length, and Send Request/the composer stay reachable by scrolling exactly as any tall pre-submit content already does. No new cap value is introduced. |
+Stacking multiple capped images necessarily grows total document height, so the page scrolled past the composer with 2+ cards attached. **That consequence is withdrawn by the `ui-reimagining` pass (REQ-129 as amended, 2026-09-24):** re-measured live at 390×844 with two cards attached, the document was 1159px against an 844px viewport and Send Request sat at `top` 1023 / `bottom` 1067 — 179px below the fold, which is the owner-reported friction, not an acceptable trade. The bound is now on the attached-card **region**, not each image: the list becomes a bounded strip and/or region-scrolled list so Send Request's `bottom` stays ≤ 844px at 390×844 with up to five cards attached. The per-image `25dvh` / `42dvh` host-row cap is unchanged; no per-surface component variant or reinstated `max-h-32` is introduced. |
@@ | Notes |
-| Notes | DEC-107, DEC-145, DEC-146, DEC-151, DEC-153, DEC-158, DEC-160, REQ-132, REQ-133, REQ-141, REQ-167, REQ-174, FLOW-024.
+| Notes | DEC-107, DEC-145, DEC-146, DEC-151, DEC-153, DEC-158, DEC-160, REQ-129, REQ-132, REQ-133, REQ-141, REQ-167, REQ-174, REQ-200, FLOW-024.
```

- Verdict: accept
- Reason: owner approved 2026-09-24 in session, taking the driver's recommendation

---

## REQ-130 — a filled zone should show more than two cards at a time

**What this decides:** how many added cards a zone's strip shows at once on a
phone.

**In plain terms:** you remembered cards getting too big once a zone fills, and
suggested a horizontal scroll strip. Measured live: **the strip already exists**
— `REQ-130` shipped it, it scrolls horizontally inside its own region and causes
no page scroll. The problem is the tile size inside it. Each tile's image
renders 146x203 in a 256px-tall region only 265px wide, so a filled zone shows
**about 1.8 cards at a time** on a phone. `REQ-130` itself says the strip is a
"scannable add-order list, not a card-reading surface" and that the detail popup
is the read path — so the tiles are simply too big for their own stated job.
This amendment sets a measurable target: at least three tiles visible at 390x844
without scrolling the strip, with the popup still the way to read a card.
(Amends `REQ-130` and the `screen-layout.md` Zone collection row; tile sizing
mechanism is `DEC-160`, read path is `REQ-128`.)

**What happens if you say no:** the strip stays, and a filled zone keeps showing
under two cards at a glance.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ REQ-130 Acceptance Criteria
-  - under DEC-160 the tile's image grows to fill the tile; the tile itself keeps its established fixed width (`w-40`, 160px) so the strip's horizontal rhythm and scroll behavior are preserved, and the taller tile stays within REQ-129's first-viewport ceiling
+  - under DEC-160 the tile's image grows to fill the tile, and the strip's horizontal rhythm and scroll behaviour are preserved within REQ-129's first-viewport ceiling
+  - at 390x844 at least **three** tiles are visible in the strip without scrolling it, so a filled zone reads as a list rather than as one card and a sliver. Measured baseline this replaces (2026-09-24, two cards in Hand): the strip's visible width was 265px against a 326px scroll width with 146x203 tile images in a 256px-tall region — about 1.8 tiles visible. The established `w-40` / 160px tile width is therefore **superseded**: the tile narrows to meet this criterion
+  - each tile keeps its Remove control, truncated name, stack-position label where applicable, and the corner detail popup as its read path (REQ-128); narrowing the tile must not drop any of them
@@ REQ-130 Constraints
-  - do not widen the tile to chase image legibility — the zone strip is a scannable add-order list, not a card-reading surface; the corner detail popup (REQ-128) remains the read path here
+  - do not widen the tile to chase image legibility — the zone strip is a scannable add-order list, not a card-reading surface; the corner detail popup (REQ-128) remains the read path here. Narrowing it is the correction this requirement now makes
+  - one shared tile size for every zone including stack; no per-zone variant and no fork of `CardPresentation`
@@ REQ-130 Dependencies
   - NFR-001
+  - REQ-200
@@ REQ-130 Notes
   - **amended during the `ui-review` pass (2026-08-06)**: DEC-160 replaces the shared `max-h-32` cap with container-relative sizing, which reaches this strip because `ZoneCardPicker` consumes the same `CardPresentation`. The image grows from 92px to roughly the tile's 160px interior; nothing else about the strip changes.
+  - **amended during the `ui-reimagining` pass (2026-09-24)**: the strip itself was already shipped and verified live; the owner's reported friction was tile density, not a missing strip. The 160px tile is superseded by a three-tiles-visible-at-390px criterion, measured rather than chosen.
```

```diff
--- a/PRD/sections/screen-layout.md
+++ b/PRD/sections/screen-layout.md
@@ #### In-Depth — Zone collection, | Phone |
-**Added cards:** horizontal L→R strip with region scroll (REQ-130), fixed `w-40` / 160px tiles, and images filling tile interiors under DEC-160 (≈92px → ≈144px).
+**Added cards:** horizontal L→R strip with region scroll (REQ-130), tiles sized so **at least three are visible at 390×844 without scrolling the strip**, with images filling tile interiors under DEC-160. Superseded geometry: fixed `w-40` / 160px tiles, measured live on 2026-09-24 as 146×203 images in a 256px-tall region with a 265px visible width against a 326px scroll width — about 1.8 tiles visible, which is the owner-reported "cards get too big once a zone fills" friction.
@@ | Desktop/tablet |
-the added-card strip keeps the same fixed tile width and sizing rule
+the added-card strip keeps one shared tile width and sizing rule across widths, growing tile count rather than tile size
@@ | Notes |
-| Notes | DEC-050, DEC-151, DEC-160, REQ-125, REQ-128–130, REQ-141, DEC-145.
+| Notes | DEC-050, DEC-151, DEC-160, REQ-125, REQ-128–130, REQ-141, REQ-200, DEC-145.
```

- Verdict: accept
- Reason: owner approved 2026-09-24 in session, taking the driver's recommendation

---

## REQ-167 — retire the stale note that told a future pass to re-measure

**What this decides:** nothing new — it keeps the multi-card requirement honest
about where the measured layout truth now lives.

**In plain terms:** `REQ-167` is the change that let Quick Question take up to
five cards instead of one. It left a note telling a future pass to re-measure
the layout row for a multi-card strip, and that row was re-measured on
2026-08-30 — but with the *stacked* outcome, which `REQ-129` above now reverses.
This just updates the note so nobody reads it and re-derives the old answer.
Nothing about the 5-card cap, the per-card enrichment, or the combo behaviour
changes. (Amends `REQ-167`'s note only.)

**What happens if you say no:** a stale instruction stays in the spec and a
later pass re-measures toward the layout you just asked to change.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ REQ-167 Notes
-  - Screen-layout's "Quick Question — pre-submit" row records a **single-card** image cap (REQ-129/DEC-160/REQ-141). That row must be re-measured and updated for a multi-card add strip when this ships; it is deliberately not restamped as measured truth here.
+  - Screen-layout's "Quick Question — pre-submit" row was re-measured for the multi-card add strip on 2026-08-30 and again on 2026-09-24. The 2026-08-30 reading accepted page scroll past the composer with 2+ cards attached; the `ui-reimagining` pass withdraws that (REQ-129 as amended) and binds the attached-card region so Send Request stays in the first viewport at all five cards. That row is the authority; this note is no longer an instruction to re-measure.
```

- Verdict: accept
- Reason: owner approved 2026-09-24 in session, taking the driver's recommendation

---

## REQ-056 — the Easter egg stops being game-context-only

**What this decides:** whether the requirement that owns the cat wizard keeps
tying it to one step.

**In plain terms:** `REQ-056` is the screen-compaction pass, and it is where the
Easter egg is actually specified: the cat-wizard image is absent from the page
until ten clicks on the `TheJudge` brand title **on the game-context step**,
then it stays for the browser session. Its test criterion says the same. Both
lines have to point at `REQ-203`'s session-wide count for the egg to spread. The
rest of `REQ-056` — the merged phase panel, the zone strip, the scan-chrome
hiding, the four-row enrichment scroll cap — is untouched. (Amends `REQ-056`;
`DEC-076` is the decision index row behind the egg and is not edited, since the
decision log is retired.)

**What happens if you say no:** `REQ-203` contradicts `REQ-056` and the egg
stays on one step.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ line 1177 (REQ-056, Acceptance Criteria)
-  - **game context:** the cat-wizard hero image is not in the document on initial render; after 10 clicks on the `TheJudge` brand title on the game-context step it appears (`/assets/cats-homescreen.png`) and stays visible for the browser session only; turn phase and active player render in one merged panel side-by-side on `sm+` widths with combat sub-step full-width below when phase is `combat`; `(recommended)` does not appear in active-player labeling; player expand/collapse and add/remove controls use wider tap targets
+  - **game context:** the cat-wizard hero image is not in the document on initial render; after 10 taps on the `TheJudge` brand mark — counted session-wide across every in-scope screen under REQ-203, not only on this step — it appears (`/assets/cats-homescreen.png`) and stays visible for the browser session only; turn phase and active player render in one merged panel side-by-side on `sm+` widths with combat sub-step full-width below when phase is `combat`; `(recommended)` does not appear in active-player labeling; player expand/collapse and add/remove controls use wider tap targets
@@ line 1182 (REQ-056, Acceptance Criteria)
-  - tests cover representative cases for game-context Easter egg, zone strip scroll, scan chrome hide/show, and enrichment list scroll cap
+  - tests cover representative cases for the Easter egg (its cross-screen tap count is covered by REQ-203), zone strip scroll, scan chrome hide/show, and enrichment list scroll cap
@@ REQ-056 Dependencies
   - DEC-052
+  - REQ-203
@@ REQ-056 Notes
   - prior 2-column / 4-visible-tile zone grid superseded by DEC-151 horizontal strip
+  - amended for the `ui-reimagining` pass (2026-09-24): the Easter egg's trigger widens from the game-context step to every in-scope screen under one session-wide tap count (REQ-203). The session-only scope, the asset, and the hidden-on-initial-render behaviour are unchanged, and the egg is protected scope through the redesign.
```

- Verdict: accept
- Reason: owner approved 2026-09-24 in session, taking the driver's recommendation

---

## NFR-011 — the quality bar keeps its contrast promise and drops the four-token rule

**What this decides:** whether the non-functional quality bar for theming still
forbids new token roles, and what contrast promise replaces its current one.

**In plain terms:** `NFR-011` is the promise that theming stays lightweight and
readable: no backend, no accounts, CSS plumbing only, graceful fallback when
browser storage is unavailable, and — the part that matters here — each profile's
filled-button text colour clears 4.5:1, with consumers reusing the existing
accent tokens "rather than adding token roles". The redesign needs the roles. In
exchange the promise gets **stronger and measured**: the three floors from
`REQ-200` (body text 14.37:1, accent text 6.19:1, filled-accent text 5.42:1)
are all above the old 4.5:1 bar and are today's own worst cases, so the redesign
cannot make readability worse than it is. Custom Colorless stays exempt, exactly
as today. (Amends `NFR-011`; floors measured 2026-09-24.)

**What happens if you say no:** `REQ-200` contradicts the quality bar, and the
bar keeps a 4.5:1 promise weaker than what the app already achieves.

```diff
--- a/PRD/sections/non-functional-requirements.md
+++ b/PRD/sections/non-functional-requirements.md
@@ line 146 (NFR-011, Constraints)
-  - re-themed surfaces and semantic states (DEC-068 / REQ-046) must keep readable contrast across all six curated DEC-119/REQ-099 profiles; each fixed profile's `accent-contrast` must clear at least 4.5:1 against both `accent` and `accent-strong`, and consumers must reuse the existing accent tokens rather than adding token roles or duplicated color constants
+  - re-themed surfaces and semantic states (DEC-068 / REQ-046) must keep readable contrast across all six curated DEC-119/REQ-099 profiles; each fixed profile's `accent-contrast` must clear at least 4.5:1 against both `accent` and `accent-strong`. Under REQ-200 the bar is raised to the app's own measured worst cases (2026-09-24): primary body text at least 14.37:1, accent text at least 6.19:1, and filled-accent text at least 5.42:1, against the darkest and lightest point of each profile's wash. Consumers reuse REQ-200's single authoritative token set — the "rather than adding token roles" clause is superseded by that set — and never duplicate colour constants
@@ line 148 (NFR-011, Constraints)
-  - restrained ambient accents (DEC-081 / REQ-060) apply only to REQ-060's closed minimum surface inventory, including DEC-118's context trigger/sheet/drawer and shared composer/workspace replacement surfaces, and must define resting, enhanced hover/focus, and selected/current intensity once through shared semantic styling
+  - restrained ambient accents (DEC-081 / REQ-060) cover at least REQ-060's inventory, including DEC-118's context trigger/sheet/drawer and shared composer/workspace replacement surfaces, and must define resting, enhanced hover/focus, and selected/current intensity once through shared semantic styling. REQ-200 extends the reach to every in-scope surface; the define-once rule is unchanged
@@ NFR-011 Constraints (new clause, after the reduced-text-size clause)
   - fluid responsive rules must not shrink body/supporting text below existing `text-sm` / `text-xs` or applicable primary controls below 44px touch targets
+  - Player Life Tracker inherits profile-driven shared chrome the same way every other destination does; its own screens, counters, and `lib/lifeTracker/` state stay untouched, and every slice that touches shared chrome or the token set attaches a before/after screenshot pair at 390x844 and 1440x900 to its PR for the owner's review (REQ-202)
@@ NFR-011 Dependencies
   - NFR-005
+  - REQ-200
+  - REQ-202
+  - REQ-205
@@ NFR-011 Notes
   - the fixed White/Blue/Black/Red/Green/Colorless profiles are polished product UI; only user-supplied Colorless RGB is permitted to produce poor contrast
+  - amended for the `ui-reimagining` pass (2026-09-24): the contrast bar is now the app's own measured worst cases rather than a generic 4.5:1, so the redesign cannot regress readability. The three figures were measured in the shipped app, not chosen.
```

- Verdict: accept
- Reason: owner approved 2026-09-24 in session, taking the driver's recommendation

---

## FLOW-007 — picking a colour restyles the whole app, not just the accents

**What this decides:** what a player sees the instant they tap a colour in the
Menu.

**In plain terms:** `FLOW-007` is the walk-through of choosing a colour: open the
Menu's Theme section, see six named swatches in White/Blue/Black/Red/Green/
Colorless order with Blue the default, tap one, and it applies immediately
without losing your place in the flow. Its step 4 says what "applies" means
today — primary accents plus a fixed list of surfaces — and its closing note
says static chrome and the page background stay neutral. Both need to describe
the new behaviour: the whole surface retints. Everything else about the flow —
the order, Blue's default, Colorless's custom colour and Reset, persistence, the
fallback when a stored value is corrupt — is unchanged. (Amends `FLOW-007`;
backed by `REQ-200`.)

**What happens if you say no:** the flow documentation contradicts `REQ-200`.

```diff
--- a/PRD/sections/user-flows.md
+++ b/PRD/sections/user-flows.md
@@ FLOW-007, Main Flow step 4
-  4. App immediately applies the selected profile to primary accents and the restrained resting/hover/focus/current treatments on REQ-060's closed minimum surface inventory without leaving the current workflow step.
+  4. App immediately applies the selected profile to the whole surface — background wash, panel fills and edges, focus rings, the Ask AI waiting panel, and the card-detail popup — plus primary accents and the resting/hover/focus/current treatments on REQ-060's inventory, all without leaving the current workflow step (REQ-200). Player Life Tracker's own screens keep their present-day appearance; the shared chrome it inherits (menu rail, brand mark, theme section) picks up the profile like every other destination, reviewed by a screenshot pair rather than pinned (REQ-202).
@@ FLOW-007, Notes
-  - only REQ-060's closed minimum surface inventory uses the restrained ambient hierarchy from DEC-081; static chrome and the dominant page background remain neutral
+  - REQ-060's inventory is the minimum that carries the restrained ambient hierarchy from DEC-081; under REQ-200 static chrome and the dominant page background are profile-driven too, bounded by REQ-200's measured contrast floors. Card-identity rings (REQ-058) stay outside the profile; Life Tracker (REQ-202) inherits the profile through shared chrome like every other destination
@@ FLOW-007, Notes (appended)
   - DEC-119 / REQ-099 define the exact fixed token matrix and Colorless persistence/reset contract
+  - dark values only in this pass; no theme-mode control exists and none is added (REQ-200)
```

- Verdict: accept
- Reason: owner approved 2026-09-24 in session, taking the driver's recommendation

---

## Blocker questions

**None.** Every open point was resolved from an authoritative source under the
assumption ladder in `PRD/instructions/preparation-contract.md`, and each
assumption and its evidence is recorded in `DESIGN-BRIEF.md`
(`## Material assumptions, in one list`).

Three points were deliberately left to the mockup stage rather than guessed
here, because a drawing is the right thing to react to and none of them blocks
the work: what the three reference sites you named have in common and what you
dislike about TCGplayer (intake C2/C3), where the cat wizard appears on screens
with no hero slot, and whether any of the three `docs/design/tab-icon/`
candidates informs the new brand mark. None is a product-truth change, so none
carries a stable ID or a verdict slot.

One shaping call is worth naming here even though it needs no verdict slot: this
package's build delivers **direction 1 only**, and directions 2–3 and the app
code are later packages — because a graph run cannot show you the first
direction, wait, and then build the other two. The reasoning is in
`DESIGN-BRIEF.md` (`## What this package's build actually delivers`). If you
would rather see all three directions in one PR, say so on this PR and the plan
collapses to a single mockup package.
