# Design brief — small fixes: cats Easter egg, desktop menu button, White default, menu scrollbar

**What this is:** four small fixes a player will notice, shaped for one build.
**What you need to do:** answer the six verdict slots in `GATE-QUESTIONS.md`.
REQ-099, REQ-044 and FLOW-007 are one decision (White as the default) written
in three places. No blocker.
**What it changes:** the cats come back on every screen that shows the title;
the desktop ☰ becomes a visible quiet button; first-time visitors land on White;
the open menu stops scrolling sideways.

Inputs: `IDEA.md`, `intake/owner-request.md` (evidence, not authority), the
`## Prior run` receipts in `IDEA.md` (input, not scope). Every measurement below
was taken live in the running app; the full record is
`evidence/measurements.md`, screenshots in `.playwright-mcp/` (local, ignored).

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
  The three existing tests in `App.interaction-flows.presentation.test.tsx`
  keep passing.

## 2. Desktop ☰ Menu button

**What the player sees today.** At 1440×900 and 100% zoom the ☰ draws only
14×12 pixels of light — 84 lit pixels inside a 54px button whose fill and edge
are fully transparent until hovered. It is bright enough in every colour
(12.3:1 to 15.1:1 against the header), so contrast is not the problem: the mark
is tiny and the button around it is invisible.

**Proposal (owner's call — REQ-207 block).** At `768px` and wider, the ☰ rests
as a quiet chip: the same faint panel fill and thin colour-tinted edge as the
Add card and Scan buttons beside the question box, and the three bars drawn
about 40% larger (font 1.5rem → 2.1rem, 20×17px of light, 179 lit pixels). The
button stays in the far-left corner, stays 54×54px, and the header stays 68px
tall. Previewed live in all six colours; before/after strip at
`.playwright-mcp/05-menu-button-before-after-strip.png`.

Why this shape: the owner asked for "wider or stand out more while still
subtle". Showing the button's own edge turns an invisible 54px target into a
visible 54px chip — the biggest gain for the least change — and borrowing the
Add card / Scan look keeps it in the app's existing vocabulary instead of a new
loud control. A larger box (56px was tried) grows the header for little gain.

**Build outcome.** Desktop-only CSS in `shell.css` (`.app-header .menu-toggle`
inside the existing `min-width: 768px` block); hover and focus keep today's
accent fill. Phone (`< 768px`) unchanged: 50px, 1.4rem. The hit box still equals
the painted box (REQ-114) — now visibly so. Test: a stylesheet assertion that the
desktop rule carries the edge, fill and glyph size; live check at 1440×900 that
the box is 54px and the header 68px.

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
- First paint matches: `tokens.css`'s `:root` default block carries White's
  values instead of Blue's, and `index.html`'s `theme-color` meta and
  placeholder favicon use White's accent, so a first visit never flashes blue
  before the app starts.
- Tests that pin the default: `palettes.test.ts` line 77 (asserts `"blue"`);
  `themePrefs.test.ts`, `useThemePalette.test.ts` and
  `App.mtg-color-themes.test.tsx` use the constant and follow it;
  `src/test/appliedTheme.ts` falls back to `"blue"` when no profile is set and
  follows the new default. Fixtures that merely pass `"blue"` as an input
  (`FeaturePortalMenu.test.tsx`, `ThemeSection.test.tsx`, `applyPalette.test.ts`,
  `AmbientScene.test.tsx`) are not default pins and stay.

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
right-edge light line stays visible. The build picks the mechanism and proves
both halves (scrollWidth equals clientWidth on desktop and phone; the line still
paints) — for example drawing the line inside the tray's box, or clipping the
x-axis without clipping the line. Product truth: one new acceptance criterion on
REQ-113 (REQ-113 block) so the regression is tested.

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
| A4 | Desktop ☰ size and look | Proposed, not decided: 54px box, resting chip edge+fill, glyph 2.1rem; desktop only | Owner reserved size/look; existing `.icon-chip` pattern (rung 3); owner scoped "desktop" |
| A5 | Fallback for broken/retired saved colour | Follows the default (White) | REQ-099 and FLOW-007 tie fallback to the default (rung 1) |
| A6 | Never-chose returning players | See White | No saved key exists to distinguish them (rung 2) |
| A7 | Fix first paint too | Yes — `:root` tokens, theme-color, favicon | Otherwise a first visit flashes Blue (rung 5) |
| A8 | Scrollbar fix mechanism | Build's choice, bounded by "no sideways scroll, line stays" | Measured cause; smallest reversible scope (rung 4) |

## PRD alignment and proposed product truth

Proposed in `GATE-QUESTIONS.md`, never written to `PRD/sections/` here:

- **REQ-203** — record the picture's placement; refresh In-depth's spec line.
- **REQ-207** — the desktop ☰ rests as a quiet chip with a larger glyph.
- **REQ-099** — White is the default and the fallback (plus the shared-chrome
  spec and system-map lines that say "Blue default").
- **REQ-044**, **FLOW-007** — the same default, where they repeat it.
- **REQ-113** — the open tray never scrolls sideways or shows a horizontal
  scrollbar.

Touches: `apps/frontend/src/components/{BrandMark,StagedStepHeader}.tsx`,
`components/portal/{MtgAssistantApp,DestinationOutlet}.tsx`,
`components/portal/quick-lookup/QuickLookupApp.tsx`,
`components/{ZoneCollectionStep,ZoneConfirmStep,EnrichmentStep}.tsx`,
`components/trade/TradeBalancer.tsx`, `styles/shell.css`, `styles/tokens.css`,
`lib/theme/palettes.ts`, `index.html`, and the tests named above. Frontend and
presentation only: no request contract, prompt, backend, or data change.

## Verification for the build

- `npm test` (frontend) green, with the new REQ-203 tests and the updated
  default pin.
- Live at 390×844 and 1440×900: ten taps on Ask a Question reveal the picture;
  it holds on Trade Balancer and In-depth; Life Tracker shows none.
- Live at 1440×900: ☰ box 54px, header 68px, chip edge visible in all six
  colours.
- Fresh storage: first paint and settled page are White.
- Open tray: scrollWidth equals clientWidth at 390×844 and 1440×900, with
  classic scrollbars forced on; the right-edge line still paints.
