# Measurements — small-fixes-cats-menu-white

**What happened:** refinement ran the app from this worktree (Vite dev server,
mock provider, port 5391, stopped afterwards) in Playwright Chromium 155 at
device-pixel-ratio 1 (100% zoom) and measured all four items live on
2026-10-14 at commit `129171a0`. Screenshots are in `.playwright-mcp/` beside
this file (git-ignored, local evidence only); every number below is copied from
the live page, not inferred from code.

**What it means for you:** each of the four problems is real and has one named
cause. Numbers below back the proposals in `GATE-QUESTIONS.md`.

## 1. Cats Easter egg

| Screen (1440×900 and 390×844) | Brand mark is | 12 taps reveal the cat? |
| --- | --- | --- |
| Ask a Question (`/quick-lookup`) — the screen the app opens on | `<h1>` heading, no tap handler | No (0 cat images after 12 clicks) |
| In-depth details, Game step (`/in-depth`) | `<button>` | Yes — 9 taps: 0 images; 10th tap: 1 image, 224×224px at x=608,y=225 (`09-desktop-indepth-game-context-cats-revealed.png`) |
| In-depth details, Zones step (after the reveal above) | `<h1>` | Cat disappears (0 images) though it was revealed one step earlier |
| Trade Balancer (`/trade-balancer`) | `<h1>` | No handler |
| Life Tracker | `<h1>` (plain `BrandMark`) | Excluded by REQ-203 — correct today |

- Brand-mark button size where it is a button: 168×44.4px at both widths (meets
  the 44px floor REQ-203 asks for).
- Cause: only `MtgAssistantApp.tsx`'s game-context step passes `onBrandClick`
  (line 878). The tap count is local state in that component (line 188) and the
  image renders only inside that step (lines 881-893). REQ-203's suite-wide count
  never reached code: `git log -S REQ-203 -- apps/frontend/src` finds no commit.
- Placement probe: a 224px cat inserted directly under the banner header (and
  the mock-mode strip) on Ask a Question and Trade Balancer kept the document at
  exactly the viewport height at 390×844 and 1440×900 — no page scroll
  (`10-probe-cat-under-header-ask-*.png`, `11-probe-cat-under-header-trade-*.png`).
  On Trade Balancer at 390×844 the side panel below gets shorter to make room.

## 2. Desktop ☰ Menu button (1440×900, 100% zoom)

| Measure | Today | Proposal preview (CSS injected live) |
| --- | --- | --- |
| Button box | 54×54px at x=9.6, y=6.5 | 54×54px, same spot |
| Glyph font size | 24px (1.5rem) | 33.6px (2.1rem) |
| Painted ink of the ☰ glyph | 14×12px, 84 lit pixels (2.9% of its own box) | 20×17px, 179 lit pixels |
| Resting fill / edge | transparent / transparent — the 54px box is invisible until hover | panel fill at 80%, 1px edge in the colour's accent at 38% (the Add card / Scan chip look) |
| Header height | 68px | 68px (a 56px box grew it to 69.8px, so the box stays 54) |

Glyph contrast against the header backdrop (peak ink vs median background
luminance), today: Blue 14.67:1, White 12.25:1, Black 15.09:1, Red 15.05:1,
Green 14.26:1, Colorless 15.04:1. Proposal: Blue 15.02:1, White 14.24:1, Red
15.12:1. **Contrast is not the problem; size and an invisible resting box are.**

Reference: the Add card / Scan chips (`.icon-chip`) are 44px tall with fill
`color-mix(--surface-panel 80%)` and a 1px `--surface-edge` border.

Phone (390×844) today: 50×50px box, 22.4px glyph — unchanged by the proposal.

Before/after strip, all six colours: `05-menu-button-before-after-strip.png`
(top row today, bottom row proposal). Full-page previews:
`04-proposal54-1440-<colour>.png`.

## 3. Default colour

- First visit with empty storage: `<html data-profile="blue">`, and no
  `thejudge.theme.paletteId` key is written until the player picks a colour.
- A White profile exists: id `white`, name `White` (`palettes.ts`), the cream /
  warm-gold light with the low-sun ray scene on the same dark ground every
  profile uses (`02-desktop-1440-white-ask.png`). It is not a light page.
- Blue paints before the app starts: `tokens.css` opens with
  `:root, [data-profile="blue"]`, and `index.html` carries
  `<meta name="theme-color" content="#0050d8">` and a blue square favicon.

## 4. Menu tray horizontal scrollbar

| Width | Tray box | clientWidth | scrollWidth | overflow-x (computed) |
| --- | --- | --- | --- | --- |
| 1440×900 | 320×900 at x=0,y=0, radius 0 | 319 | 320 | `auto` |
| 390×844 | 320×844 at x=0 | 319 | 320 | `auto` |

- No child element overflows (a sweep of every descendant found none). The
  overflow is the tray's own `::after` — the 1px right-edge light line, placed
  at `right: -1px; width: 1px` (`shell.css` `.menu-tray::after`).
- Why a scrollbar: the tray sets `overflow-y: auto`; by the CSS overflow rules a
  `visible` x-axis then computes to `auto`, so the 1px overhang makes the tray
  scroll sideways.
- Reproduced with classic (always-shown) scrollbars forced on: a 12px bar along
  the tray's bottom at both widths (clientHeight 900→888 desktop, 844→832
  phone; `06-desktop-1440-tray-scrollbar-forced-visible.png`,
  `08-phone-390-tray-scrollbar-forced-visible.png`).
- Hiding the `::after` alone: scrollWidth 319 = clientWidth 319 and the bar is
  gone at both widths (`07-desktop-1440-tray-after-hidden-no-scrollbar.png`).
- Phone: the same 1px overflow exists. Phone browsers use overlay scrollbars,
  so it shows only as a brief bar or a 1px sideways drag while scrolling, not a
  resting bar.

## Side observation (not in scope)

At 1440×900 the open tray is full height, flush top-left (x=0, y=0, 320×900,
radius 0). REQ-207 and REQ-113 say it should be a floating, rounded card inset
from the viewport edges and sized to its content at `768px`+. This package does
not change it; recorded for a follow-up.
