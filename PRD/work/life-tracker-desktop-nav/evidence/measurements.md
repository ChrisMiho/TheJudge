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
