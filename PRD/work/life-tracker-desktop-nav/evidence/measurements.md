# Measurements — Life Tracker header vs the other tools

**What happened:** on 2026-10-16 I ran the frontend on its own (Vite dev
server, port 5180, this worktree at `731e1bc0`) and measured the top bar of the
Life Tracker, Ask a Question and Trade Balancer at desktop (1440×900), at the
phone/desktop boundary (768×1024) and at phone (390×844).

**What it means:** at every width, the other tools show the shared banner
header and the Life Tracker shows its own smaller header row. On desktop the
difference is large: the banner is full width, flush to the top, 68px tall,
with a 54px ☰; the Life Tracker's row is a 1024px-wide strip starting 24px
down, 45px tall, with a 44px ☰ and no coloured band.

## Setup

- Command: `FRONTEND_PORT=5180 npx vite --port 5180 --strictPort` from
  `apps/frontend/` (dependencies installed with `npm ci` in the worktree).
  `ASK_AI_PROVIDER` unset, so this is a non-mock build: no mock-mode strip was
  mounted on any screen (`.mock-mode-banner` count 0). No backend ran.
- Browser: Playwright (Chromium), White profile (the default), reduced motion
  off. Rects are `getBoundingClientRect()` rounded, as `x,y,w,h` in CSS px.
- The Life Tracker loaded a saved 8-player game from browser storage
  (`thejudge.lifeTracker.state`, grid layout). Header measurements do not
  depend on player count; table measurements are for 8 players.
- Trade Balancer: the price date did not render (no backend, 2 console
  errors), so its right-hand slot measured empty (height 0). Its presence at
  `768px`+ is product truth (REQ-215), not re-measured here.
- Screenshots (gitignored, local only): `PRD/work/life-tracker-desktop-nav/.playwright-mcp/`
  — `life-tracker-1440x900.png`, `quick-question-1440x900.png`,
  `trade-balancer-1440x900.png`, `life-tracker-390x844.png`,
  `quick-question-390x844.png`.

## Desktop — 1440×900

| Element | Ask a Question | Trade Balancer | Life Tracker |
| --- | --- | --- | --- |
| Header element | `header.app-header` (shared banner) | `header.app-header` | bare `<header>` with Tailwind `grid grid-cols-[1fr_auto_1fr]` — no `.app-header` |
| Header rect | 0,0,1440,68 | 0,0,1440,68 | 208,24,1024,45 |
| Position | `sticky` | `sticky` | `static` |
| Band background | radial + linear gradient, 1px bottom edge | same | none, no edge |
| ☰ (`Switch feature`) | 10,7,54,54; glyph replaced by 45px drawn bars | 10,7,54,54 | 208,25,44,44; plain glyph at 17.6px |
| Brand | `button.brand-mark` 636,11,168,44 (tap target, REQ-203) | `button.brand-mark` 636,11,168,44 | `h1.brand-mark` 636,24,168,44 (plain heading) |
| Right side | empty slot 812,34,618,0 | empty slot (price date absent locally) | Day/Night 1119,29,69,36 and ⚙ `Open game setup` 1196,29,36,36 |
| Content below | `.page-content` top at y=68 (432,68,576,832) | `.page-content` top at y=68 (272,68,896,832) | life table 208,77,1024,815 |
| Page scroll | none (document 900 = viewport) | none (900) | **16px** (document 916 > 900) |

## Boundary — 768×1024

| Element | Ask a Question | Life Tracker |
| --- | --- | --- |
| Header rect | `app-header` 0,0,768,68 | bare header 15,15,737,45 |
| ☰ | 10,7,54,54 (desktop form already) | 15,16,44,44 |
| Right side | — | Day/Night 640,20,69,36; ⚙ 717,20,36,36 |
| Life table | — | 15,69,737,939 |
| Page scroll | — | none (1024) |

At 768px the shared banner is already in its desktop form (68px tall, 54px ☰
with drawn bars), confirming the code's switch point: `index.css`
`@media (min-width: 768px) { .app-header { min-height: 68px } }` and
`styles/shell.css` `@media (min-width: 768px) { .app-header .menu-toggle … }`.

## Phone — 390×844

| Element | Ask a Question | Trade Balancer | Life Tracker |
| --- | --- | --- | --- |
| Header rect | `app-header` 0,0,390,64 | `app-header` 0,0,390,64 | bare header 12,12,366,45 |
| ☰ | 10,7,50,50 (glyph 22.4px) | 10,7,50,50 | 12,13,44,44 (glyph 17.6px) |
| Brand | `button` 111,9,168,44 | `button` 111,9,168,44 | `h1` 85,12,168,45 |
| Right side | empty | empty | Day/Night 265,17,69,36; ⚙ 342,17,36,36 |
| Content below | — | — | life table 12,65,366,759 |
| Page scroll | none (844) | none (844) | none (844) |

The phone Life Tracker also differs from the other tools' phone banner. The
owner's request keeps it as it is, so these phone numbers are the
"unchanged" baseline the build must reproduce.

## Findings that shape the design

1. The other tools all render one shared component, `StagedStepHeader`
   (`apps/frontend/src/components/StagedStepHeader.tsx`), which portals the
   `.app-header` banner and the mock-mode strip into the page shell's header
   slot. It already takes a `rightSlot` (shown at `768px`+, hidden below via
   `hidden md:block`; Trade Balancer's price date uses it) and a `plainBrand`
   flag (brand as a plain heading, no tap count).
2. The Life Tracker (`components/portal/life-tracker/PlayerLifeTrackerApp.tsx`)
   renders its own `<header>` inline inside its full-bleed column, with its own
   `PortalSlot`, `BrandMark` (no click handler) and the two controls. It never
   mounts `StagedStepHeader`.
3. The app's phone/desktop split for the header is `768px`: the banner's
   height, the ☰'s size and bars, the Menu tray's floating-card form and the
   header's right-hand slot all switch there. `screen-layout.md` names
   `< 768px` the phone band.
4. The desktop Life Tracker already scrolls the page by 16px at 1440×900: its
   column is `h-[calc(100dvh-2rem)]` while the full-bleed padding at that width
   is 24px top and bottom (48px). The phone (12px padding) fits.
5. The Day/Night and ⚙ controls are 36px tall today, under the 44px touch floor
   (NFR-001). Pre-existing on both widths; noted, not in this change's scope.

## Menu button docking across 768px — live probe (define attempt 2)

**What happened:** quality-check found that the Menu picks the ☰'s home by
skipping only slots inside an element with the HTML `hidden` attribute
(`FeaturePortalMenu.tsx:182-184`). I checked that live, then tried the fix on
the same page: pick the slot the stylesheet actually draws, and re-check when
the slot holding the ☰ changes size.

**What it means:** today's rule would leave the ☰ invisible on one side of
768px once the tracker has two headers. The fix keeps exactly one visible,
focusable ☰ at every width tested, in both resize directions, and never reads
the screen width in JavaScript.

Setup: same Vite dev server (port 5180, this worktree at `50061e1f`, non-mock),
Playwright Chromium, Life Tracker reached through the ☰ Menu (Ask a Question
mounted and `hidden` behind it). No repo code changed; the probe injected a
`<style>` and test nodes from the browser console, then the page was closed.

### 1. Today's rule misses a header hidden by a media query

Injected `@media (min-width: 768px) { [data-probe-hide] { display: none } }`
and put `data-probe-hide` on the tracker's own `<header>` (standing in for the
compact row hidden at desktop). Two `.portal-slot` nodes were in the page:
Ask a Question's (inside `[hidden]`) and the tracker's (holding the ☰).

| Width | Tracker slot inside `[hidden]`? | Tracker slot has a layout box (`getClientRects().length`) | Today's rule picks | ☰ rect |
| --- | --- | --- | --- | --- |
| 1440 | no | 0 | the tracker slot | 0,0,0,0 (not visible) |
| 700 | no | 1 | the tracker slot | 14,15,44,44 |
| 768 | no | 0 | the tracker slot | 0,0,0,0 (not visible) |

A `ResizeObserver` on the slot holding the ☰ fired on every crossing: 0×0 at
1440, 240×44 at 700, 0×0 at 768.

### 2. The proposed rule keeps one ☰ on screen

Two probe headers with real media queries: "wide" shown at `min-width: 768px`,
"narrow" shown at `max-width: 767px`, each holding one slot, registered
narrow-first (the order the quality-check feared). Rule: among slots not inside
`[hidden]`, take the first with a layout box (`getClientRects().length > 0`);
re-run whenever a `ResizeObserver` on any registered slot fires. One probe
button moved by the rule.

| Width (in resize order) | ☰ docked in | ☰ rect | Focusable | Visible ☰ count |
| --- | --- | --- | --- | --- |
| 768×1024 (start) | wide | 0,0,54,54 | yes | 1 |
| 767×1024 | narrow | 12,100,54,54 | yes | 1 |
| 1440×900 | wide | 0,0,54,54 | yes | 1 |
| 390×844 | narrow | 12,100,54,54 | yes | 1 |

Every move was triggered by the observer (`resize-observer` in the log), with
no `resize` or `matchMedia` listener. Capture (gitignored):
`PRD/work/life-tracker-desktop-nav/.playwright-mcp/dock-probe-1440x900.png`.
Server stopped afterwards; port 5180 free.
