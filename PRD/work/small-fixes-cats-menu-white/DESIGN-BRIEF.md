# Design brief — small fixes: cats Easter egg, desktop menu button, White default, menu scrollbar

**What this is:** four small fixes a player will notice, shaped for one build.
**What you need to do:** answer the six verdict slots in `GATE-QUESTIONS.md`.
REQ-099, REQ-044 and FLOW-007 are one decision (White as the default) written
in three places. No blocker.
**What it changes:** the cats come back on every screen that shows the title;
the ☰ gets wider bars on desktop and a soft glow everywhere; first-time
visitors land on White;
the open menu stops scrolling sideways.

Inputs: `IDEA.md`, `intake/owner-request.md` (evidence, not authority), the
`## Prior run` receipts in `IDEA.md` (input, not scope). Every measurement below
was taken live in the running app; the full record is
`evidence/measurements.md`, screenshots in `.playwright-mcp/` (local, ignored).

Revised after quality-check attempt 1 (`QUALITY-CHECK.md`, FAIL, four brief
fixes): section 1 adds a cat placement test; section 3 names the whole
default-pin test and the Blue-fallback title, spells out the `tokens.css`
split, adds a first-paint test and records the `index.html` placeholder
exception; section 4 names the stylesheet assertion and keeps the live
measurement as the verification step. `GATE-QUESTIONS.md` is unchanged.

Revised after quality-check attempt 2 (FAIL, two brief fixes), with a full
re-read for the same kind of gap. Section 3 now fixes the order of the new
White `:root` block (before every colour's block) and tests it; the ambient
scene's own Blue fallback now follows the default too (new file in Touches,
with a test). The re-read also pinned two more stylesheet-order assumptions:
the desktop ☰ rule must sit before the hover rule (section 2), and the tray fix
notes how its two overflow settings combine (section 4). Every other place that
picks a colour before the saved choice applies was checked and already follows
the default (section 3, "Checked and already following the default").
`GATE-QUESTIONS.md` is unchanged.

Revised after quality-check attempt 3's PASS, at the owner's direction
(2026-10-14). The owner previewed the proposed desktop ☰ chip live, declined it
("not the vibe"), and chose from further live previews: no box, bars 45px wide
with a soft colour-tinted glow on desktop, and the same glow at today's size on
a phone. Section 2, assumptions A4 and A11, and the REQ-207 slot in
`GATE-QUESTIONS.md` are rewritten to match; the build half's re-grade at
`gate-qc` covers the change.

## 1. Cats Easter egg

**What the player sees today.** The app opens on Ask a Question. There the
title (TheJudge · MTG Assistant) is a plain heading: twelve taps do nothing. The
cats only appear from one place — In-depth details' first step (Game). Ten taps
there show the cat-wizard picture; move on to the Zones step and it vanishes.
Trade Balancer and every other In-depth step have a plain title too. So the egg
is not gone, it is stranded on a screen the owner no longer starts from.

**Cause.** Only the Game step passes a tap handler to the header
(`MtgAssistantApp.tsx` line 878). The count lives inside that one step's
component, and the picture renders only inside that step. REQ-203 (the
suite-wide egg: one shared count, any in-scope screen, reveal holds for the
session) was written for the redesign but never built — no commit touches it.

**Does product truth already describe the fix? Yes.** REQ-203 already says: the
title is a tap target on Ask a Question (before and after an answer), every
In-depth step and its answered workspace, and Trade Balancer; one count shared
across screens; the tenth tap anywhere reveals the picture; the reveal holds on
every in-scope screen for the rest of the session and survives switching
screens; a reload clears it; Life Tracker shows the title but never counts or
reveals; no new asset; taps change nothing else and never navigate. REQ-056
already defers to it. **No new requirement is needed for the trigger.**

The one thing REQ-203 leaves open is *where* the picture appears on screens with
no hero slot ("a mockup decision, deliberately not fixed here"). There is no
mockup for it, so the brief picks a placement and the gate records it (REQ-203
block): directly under the banner header (and the mock-mode strip when shown),
centred, the same 224px picture as today, on every in-scope screen. The probe
shows it fits at 390×844 and 1440×900 on Ask a Question and Trade Balancer with
no page scroll; Trade Balancer's side panel gets shorter to make room.

**Build outcome.**
- One in-memory, session-wide tap count shared by every in-scope screen, held
  above the destinations so switching screens keeps it. No storage key.
- The title is a button (the existing `BrandMark` button form) on every in-scope
  screen: Ask a Question pre-answer and answered, In-depth Game, Zones, Cards,
  Context and its answered workspace, Trade Balancer. Life Tracker's title stays
  a plain heading. The brief loading placeholder (`DestinationOutlet` fallback)
  stays a plain heading — it is not an in-scope screen and lasts a moment.
- After the tenth tap the picture shows under the header on every in-scope
  screen until reload. The Game step's own copy of the count and picture is
  removed so there is one source. The text fallback "Cat wizard" on image load
  failure is kept.
- Tests (REQ-203's own list): the count adds up across two different screens;
  the reveal holds after a destination switch; a fresh mount (reload) starts
  hidden; Life Tracker has no tap target and no picture; nine taps show nothing.
- Placement test (new): after the reveal, on Ask a Question and on Trade
  Balancer, the picture (the `img` named "Cat wizard") comes after the banner
  header in document order and before that screen's page content (the
  question box on Ask a Question, the trade panels on Trade Balancer), checked
  with `compareDocumentPosition`. That proves the picture sits directly under
  the header, not inside or below the content. The live 390×844 / 1440×900
  check below confirms it looks right.
- The three existing tests in `App.interaction-flows.presentation.test.tsx`
  keep passing.

## 2. ☰ Menu button: wider on desktop, a soft glow everywhere

**What the player sees today.** At 1440×900 and 100% zoom the ☰ draws only
14×12 pixels of light — 84 lit pixels inside a 54px button whose fill and edge
are fully transparent until hovered. It is bright enough in every colour
(12.3:1 to 15.1:1 against the header), so contrast is not the problem: the mark
is tiny. On a phone (390×844) it is a 1.4rem glyph (22.4px font) in a 50px box.

**Proposal (owner-chosen — REQ-207 block).**
- **Desktop (`768px`+):** the ☰ glyph is replaced by three drawn bars, 45px
  wide, 2.5px thick, 7px apart (21.5px tall overall), centred in the button.
  No box, fill or outline at rest. The button stays 54×54px in the far-left
  corner, so the header stays 68px tall.
- **Every width:** the bars carry a soft glow behind them, about 6px, in the
  colour's `--accent` mixed about 55% with white, so the glow is tinted by the
  colour: cream in White, light blue in Blue, pink in Red, mint in Green,
  lavender in Black, grey-white in Colorless. The glow is on the bars only,
  never on the button box, so the hover and focus fill does not glow. It is
  static, so reduced motion needs nothing extra.
- **Phone (`< 768px`):** size unchanged (50px box, 1.4rem glyph); it gains the
  same glow.

**How it was chosen.** The first proposal (an Add card / Scan-style box around
a 2.1rem glyph) was previewed live and the owner declined it as "not the vibe",
asking instead to make the mark wider with a little glow. Live previews in all
six colours compared 30, 34 and 40px bars with glow, then 40, 45 and 50px; the
owner chose 45px. 50px nearly filled the 54px box and would have cramped the
hover fill. Previews (local): `.playwright-mcp/12-menu-button-wider-glow-options.png`,
`14-menu-button-C-40-45-50.png`, `15-menu-button-C-header-white.png`,
`16-phone-390-menu-glow.png`, `17-phone-390-glow-white.png`. The preview drew
the bars with a pseudo-element over a transparent glyph; the build may draw
them any way that matches the measurements, as long as the button keeps its
accessible name ("Switch feature") and its 54px / 50px box.

**Build outcome.** CSS in `shell.css` only. The desktop bar drawing goes in the
existing `.app-header .menu-toggle` rule inside the `min-width: 768px` block;
the glow goes on the bars (desktop) and on the glyph (phone), for example a
`drop-shadow` on the drawn bars and a `text-shadow` on the phone glyph. Hover
and focus keep today's accent fill. The hit box still equals the painted box
(REQ-114); the glow is decoration and takes no pointer events.

**Tests.** A stylesheet assertion that reads `shell.css` as text: the desktop
rule draws bars 45px wide and carries the glow; the phone rule keeps the 50px
box and 1.4rem glyph and carries the glow; the desktop box stays 54px. Live
check at 1440×900 and 390×844: box 54px / 50px, header height unchanged (68px
on desktop), glow visible in all six colours, hover and keyboard focus still
show the accent fill.

**Rule order matters here.** The desktop rule `.app-header .menu-toggle` and
the hover/focus rule `.menu-toggle:hover, … .menu-toggle:focus-visible`
(`shell.css` lines 317-323) have equal specificity, so whichever comes later in
the file wins. The new look sets no border or background, so it cannot override
the hover fill today; it still goes **inside the existing `min-width: 768px`
block** (lines 309-315), before the hover rule, so a later change to the
resting look cannot silently disable hover. The stylesheet assertion checks
that order. (Checked: no other stylesheet styles `.menu-toggle` except
`index.css`'s `.menu-toggle[aria-hidden="true"]`, which only hides it while the
tray is open.)

## 3. White as the default colour

**What the player sees today.** A first visit lands on Blue. Nothing is saved
until the player picks a colour.

**The White profile exists**: id `white`, name White — warm cream light and the
low-sun ray scene on the same dark page every colour uses. It is the White
colour personality, not a light page.

**Proposal (REQ-099 block, with REQ-044 and FLOW-007 following it).** White
becomes the default: a visitor with no saved colour sees White, and a missing,
broken or retired saved value falls back to White. Blue stays in the catalog,
unchanged, second in order.

**What happens to returning players.** Anyone who ever picked a colour keeps it —
their saved choice is read first and is untouched. Anyone who never picked one
has nothing saved, so the app cannot tell them from a newcomer: they will see
White on their next visit. That is unavoidable without inventing a migration,
and it matches the owner's ask.

**Build outcome.**
- `DEFAULT_PALETTE_ID` becomes `"white"` in `apps/frontend/src/lib/theme/palettes.ts`
  (and its comment "`blue` remains the app default").
- First paint matches, so a first visit never flashes blue before the app
  starts. Three surfaces paint before `applyPalette` sets `data-profile`, and
  one more (the ambient scene, below) picks a colour before it:
  - `tokens.css` lines 41-42 today read `:root, [data-profile="blue"] { … }` —
    one block serving both the default and Blue. The build **splits it in two**:
    `[data-profile="blue"]` keeps every Blue value exactly as today (`--motif`
    blue.svg, `--accent` #0050d8, `--accent-strong` #1e3a9c, `--accent-soft`
    #38e1ff, `--accent-contrast` #ffffff, `--wash-tint` #05070d), and a
    separate `:root` block takes White's six values (the same as
    `[data-profile="white"]`: `--motif` white.svg, `--accent` #ede7d6,
    `--accent-strong` #b0a382, `--accent-soft` #faf8f2, `--accent-contrast`
    #09090b, `--wash-tint` #120e08). The later shared surface-role block
    (`:root, [data-profile] { … }`, line 110) is not touched. Choosing Blue
    still looks exactly as it does today.
  - **The new White `:root` block stays first**, where the combined block sits
    today (line 41): before `[data-profile="blue"]` and before every other
    `[data-profile="…"]` block. Why it matters: `data-profile` is set on
    `<html>`, the same element `:root` matches, and `:root` and
    `[data-profile="red"]` have equal specificity (one pseudo-class versus one
    attribute), so the rule later in the file wins. Put the White block after
    the colour blocks and every colour would paint White. The shared block at
    line 110 comes after all of them but sets none of the six colour values
    (only fonts, surfaces derived from them, focus ring and text), so it does
    not interfere. `tokens.css` is also the first token file loaded
    (`main.tsx` imports it before `glows.css`, `shell.css`, `ambience.css`,
    `flow.css`, `index.css`); the two later `:root` blocks (`glows.css` line
    8, `index.css` line 2651) only reference these values or set spacing, and
    redefine none of the six.
  - `index.html`'s `theme-color` meta (`content`) and placeholder favicon
    (`fill` in the inline data URI) change from #0050d8 to White's accent,
    #ede7d6.
- **A deliberate exception to the no-hard-coded-hex rule.** REQ-219 says the
  favicon colour and `theme-color` are never a per-profile hex hard-coded
  outside the token layer, and REQ-216 says no colour value lives outside it.
  `index.html` cannot read the token layer: it paints before any script runs.
  So its two hex values are a placeholder that `applyPalette` overwrites on
  mount — they already are one today, with Blue's hex. This build keeps that
  exception, only switching it to White, and makes it safe with the first-paint
  test below, which fails if the placeholder ever drifts from the token layer.
  No product-truth change is proposed for it: the placeholder is not the
  "active profile's" colour REQ-219 governs, and the build leaves REQ-219's
  `applyPalette` path unchanged.
- First-paint test (new, in `applyPalette.test.ts`, which already reads
  `tokens.css` and `index.html` as text): every custom property in the
  `:root { … }` block of `tokens.css` — the one rule whose selector is
  `:root` alone, opened by the text `:root {`, not the shared
  `:root,\n[data-profile] {` block at line 110 — equals the same property in
  the `[data-profile="white"] { … }` block (same set of properties, same
  values); `index.html`'s `theme-color` `content` equals White's `--accent`
  from `tokens.css`; and the decoded favicon data URI's `fill` equals that
  same accent. A companion assertion checks the `[data-profile="blue"]` block
  still carries Blue's six values, so the split cannot silently break Blue.
- Order test (new, same file, same text read): the offset of `:root {` in
  `tokens.css` is smaller than the offset of each of the six
  `[data-profile="<id>"] {` blocks (white, blue, black, red, green,
  colorless). jsdom applies no cascade, so this text check is the automated
  guard; the live check under Verification confirms the cascade in a real
  browser.
- **The ambient scene follows the default too.** `AmbientScene.tsx` lines
  550-552 pick the scene from `data-profile` and fall back to Blue when it is
  not set yet (`dataset.profile || 'blue'`, `RECIPES.blue`, `SCENES.blue`).
  That happens on every first load: the page and tray scenes start in their
  own mount effect, which React runs before the app's `useThemePalette`
  effect (`App.tsx` line 40) calls `applyPalette`. The scene's
  `MutationObserver` (line 622) then restarts it in the right colour. Read
  from the code, the Blue start never reaches the screen — the restart runs
  in the same task and cancels the queued frame — so this is not a visible
  flash today. The build changes it anyway, so the app has one default and
  no stale Blue: the three fallbacks read `DEFAULT_PALETTE_ID` from
  `palettes.ts` (the way `useActiveThemeMotif.ts` and `FeaturePortalMenu.tsx`
  already fall back to `DEFAULT_PALETTE`). Scenes and recipes are unchanged.
  Test (new, `AmbientScene.test.tsx`): with no `data-profile` set and reduced
  motion on, the still frame's fingerprint equals White's still frame at the
  same size (the existing `paintStill`/`fingerprint` helpers), and differs
  from Blue's. The existing per-colour golden test stays green.
- **Checked and already following the default** (no change):
  `themePrefs.ts` (returns `DEFAULT_PALETTE_ID` for missing or bad saved
  values), `useThemePalette.ts` and `FeaturePortalMenu.tsx` (fall back to
  `DEFAULT_PALETTE`), and `useActiveThemeMotif.ts` (falls back to
  `DEFAULT_PALETTE.motif`). The colour-specific decorations keyed on
  `[data-profile="…"]` (`shell.css` header art lines 104-153, `ambience.css`
  haze lines 143-149) match no colour until `applyPalette` runs, for every
  colour, today and after — no Blue there. The tab title in `index.html` is
  the same for every colour. There is no web manifest with a theme colour.
  A grep of the frontend source for `|| 'blue'`, `?? "blue"`, `.blue` and the
  Blue hex values found only the items handled in this section and Blue's own
  catalog entry and motif art.
- Tests that pin the default, and what each becomes:
  - `apps/frontend/src/lib/theme/palettes.test.ts` lines 76-80 — the whole
    test, not one line. Its title "includes a default blue palette matching
    DEFAULT_PALETTE_ID" becomes a White title; line 77
    `expect(DEFAULT_PALETTE_ID).toBe("blue")` becomes `"white"`; line 80
    `expect(defaultPalette?.name.toLowerCase()).toContain("blue")` becomes
    `"white"`.
  - `apps/frontend/src/App.mtg-color-themes.test.tsx:171` — the test title
    "removes an unsupported stored palette id and falls back to Blue" becomes
    "…falls back to White". Its body already uses `DEFAULT_PALETTE_ID` and
    follows the constant.
  - `themePrefs.test.ts`, `useThemePalette.test.ts` and the rest of
    `App.mtg-color-themes.test.tsx` use the constant and follow it.
  - `apps/frontend/src/test/appliedTheme.ts` line 20 falls back to `"blue"`
    when no profile is set; it reads `DEFAULT_PALETTE_ID` instead, so it
    follows the new default (White) and any later one. Its
    `[data-profile="<id>"] {` text lookup, like the ones in
    `applyPalette.test.ts` and `palettes.tokens.test.ts`, still finds Blue's
    block after the split, because that block keeps its own header line.
  - Fixtures that merely pass `"blue"` as an input (`FeaturePortalMenu.test.tsx`,
    `ThemeSection.test.tsx`, `applyPalette.test.ts`, `AmbientScene.test.tsx`,
    and `palettes.test.ts`'s "looks up a palette by id") are not default pins
    and stay.

## 4. No sideways scrollbar in the open menu

**What the player sees today.** On a desktop that always shows scrollbars, a
scrollbar runs along the bottom of the open menu though nothing is wider than
the menu.

**Cause, measured.** The tray is 319px inside but 320px of content wide at both
1440×900 and 390×844. The extra pixel is the tray's thin right-edge light line,
drawn one pixel outside the tray (`.menu-tray::after`, `right: -1px`). Because
the tray scrolls up and down (`overflow-y: auto`), the browser lets it scroll
sideways too, so that one pixel earns a full scrollbar. Hiding the line alone
removes the overflow and the bar at both widths. No child element overflows.

**Phone.** The same one-pixel overflow exists. Phone browsers hide scrollbars
until you scroll, so it shows as a brief bar or a one-pixel sideways drag rather
than a resting bar. The fix covers both.

**Build outcome.** The tray never scrolls sideways at any width, and the
right-edge light line stays visible. Two changes in `shell.css`, both needed:
the line is drawn inside the tray's box (`.menu-tray::after` loses its
negative `right` offset, for example `right: 0`), and the tray stops scrolling
sideways (`.menu-tray` declares `overflow-x: hidden` or `clip` beside its
`overflow-y: auto`). Drawing the line inside keeps it from being clipped;
clipping the x-axis stops any future one-pixel overhang from earning a bar.

How the two overflow settings combine (checked, so the build is not
surprised): because `.menu-tray` already has `overflow-y: auto`, its x-axis
already clips today — CSS turns a `visible` partner of `auto` into `auto`.
So `overflow-x: hidden` adds no new clipping of the tray's rows or focus
rings; it only removes the sideways scroll. `overflow-x: clip` beside
`overflow-y: auto` is also turned into `hidden` by CSS, so the two allowed
values behave the same. The line at `right: 0` sits just inside the tray's
1px right border, one pixel left of today, instead of over the border. The
only other `.menu-tray` rules (`index.css` line 61, `background-color`; line
5378, reduced-motion `transition`) touch neither overflow nor the line.
Product truth: one new acceptance criterion on REQ-113 (REQ-113 block) so the
regression is tested.

**Automated test.** jsdom does no layout, so `scrollWidth` cannot be measured
in the test suite. The test is a stylesheet assertion that reads `shell.css`
as text, the way `ambient-accent-foundation.test.ts` reads `index.css`:
- the `.menu-tray::after` rule has no negative `right` or `left` offset — the
  line no longer overhangs the tray;
- the same rule still has `content`, a 1px `width` and its `background`, so
  the line still paints;
- the `.menu-tray` rule declares `overflow-x: hidden` or `overflow-x: clip` —
  the tray cannot scroll sideways.

**Live verification step.** At 390×844 and 1440×900, with classic (always
shown) scrollbars forced on, open the tray and confirm `scrollWidth` equals
`clientWidth`, no horizontal bar shows, and the right-edge line still paints.

## Non-goals

- No new menu position, contents or redesign; no change to phone ☰ size.
- No new cats asset; the picture, its size and its text fallback are unchanged.
- No change to any colour's values, saved choices, or catalog order.
- The desktop tray's shape is not touched. Measured: at 1440×900 it is full
  height and flush to the corner (x=0, y=0, 320×900, square corners), while
  REQ-207 / REQ-113 describe a floating rounded card sized to its content at
  `768px`+. That gap predates this package; recorded for a follow-up, not fixed
  here.
- `PRD/sections/decisions.md`'s DEC-119 row (retired) says "fall back to Blue";
  the decision log is retired and is left as history.

## Material assumptions (assumption ladder)

| # | Question | Choice | Evidence / rung |
| --- | --- | --- | --- |
| A1 | Does the egg need new product truth? | No for the trigger; REQ-203 already describes it | REQ-203 acceptance criteria (rung 1) |
| A2 | Where does the picture show off the Game step? | Under the banner header, centred, 224px, every in-scope screen; recorded in REQ-203's notes at the gate | REQ-203 leaves it open; live fit probe at 390/1440 (rungs 3–4) |
| A3 | Does the loading placeholder count taps? | No | Not in REQ-203's screen list; transient (rung 4) |
| A4 | ☰ size and look | Owner-chosen from live previews: desktop bars 45px × 2.5px, 7px apart, no box, 54px button; soft colour-tinted glow at every width; phone keeps 50px / 1.4rem | Owner direction 2026-10-14 after previewing the chip, 30/34/40px and 40/45/50px options (rung 1: owner decision, to be confirmed at the REQ-207 slot) |
| A5 | Fallback for broken/retired saved colour | Follows the default (White) | REQ-099 and FLOW-007 tie fallback to the default (rung 1) |
| A6 | Never-chose returning players | See White | No saved key exists to distinguish them (rung 2) |
| A7 | Fix first paint too | Yes — split `tokens.css`'s combined `:root, [data-profile="blue"]` block (Blue keeps its values, `:root` takes White's, and the `:root` block stays before every colour block); theme-color and favicon to White's accent; guarded by a first-paint test and an order test | Otherwise a first visit flashes Blue (rung 5); equal specificity means file order decides (rung 2); `tokens.css:41-94`, `index.html:7-8` |
| A8 | Scrollbar fix mechanism | Line drawn inside the tray box and the tray's x-axis clipped; stylesheet assertion plus live measurement | Measured cause; jsdom has no layout, so the automated form must read the stylesheet (rung 4) |
| A9 | `index.html` hard-coded hex vs REQ-219/REQ-216 | Keep it as a deliberate pre-script placeholder (as Blue's hex is today), switched to White, pinned to the token layer by test; no product-truth change | HTML paints before the token layer can run; `applyPalette` overwrites it on mount (rung 2: existing precedent) |
| A10 | Ambient scene's Blue fallback before `applyPalette` | Change it to follow `DEFAULT_PALETTE_ID`, with a still-frame test; not left as a transient | Code read says it never reaches the screen today, but other fallbacks already read the default (`useActiveThemeMotif.ts`, `FeaturePortalMenu.tsx`), so one default is the existing pattern and the change is tiny (rungs 2–3); `AmbientScene.tsx:550-552, 622` |
| A11 | Desktop ☰ look vs hover/focus | The new look sets no border or fill and sits in the existing `min-width: 768px` block, before the hover rule; glow on the bars only, so the hover fill never glows; order asserted by test, hover checked live | Equal specificity, later rule wins; `shell.css:309-323` (rung 2) |

## PRD alignment and proposed product truth

Proposed in `GATE-QUESTIONS.md`, never written to `PRD/sections/` here:

- **REQ-203** — record the picture's placement; refresh In-depth's spec line.
- **REQ-207** — the ☰ gets 45px bars on desktop and a soft colour-tinted glow
  at every width; phone size unchanged.
- **REQ-099** — White is the default and the fallback (plus the shared-chrome
  spec and system-map lines that say "Blue default").
- **REQ-044**, **FLOW-007** — the same default, where they repeat it.
- **REQ-113** — the open tray never scrolls sideways or shows a horizontal
  scrollbar.

Touches: `apps/frontend/src/components/{BrandMark,StagedStepHeader}.tsx`,
`components/portal/{MtgAssistantApp,DestinationOutlet}.tsx`,
`components/portal/quick-lookup/QuickLookupApp.tsx`,
`components/{ZoneCollectionStep,ZoneConfirmStep,EnrichmentStep}.tsx`,
`components/trade/TradeBalancer.tsx`, `components/AmbientScene.tsx`,
`styles/shell.css`, `styles/tokens.css`, `lib/theme/palettes.ts`,
`index.html`, `src/test/appliedTheme.ts`, and the tests named above
(including `components/AmbientScene.test.tsx` and
`lib/theme/applyPalette.test.ts`). Frontend and
presentation only: no request contract, prompt, backend, or data change.

## Verification for the build

- `npm test` (frontend) green, with the new REQ-203 tests (including the
  placement test), the updated default-pin tests, the first-paint and order
  tests, the ambient-scene default test, the ☰ stylesheet assertion (with its
  order check) and the tray stylesheet assertion.
- Live at 390×844 and 1440×900: ten taps on Ask a Question reveal the picture;
  it holds on Trade Balancer and In-depth; Life Tracker shows none.
- Live at 1440×900 and 390×844: ☰ box 54px / 50px, header 68px on desktop,
  45px bars on desktop, glow visible in all six colours at both widths; hover
  and keyboard focus still show the accent fill, with no glow on the box.
- Fresh storage: first paint and settled page are White.
- Each colour keeps its own look: pick Blue, then Red, in Theme. The page
  repaints in that colour, and `getComputedStyle(document.documentElement)`
  reads `--accent` #0050d8 for Blue and #c10230 for Red (not White's
  #ede7d6). Reload with each saved and check again.
- Open tray: scrollWidth equals clientWidth at 390×844 and 1440×900, with
  classic scrollbars forced on; the right-edge line still paints.
