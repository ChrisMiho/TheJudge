# Gate questions — small fixes: cats, desktop menu button, White default, menu scrollbar

**Decide:** six slots below, all amendments to existing requirements. No new
stable ID. No blocker.

How the slots hang together:

- **REQ-203** is the cats Easter egg. The trigger is already fully described;
  this slot only records where the picture shows.
- **REQ-207** is the desktop ☰ button. Its size and look are your call.
- **REQ-099**, **REQ-044** and **FLOW-007** are one decision — White as the
  default — written in three places. Answer REQ-099; the other two follow it.
- **REQ-113** is the menu scrollbar.

Every diff is against `PRD/sections/` at `129171a0`. Line numbers are where the
hunk starts today. Evidence: `evidence/measurements.md`; screenshots in
`.playwright-mcp/` (local).

## REQ-203 — the cats show right under the header, on every screen that counts taps

**What this decides:** where the cat-wizard picture appears once a player has
tapped the TheJudge title ten times, on screens other than In-depth's first
step.

**In plain terms:** the egg already has a rule (REQ-203): ten taps on the title,
counted together across Ask a Question, every In-depth step, and Trade Balancer,
reveal the picture, and it stays for the rest of the visit. That rule was never
built — today only In-depth's Game step counts taps, and the picture vanishes on
the next step. The build makes the rule real. The rule left one thing open:
where the picture sits on screens with no slot for it. This slot fixes it: right
under the header bar, centred, the same 224-pixel picture as today, on every
screen that counts. Measured live, it fits on Ask a Question and Trade Balancer
at phone and desktop size without making the page scroll; Trade Balancer's side
panel gets shorter to make room. Recommendation: accept.

**What happens if you say no:** the build still restores the egg on every
screen, but the placement stays unrecorded; edit this slot to say where you want
it instead (for example, a pop-up over the page).

```diff
@@ functional-requirements.md:5228 — REQ-203 @@
 - Notes:
-  - where the cat appears on screens with no hero slot is a mockup decision,
-    deliberately not fixed here
+  - the cat appears directly under the banner header (and under the mock-mode
+    strip when it shows), centred, at the same 224px width as on the
+    game-context step, on every in-scope screen including game context, and
+    scrolls with the page rather than pinning to the header; on load failure
+    the text "Cat wizard" stands in, as today
   - the egg is protected scope: it survives every mockup direction
+  - amended by `small-fixes-cats-menu-white` (2026-10-14): the placement above
+    replaces "a mockup decision, deliberately not fixed here" — no mockup drew
+    one. Measured live at 390×844 and 1440×900: a 224px cat under the header
+    on Ask a Question and Trade Balancer leaves the document exactly the
+    viewport's height (no page scroll). At that date only the game-context
+    step counted taps and showed the cat; the suite-wide count had never been
+    built
```

```diff
@@ in-depth/README.md:529 @@
-- Cat-wizard hero image (game-context step) is hidden on initial render and
-  revealed session-only after 10 clicks on the `TheJudge` brand title. (DEC-076,
-  REQ-056)
+- Cat-wizard image is hidden on initial render and revealed session-only after
+  10 taps on the `TheJudge` brand title, counted once across Ask a Question,
+  every In-depth step and its answered workspace, and Trade Balancer; it then
+  shows under the banner header on each of those screens until reload. Life
+  Tracker shows the title but never counts or reveals. (DEC-076, REQ-056,
+  REQ-203)
```

```diff
@@ shared-chrome/README.md:118 (after the ☰ Menu button bullet ending "(REQ-207, DEC-109, DEC-133)") @@
   step's own content, not in header chrome. (REQ-207, DEC-109, DEC-133)
+- Built: the brand title is a tap target on every in-scope screen (Ask a
+  Question before and after an answer, every In-depth step and its answered
+  workspace, Trade Balancer) driven by one in-memory, session-wide count held
+  above the destinations; the tenth tap reveals the cat-wizard picture under
+  the banner header on all of them until reload. Life Tracker's title stays a
+  plain heading. No storage key. (REQ-203, REQ-056)
```

- Verdict:
- Reason:

## REQ-207 — the desktop ☰ rests as a quiet, visible button with bigger bars

**What this decides:** how big and how noticeable the ☰ Menu button is on a
desktop screen.

**In plain terms:** the ☰ in the top-left corner is the only way into the menu
(REQ-207 sets its size: at least 44 pixels, today 54 on desktop). Measured at
normal 100% zoom, the three bars draw only 14 by 12 pixels of light, and the
54-pixel button around them is fully transparent until the mouse is over it —
so you see a tiny mark floating in a dark corner. Its brightness is fine in
every colour (12 to 15 times brighter than the header behind it); size and an
invisible outline are the problem. This change gives the desktop button, at
rest, the same faint dark fill and thin colour-tinted outline as the Add card
and Scan buttons beside the question box, and draws the bars about 40% larger
(20 by 17 pixels of light, twice the lit area). It stays in the far-left corner
and keeps its 54-pixel size, so the header does not grow. Phones (narrower than
768 pixels) are unchanged. Previewed live in all six colours: top row today,
bottom row proposed, in `.playwright-mcp/05-menu-button-before-after-strip.png`.
Recommendation: accept. To go bigger, edit the "about 40%" figure; to drop the
outline and only enlarge the bars, edit out the chip clause.

**What happens if you say no:** the desktop ☰ stays a 14-by-12-pixel mark with
no visible button around it until hover.

```diff
@@ functional-requirements.md:5383 — REQ-207 @@
-  - the header is a banner: ☰ at the left (at least 44px; about a quarter larger than today's trigger on a phone and a third on desktop), the brand centred (a breathing orb holding the colour's badge, the wordmark, "MTG Assistant") on a lit band with a hairline of the colour's light along its foot, and each profile's element drawn across the band (White low-sun rays at half strength; Blue a scatter of arcane shapes; Black fog pooling at the ends; Red a hot band with embers; Green a scatter of leaf and tree shapes; Colorless small triangles, rings, arcs, dots and crosses); the right-hand slot shows Trade Balancer's price date at `768px`+; the brand keeps the cat-wizard Easter egg (REQ-203)
+  - the header is a banner: ☰ at the left (at least 44px; about a quarter larger than today's trigger on a phone and a third on desktop; at `768px`+ it rests as a quiet chip — the same faint panel fill and thin colour-tinted edge as the Add card and Scan buttons — with its three bars drawn about 40% larger than before, and it stays in the far-left corner at the same box size, so the header's height is unchanged; below `768px` it is unchanged), the brand centred (a breathing orb holding the colour's badge, the wordmark, "MTG Assistant") on a lit band with a hairline of the colour's light along its foot, and each profile's element drawn across the band (White low-sun rays at half strength; Blue a scatter of arcane shapes; Black fog pooling at the ends; Red a hot band with embers; Green a scatter of leaf and tree shapes; Colorless small triangles, rings, arcs, dots and crosses); the right-hand slot shows Trade Balancer's price date at `768px`+; the brand keeps the cat-wizard Easter egg (REQ-203)
@@ functional-requirements.md:5396 — REQ-207 @@
-  - tests cover the band's cell floor and arrows at 280px and 390px, the tray's close paths, reduced motion stopping the scene, the header's top edge at 0 at 390×844 and 1440×900, the font loading from the app's own origin, the contrast floors per profile, and the Green scene on a phone (390×844) staying a quiet backdrop clear of the content column, confirmed by a before/after screenshot pair on Ask a Question, In-depth, and the Menu tray
+  - tests cover the band's cell floor and arrows at 280px and 390px, the tray's close paths, reduced motion stopping the scene, the header's top edge at 0 at 390×844 and 1440×900, the font loading from the app's own origin, the contrast floors per profile, the desktop ☰'s resting chip (edge, fill and larger bars at `768px`+, box and header height unchanged at 1440×900), and the Green scene on a phone (390×844) staying a quiet backdrop clear of the content column, confirmed by a before/after screenshot pair on Ask a Question, In-depth, and the Menu tray
@@ functional-requirements.md:5421 — REQ-207 Notes (append) @@
   - amended by `ui-look-translation` (2026-10-02): the header sits at the top edge outside the page padding (the first build's reviews measured a band of about 20px at 390×844 and 48px at 1440×900 above it), and panels take the mockup's glass surfaces instead of solid fills
+  - amended by `small-fixes-cats-menu-white` (2026-10-14): the owner found the desktop ☰ "almost invisible" at normal zoom. Measured live at 1440×900, 100% zoom: the glyph painted 14×12px of light (84 lit pixels) inside a 54px box with a transparent fill and edge; contrast was 12.3:1–15.1:1 across the six profiles, so size and the invisible box were the cause. The resting chip borrows the `.icon-chip` look (panel fill at 80%, 1px `--surface-edge`) and the glyph goes from 1.5rem to 2.1rem (20×17px, 179 lit pixels); a 56px box was tried and grew the header to 69.8px, so the box stays 54px
```

```diff
@@ shared-chrome/README.md:109 @@
 - Built: the suite's single navigation affordance is the **☰ Menu button** at the
   left of a banner header flush with the top edge of the screen (outside the page
   padding) — at least 44px, about a quarter larger than the former
-  corner rail on a phone and a third on desktop — with the brand centred (a
+  corner rail on a phone and a third on desktop, and at `768px`+ resting as a
+  quiet chip (the Add card / Scan buttons' faint panel fill and colour-tinted
+  edge) with its bars drawn about 40% larger — with the brand centred (a
@@ shared-chrome/README.md:434 @@
 - Menu trigger: the ☰ button at the banner's left, at least 44px, interactive box
   equal to its painted bounds; the banner's band and element art take no pointer
-  events. Superseded geometry: the single-zone corner rail (`5.5rem × 3.5rem`
+  events. At `768px`+: a 54px box with a 1px `--surface-edge` border and an 80%
+  `--surface-panel` fill at rest, glyph 2.1rem (about 20×17px of light at 100%
+  zoom); below `768px`: 50px, glyph 1.4rem, transparent at rest. Superseded
+  geometry: the single-zone corner rail (`5.5rem × 3.5rem`
```

- Verdict:
- Reason:

## REQ-099 — first-time visitors land on White, not Blue

**What this decides:** which colour a player sees the first time they open the
app.

**In plain terms:** the app has six colour personalities — White, Blue, Black,
Red, Green, Colorless (REQ-099 lists them and their exact colours). Today a
first visit shows Blue. With this change it shows White: warm cream light and a
low-sun ray scene on the same dark page every colour uses — it is the White
personality, not a light page. Blue stays in the menu, unchanged and in the same
place. A player who ever picked a colour keeps it; their saved choice is read
first. A player who never picked one has nothing saved, so the app cannot tell
them from a newcomer — they also see White next visit. A broken or retired saved
colour (the old Violet, Emerald, Amber or Rose) also falls back to White instead
of Blue. The page's very first paint, the browser-tab colour and the placeholder
tab icon change too, so a first visit never flashes blue. Recommendation: accept.

**What happens if you say no:** first-time visitors keep landing on Blue.

```diff
@@ functional-requirements.md:2408 — REQ-099 @@
-  - the Theme section renders exactly six profiles in this order: White, Blue, Black, Red, Green, Colorless; Blue is the default
+  - the Theme section renders exactly six profiles in this order: White, Blue, Black, Red, Green, Colorless; White is the default, so a visitor with no saved choice sees White from the first paint
@@ functional-requirements.md:2424 — REQ-099 @@
-  - Violet, Emerald, Amber, and Rose are absent from the catalog; loading one of those or any unsupported selected ID deletes the stored selection and falls back to Blue
+  - Violet, Emerald, Amber, and Rose are absent from the catalog; loading one of those or any unsupported selected ID deletes the stored selection and falls back to White
@@ functional-requirements.md:2426 — REQ-099 @@
-  - tests cover exact catalog/order/swatches/token values, refreshed WUBRG swatch-to-`accent-soft` alignment, Blue default, fixed-profile contrast, Black-versus-Colorless distinction, global representative reach, custom apply/persist/restore/reset, legacy/unknown deletion, malformed custom deletion, and unavailable storage
+  - tests cover exact catalog/order/swatches/token values, refreshed WUBRG swatch-to-`accent-soft` alignment, White default, fixed-profile contrast, Black-versus-Colorless distinction, global representative reach, custom apply/persist/restore/reset, legacy/unknown deletion, malformed custom deletion, and unavailable storage
@@ functional-requirements.md:2450 — REQ-099 Notes (append) @@
   - amended for the `ui-reimagining-build` pass (2026-09-30): "deliberately uncorrected" custom Colorless becomes "your hue, made readable" (REQ-207); the stored value is still the exact pick, so Reset to gray and persistence are unchanged. The constraint's "no custom-Colorless contrast guarantee" is superseded by the lift above; the lift is a fixed rule, not a generated theming engine
+  - amended by `small-fixes-cats-menu-white` (2026-10-14): the owner moved the default from Blue to White. A saved choice is untouched; nothing is saved until a player picks, so players who never picked also move to White. The fallback for a missing, corrupt or retired saved value follows the default. The pre-start paint (the default token block, the browser-tab `theme-color`, the placeholder favicon) follows it too, so a first visit never flashes Blue. No profile's values or catalog order change
```

```diff
@@ shared-chrome/README.md:187 @@
 - Built: the catalog is six globally shared MTG-color profiles, ordered **White,
-  Blue, Black, Red, Green, Colorless**, with Blue the default; each supplies curated
+  Blue, Black, Red, Green, Colorless**, with White the default; each supplies curated
@@ shared-chrome/README.md:196 @@
   palette ID (the former Violet/Emerald/Amber/Rose catalog) deletes that stored
-  value and falls back to Blue. (DEC-119, REQ-099)
+  value and falls back to White. (DEC-119, REQ-099)
```

```diff
@@ system-map.md:221 @@
-- Summary: Global theme settings for six fixed Magic-inspired color profiles ordered White, Blue, Black, Red, Green, Colorless (Blue default), hosted as a palette-only **Theme** section in the feature-portal Menu, applied to frontend tokens, and persisted per browser. Colorless alone supports a remembered custom RGB override with Reset; retired former palette ids are deleted and fall back to Blue (DEC-119 / REQ-099). Palette reach extends beyond primary-accent surfaces to previously-fixed semantic green states and the camera scanner UI. **REQ-200** extends it further to a restrained theme across the surface through one named token set — page ground, colour wash, raised panel fill, panel edge, focus ring, and text roles, with neutral surfaces kept the visual majority — so the page background is palette-driven rather than neutralized to slate; Life Tracker inherits every shared role like any other destination, reviewed by a before/after screenshot pair rather than pinned (REQ-202). A restrained ambient-accent layer (DEC-081 / REQ-060) extends the palette across the four staged screens and the answered/conversation view: one shared semantic CSS contract (`.ambient-accent-surface` / `.ambient-accent-interactive` / `[data-accent-current="true"]`) defines resting, enhanced hover/focus, and selected/current intensities once from the four existing accent tokens, and REQ-060's inventory is the minimum that opts in — card identity rings and tuned scanner motion stay unchanged; static chrome now reads the REQ-200 surface roles rather than staying neutral, and the inventory now includes the answered view's context trigger/sheet-drawer and docked composer/workspace in place of the retired frozen-context summary. The former Chunky/Slim layout-density control is retired (DEC-117); see **Automatic responsive presentation**. The game-context player disclosure uses 44×44px minimum controls, a prominent accessible expander, and conventional `−`/`+` stepper order.
+- Summary: Global theme settings for six fixed Magic-inspired color profiles ordered White, Blue, Black, Red, Green, Colorless (White default), hosted as a palette-only **Theme** section in the feature-portal Menu, applied to frontend tokens, and persisted per browser. Colorless alone supports a remembered custom RGB override with Reset; retired former palette ids are deleted and fall back to White (DEC-119 / REQ-099). Palette reach extends beyond primary-accent surfaces to previously-fixed semantic green states and the camera scanner UI. **REQ-200** extends it further to a restrained theme across the surface through one named token set — page ground, colour wash, raised panel fill, panel edge, focus ring, and text roles, with neutral surfaces kept the visual majority — so the page background is palette-driven rather than neutralized to slate; Life Tracker inherits every shared role like any other destination, reviewed by a before/after screenshot pair rather than pinned (REQ-202). A restrained ambient-accent layer (DEC-081 / REQ-060) extends the palette across the four staged screens and the answered/conversation view: one shared semantic CSS contract (`.ambient-accent-surface` / `.ambient-accent-interactive` / `[data-accent-current="true"]`) defines resting, enhanced hover/focus, and selected/current intensities once from the four existing accent tokens, and REQ-060's inventory is the minimum that opts in — card identity rings and tuned scanner motion stay unchanged; static chrome now reads the REQ-200 surface roles rather than staying neutral, and the inventory now includes the answered view's context trigger/sheet-drawer and docked composer/workspace in place of the retired frozen-context summary. The former Chunky/Slim layout-density control is retired (DEC-117); see **Automatic responsive presentation**. The game-context player disclosure uses 44×44px minimum controls, a prominent accessible expander, and conventional `−`/`+` stepper order.
@@ system-map.md:228 @@
-- Summary: Six named profiles (White/Blue/Black/Red/Green/Colorless, Blue default) applied immediately on selection and persisted in browser storage (`thejudge.theme.paletteId`); Colorless may store a custom RGB under `thejudge.theme.colorlessCustomRgb` with Reset-to-default. Falls back safely when stored data is unavailable or unsupported; retired catalog ids are deleted and resolve to Blue. All six orbs render in one row; when Colorless is selected, the custom-color input and Reset control appear centered under that row (DEC-152 / REQ-131).
+- Summary: Six named profiles (White/Blue/Black/Red/Green/Colorless, White default) applied immediately on selection and persisted in browser storage (`thejudge.theme.paletteId`); Colorless may store a custom RGB under `thejudge.theme.colorlessCustomRgb` with Reset-to-default. Falls back safely when stored data is unavailable or unsupported; retired catalog ids are deleted and resolve to White. All six orbs render in one row; when Colorless is selected, the custom-color input and Reset control appear centered under that row (DEC-152 / REQ-131).
```

`decisions.md`'s DEC-119 row also says "fall back to Blue". The decision log is
retired history and is left unchanged.

- Verdict:
- Reason:

## REQ-044 — the colour menu's own wording follows the White default

**What this decides:** that the original colour-menu requirement says White,
not Blue, is the default — the same decision as REQ-099 above.

**In plain terms:** REQ-044 is the older rule that a player can choose a colour
and keep it. It repeats "Blue as the default" and "fall back to Blue". This slot
only changes those two words to White so the requirements agree. Answer it the
same way as REQ-099.

**What happens if you say no:** if REQ-099 is accepted, REQ-044 would
contradict it; reject only together with REQ-099.

```diff
@@ functional-requirements.md:918 — REQ-044 @@
-  - opening the control shows the named profiles as swatches, including Blue as the default and Colorless customization per REQ-099
+  - opening the control shows the named profiles as swatches, including White as the default and Colorless customization per REQ-099
@@ functional-requirements.md:921 — REQ-044 @@
-  - missing or corrupt persisted values fall back to Blue; retired or unsupported selected IDs are deleted before falling back, without throwing or blocking app load
+  - missing or corrupt persisted values fall back to White; retired or unsupported selected IDs are deleted before falling back, without throwing or blocking app load
@@ functional-requirements.md:939 — REQ-044 Notes (append) @@
   - REQ-200 supersedes this requirement's accent-only reach: one palette choice now drives the whole surface through a named token set, and the "no dark/light mode redesign" constraint narrows to "no theme-mode control and no light values in this pass"
+  - amended by `small-fixes-cats-menu-white` (2026-10-14): the default and the fallback move from Blue to White with REQ-099
```

- Verdict:
- Reason:

## FLOW-007 — the choose-a-colour flow names White as the default

**What this decides:** that the step-by-step "choose a colour" flow says White
is the default — the same decision as REQ-099 above.

**In plain terms:** FLOW-007 walks through opening the menu, picking a colour,
and what happens on reload. It names Blue as the default and as the fallback for
a broken saved value. This slot changes both to White. Answer it the same way as
REQ-099.

**What happens if you say no:** if REQ-099 is accepted, FLOW-007 would
contradict it; reject only together with REQ-099.

```diff
@@ user-flows.md:168 — FLOW-007 @@
-  2. App shows White, Blue, Black, Red, Green, and Colorless in that order as a six-cell Theme band — each cell its colour's wash and symbol, named by its hover title and accessible name rather than a visible label — with the current profile lit and Blue as the default (REQ-207).
+  2. App shows White, Blue, Black, Red, Green, and Colorless in that order as a six-cell Theme band — each cell its colour's wash and symbol, named by its hover title and accessible name rather than a visible label — with the current profile lit and White as the default (REQ-207).
@@ user-flows.md:176 — FLOW-007 @@
-  - if the stored profile id is missing or corrupt, app falls back to Blue; if it is Violet, Emerald, Amber, Rose, or otherwise unsupported, app deletes that selected-profile value and falls back to Blue
+  - if the stored profile id is missing or corrupt, app falls back to White; if it is Violet, Emerald, Amber, Rose, or otherwise unsupported, app deletes that selected-profile value and falls back to White
@@ user-flows.md:185 — FLOW-007 Notes (append) @@
   - dark values only in this pass; no theme-mode control exists and none is added (REQ-200)
+  - amended by `small-fixes-cats-menu-white` (2026-10-14): the default and the fallback move from Blue to White with REQ-099
```

- Verdict:
- Reason:

## REQ-113 — the open menu never scrolls sideways

**What this decides:** that the open menu must never show a sideways scrollbar,
on a desktop or a phone.

**In plain terms:** the menu slides in from the left (REQ-113 sets its height and
corners). On a desktop that always shows scrollbars, a scrollbar runs along its
bottom though nothing is too wide. Measured: the menu is 319 pixels wide inside,
and its thin glowing right edge is drawn one pixel past that. Because the menu
scrolls up and down, the browser lets it scroll sideways too, and that single
pixel earns a full scrollbar. Phones have the same extra pixel; their scrollbars
stay hidden until you scroll, so there it shows as a brief bar or a tiny sideways
drag. The build removes the overflow and keeps the glowing edge. This slot adds
the rule and a test so it cannot come back. Recommendation: accept.

**What happens if you say no:** the build still fixes the scrollbar (it is a
bug), but nothing tests for it, so a later change can bring it back unnoticed.

```diff
@@ functional-requirements.md:2796 — REQ-113 @@
   - left-edge slide open/close, destination/action/Theme behavior and reduced-motion remain; the trigger is REQ-207's ☰ button and History is a Menu row (REQ-213)
-  - tests or stylesheet assertions cover full-shell height (or visible-bounds equivalent), matching bottom-left radius, and Life Tracker parity
+  - the open tray never scrolls sideways and never shows a horizontal scrollbar at any width, including in a browser that always shows scrollbars: its content width equals its visible width; its right-edge light line stays visible
+  - tests or stylesheet assertions cover full-shell height (or visible-bounds equivalent), matching bottom-left radius, Life Tracker parity, and no sideways overflow of the open tray at 390×844 and 1440×900
@@ functional-requirements.md:2812 — REQ-113 Notes (append) @@
   - amended for the `ui-reimagining-build` pass (2026-09-30): full height below `768px`, floating card at `768px`+
+  - amended by `small-fixes-cats-menu-white` (2026-10-14): the owner saw a horizontal scrollbar along the open tray's bottom on desktop. Measured at 1440×900 and 390×844: clientWidth 319, scrollWidth 320 — the tray's 1px right-edge light line (`::after`, `right: -1px`) overhung the scroll box, and `overflow-y: auto` makes the x-axis scroll too. Removing the overhang alone restored 319 = 319 at both widths
```

- Verdict:
- Reason:

## Blocker questions

None.
