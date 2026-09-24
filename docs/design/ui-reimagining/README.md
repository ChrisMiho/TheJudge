# UI re-imagining — direction 1

The first clickable mockup direction for re-imagining TheJudge's player
screens (everything except Player Life Tracker) around the mana colour a
player picks, at a restrained intensity — the redesign this repo's PRD
approved in `PRD/sections/` (`REQ-200`-`REQ-205`) but has not yet built.
**Nothing here is shipped app code.** `apps/frontend` and `apps/backend` are
untouched; this is a static, self-contained preview the owner reviews before
a later package builds it for real.

Directions 2 and 3 are a follow-on package, kicked off after the owner has
reacted to this one. Mirrors `docs/design/tab-icon/`'s precedent for kept
design-candidate art living outside `PRD/work/`.

## How to open it

Every page under `direction-1/` is plain HTML/CSS/vanilla JS — no build step,
no bundler, no framework. Open `index.html` in this folder in any browser
(`file://` works fine) and click through from there, or open any
`direction-1/*.html` file directly. Resize the window, or use your browser's
device toolbar, to see both the phone (390×844) and desktop (1440×900)
compositions each page targets.

## What's in `direction-1/`

- `tokens.css` — the one authoritative source of the `REQ-200` surface-role
  token set (page ground, colour wash, raised panel fill, panel edge, focus
  ring, primary text, muted text, filled-accent text), one block per profile
  switched by `[data-profile="white|blue|black|red|green|colorless"]`. The
  four `accent`/`accent-strong`/`accent-soft`/`accent-contrast` values in
  each profile are unchanged from `REQ-099`'s shipped values.
- `motifs/` — one original SVG per colour (`REQ-201`): White's gilded
  filigree, Blue's charged vortex/lightning, Black's decay with one hot
  glow, Red's burst inside darkness, Green's forest vines with a pinpoint
  glow, Colorless's inscribed brass-and-bone bands. Drawn for this app; no
  official Wizards of the Coast mana glyph, icon font, logo, or card art
  anywhere in this tree.
- `shell.css` — the single source of the shared chrome skeleton (page shell,
  header/menu rail, brand mark slot, menu tray, overlay/drawer primitives)
  every page below imports rather than redeclaring.
- `shared-chrome-menu.html` — the Menu, brand mark, Theme section, mock-mode
  banner, and overlay demos (feedback modal, history drawer, View Context
  overlay, card-detail popup).
- `quick-question.html` — Quick Question, pre-submit and answered.
- `in-depth-question.html` — every In-Depth Question step.
- `trade-balancer.html` — Trade Balancer, phone tabs and desktop side-by-side.

## Previewing all six colours

Every page's `<html>` tag carries `data-profile="blue"` by default (Blue is
the shipped default, `REQ-099`). To preview another colour, either use the
Theme section on `shared-chrome-menu.html` (it live-updates the page with no
reload) or edit the `data-profile` attribute directly in your browser's
DevTools — valid values are `white`, `blue`, `black`, `red`, `green`,
`colorless`.

## `before/` and `after/`

`before/*.png` are screenshots of **today's shipped app**, captured live from
`npm run dev` on 2026-09-24, one per in-scope destination plus Player Life
Tracker at phone (390×844) and desktop (1440×900) width — the baseline each
mockup page is paired against. `after/life-tracker-*.png` is the one
screenshot pair in this tree: Life Tracker's real screen content composed
inside the new shared chrome, proving `REQ-202`'s inheritance causes no drift
to Life Tracker's own counters or layout. There is no clickable Life Tracker
mockup — Life Tracker's own redesign is out of scope for this pass.

## Entry point

`index.html` is the one page to open for the full review: it links every
mockup above and the Life Tracker before/after pair.
