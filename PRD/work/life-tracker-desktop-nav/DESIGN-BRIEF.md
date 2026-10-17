# Design brief — the desktop Life Tracker gets the same top bar as every other tool

- Package: `life-tracker-desktop-nav`
- Status: refined (graph-controlled refinement, run `graph-20261017-043546`)
- Proposal: `GATE-QUESTIONS.md` — new REQ-248, amended REQ-207, no blockers
- Evidence: `evidence/measurements.md` (live, 2026-10-16)

## The answer in one paragraph

On a screen 768px wide or wider, the Life Tracker stops drawing its own small
header row and shows the same banner every other tool shows: full width,
touching the top of the screen, 68px tall, the big ☰ Menu in the far-left
corner, the brand centred on a band lit in the player's colour. The Life
Tracker's own two buttons — ☀ Day / ☾ Night and ⚙ Game Setup — move into the
right-hand side of that banner, the same spot the Trade Balancer uses for its
price date. The brand stays a plain title on this screen. The life table sits
under the banner and still fits one screen with no scrolling. Below 768px, on a
phone, nothing changes.

## Owner request

> the desktop life tracker has a different navigation bar then the rest of the app, id like to align it for desktop like the rest of the app, the mobile verion is its own unique thing

## What the player sees today (measured 2026-10-16)

**The other tools.** Ask a Question, In-Depth Question and the Trade Balancer
all show one shared banner (the `StagedStepHeader` component, CSS class
`.app-header`). At 1440×900 it spans the whole screen width from the very top
(0,0,1440,68). The ☰ is a 54px box at the far left, drawn as three 45px glowing
bars. The brand ("TheJudge · MTG Assistant", with the breathing orb) sits in the
centre on a lit band carrying the colour's element and a thin bottom edge. The
right side is an optional slot: empty on Ask a Question, the price date on the
Trade Balancer.

**The Life Tracker on desktop.** It draws its own row instead. At 1440×900 the
row is a 1024px-wide strip that starts 24px down and 208px in from the left
(208,24,1024,45). It has no band, no colour, no bottom edge. The ☰ is the
smaller 44px phone-style glyph. The brand is centred in the strip. At the
right sit two pill buttons: ☀ Day (69×36) and ⚙ (36×36). The page also
scrolls by 16px at 1440×900, because the tracker's column is sized for 16px of
padding while the desktop padding is 24px.

**The Life Tracker on a phone.** The same own row, inside the 12px page
padding (12,12,366,45). The other tools' phone banner is 64px tall with a 50px
☰. The owner calls the phone tracker "its own unique thing", so it stays.

## What the player sees after

| Width | Life Tracker top bar | Day/Night and ⚙ |
| --- | --- | --- |
| `≥ 768px` (tablet, desktop) | The shared banner, identical to Ask a Question's: full width, top at y=0, 68px, 54px ☰ with drawn bars, brand centred on the lit band | In the banner's right-hand slot, Day/Night then ⚙, same look, size, labels and behaviour as today |
| `< 768px` (phone) | Unchanged: the tracker's own compact row inside the page padding | Unchanged: at the right of that row |

Opening the ☰ from the tracker's banner opens the same Menu tray as
everywhere else (a floating card at `768px`+). The brand in the tracker's
banner never counts toward the cat-wizard picture. The life table keeps its
width (centred, up to 64rem) and its seats; it just starts below a taller
header, so the rows get slightly shorter to keep everything on one screen.

## Which desktop navigation, exactly

- **Shared desktop navigation the other tools show:** `StagedStepHeader`
  (`apps/frontend/src/components/StagedStepHeader.tsx`) rendering
  `header.app-header` — `PortalSlot` (the ☰ "Switch feature" button lands here),
  `BrandMark` (a tap-target button, REQ-203), and an optional `rightSlot`
  shown only at `768px`+ (`hidden md:block`). It portals into the page shell's
  header slot together with the mock-mode strip, so it sits at the top edge
  outside the page padding (REQ-207). Styles: `apps/frontend/src/styles/shell.css`
  (`.app-header`, `.app-header .menu-toggle`, the `768px` bars) and
  `apps/frontend/src/index.css` (`.app-header` 68px at `768px`+,
  `.page-shell-header`).
- **What the Life Tracker shows instead:** an inline `<header className="grid
  grid-cols-[1fr_auto_1fr] …">` inside its own full-bleed column in
  `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.tsx`,
  holding its own `PortalSlot`, a plain `BrandMark`, and the Day/Night
  (`data-testid="day-night-toggle"`) and ⚙ (`aria-label="Open game setup"`)
  buttons. Because it lacks the `.app-header` class, none of the banner styles
  reach it; the ☰ inside it stays at the phone glyph size.

## Which controls must survive, and where they go

| Control | Today | After, `≥ 768px` | After, `< 768px` |
| --- | --- | --- | --- |
| ☰ Menu ("Switch feature") | Left of the tracker's row, 44px | Far-left of the shared banner, 54px with drawn bars | Unchanged |
| Brand | Centre of the row, plain heading | Centre of the banner, plain heading (`plainBrand`), no tap count (REQ-203) | Unchanged |
| ☀ Day / ☾ Night flip | Right of the row | Banner right-hand slot, first | Unchanged |
| ⚙ Open game setup | Right of the row, after Day/Night | Banner right-hand slot, second | Unchanged |
| Mock-mode strip (mock builds only) | From the full-bleed shell | Directly under the banner, exactly one (REQ-123) | Unchanged |

No control is added or removed. Day/Night still flips the game-wide
designation (REQ-111). ⚙ still opens the Game Setup sheet (REQ-202).

## Where desktop begins: 768px

The app's own phone/desktop split for the header is `768px`, found in code and
product truth:

- `screen-layout.md` viewport bands: phone `< 768px`, tablet `768–1023px`
  ("wide enough for desktop shell rules"), desktop `≥ 1024px`.
- The shared banner switches at `768px`: height 64 → 68px (`index.css`
  `@media (min-width: 768px) { .app-header { min-height: 68px } }`); the ☰
  becomes the 54px box with drawn 45px bars (`shell.css`
  `@media (min-width: 768px)`); measured 68px tall with a 54px ☰ at 768×1024.
- The banner's right-hand slot shows at `768px`+ (`hidden md:block`, Tailwind
  `md` = 768px), the precedent the Trade Balancer's price date set (REQ-215).
- The Menu tray becomes a floating card at `768px`+ (REQ-207).

So "desktop" in this change means the whole `≥ 768px` range, tablets included.

## Design

1. From `768px` up, the Life Tracker mounts the shared `StagedStepHeader`
   with `plainBrand` and a `rightSlot` holding today's Day/Night and ⚙ buttons
   (same markup, classes, labels and handlers).
2. Below `768px`, the tracker's current inline row stays exactly as it is.
3. One CSS media query at `768px` decides which header shows; no JavaScript
   viewport detection (REQ-096). `FeaturePortalMenu` already tracks every
   registered `PortalSlot` and docks the ☰ into whichever one is visible, so
   the ☰ follows the visible header. The build must confirm the ☰ re-docks
   when a window is resized across `768px`, and that only one ☰ is visible
   and focusable at any width.
4. The life table's column keeps its width and seat layout. Its height is
   re-derived so the table fills the space under the banner with no page
   scroll at every player count; the desktop page must not scroll at 1440×900
   or 768×1024 (today it scrolls 16px at 1440×900).
5. In mock builds, exactly one mock-mode strip is mounted at every width. The
   shared header renders its own strip and the full-bleed shell renders
   another, so the build must make sure the tracker shows one, directly under
   the banner at `768px`+ and where it is today below.

## Decisions and assumptions (assumption ladder)

Graph-controlled refinement: each open point resolved from the first source
that answers it (`PRD/instructions/preparation-contract.md`).

1. **Desktop starts at 768px, not 1024px.** Source: product truth and code
   (rungs 1–3) — the phone band is `< 768px`, and every part of the shared
   banner switches at `768px` (see above). The owner's word "mobile" maps to
   the phone band. Blocker test: changing the threshold would change what
   tablets see (condition 1 holds), but the PRD's phone band and the banner's
   own switch point give an authoritative basis (condition 2 fails), so it is
   not a blocker. The owner can `edit` REQ-248 if tablets should keep the
   phone row.
2. **Day/Night and ⚙ go in the banner's right-hand slot, in today's order.**
   Source: established pattern (rung 3) — the slot exists for exactly this, a
   destination's own header item at `768px`+ (REQ-215, the price date). REQ-111
   requires Day/Night "in the tracker header"; the banner is the tracker's
   header, so REQ-111's wording still holds.
3. **The controls keep today's look and size (36px tall).** Source: preserve
   user-visible behaviour (rung 5); the request is about the bar, not the
   buttons. They sit under the 44px touch floor (NFR-001) today on both
   widths; that is offered separately below, not changed here.
4. **The brand stays a plain heading.** Source: REQ-203 — Life Tracker shows
   the brand but never counts taps or reveals the cat wizard.
5. **The table keeps its width and layout; only its height adapts.** Source:
   REQ-202 (no change to the table's layout in chrome work) and DEC-136
   (one-screen fit at every player count).
6. **Phone is out of scope entirely.** Source: the owner's own words. The
   390×844 before/after screenshots must match.
7. **Use the shared header as it is.** Source: REQ-202 — the tracker consumes
   shared chrome with no fork or per-destination override. `StagedStepHeader`
   already exposes `rightSlot` and `plainBrand`, so no shared component
   changes.

## Amendment set — line-level grep and dispositions

Grep run over `PRD/sections/` (excluding the retired `decisions*` index) for
the shared bar wording and the Life Tracker bar:

- `grep -rn -i "banner header\|header control\|staged header\|right-hand slot\|StagedStepHeader\|app-header\|full-bleed destination\|⚙\|gear\|plain heading" PRD/sections/`
- `grep -rn -i "life.tracker\|tracker" PRD/sections/ | grep -i "header\|nav\|bar\b\|menu\|title\|day/night\|day-night\|banner\|brand\|setup button\|open game setup"`

| # | Hit (file:line) | What it says | Disposition |
| --- | --- | --- | --- |
| 1 | `screen-layout.md:64` | Suite shell notes: banner header sits above the page padding, flush with the top | No change — shell row; the tracker row (hit 3) carries the tracker's header |
| 2 | `screen-layout.md:89` | Menu row, phone: ☰ at the left of the banner header | **Amend** under REQ-207 (Diff 3): the phone tracker's ☰ is in its own row |
| 3 | `screen-layout.md:221` | Life Tracker row: one-screen fit; full-bleed destination chrome | **Amend** under REQ-248 (Diff 3): add a Header line for both widths |
| 4 | `screen-layout.md:236` | Trade Balancer price date in the staged header's right slot | No change — the precedent this design follows |
| 5 | `user-flows.md:228` (FLOW-010 step 1) | User taps the ☰ at the left of the current screen's banner header | No change — the ☰ stays at the left of the tracker's header at every width; which header is a banner is REQ-207's detail, amended there |
| 6 | `user-flows.md:298` | The tracker header always shows day/night | No change — still true at both widths |
| 7 | `user-flows.md:308` | Old saves load; the header control remains available | No change |
| 8 | `system-map.md:235, 243, 249, 571, 572` | Summaries of density, motion, mock banner, feature portal and their files | No change — summaries, not size specs; build may add `PlayerLifeTrackerApp` as a `StagedStepHeader` caller if it lists callers |
| 9 | `system-map.md:550` | Life Tracker summary | No change |
| 10 | `life-tracker/README.md:19` | "a header control tracks game-wide day/night" | **Amend** under REQ-248 (Diff 2): add where the header sits at each width |
| 11 | `life-tracker/README.md:74–76` | Day/night header control section | **Amend** under REQ-248 (Diff 2): add the placement bullet |
| 12 | `shared-chrome/README.md:56` | Life Tracker and Trade Balancer render full-bleed | No change — the tracker's content stays full-bleed |
| 13 | `shared-chrome/README.md:72, 504–505` | Known gap (REQ-123): full-bleed destinations measured header controls covered by the mock strip, more than one strip mounted | No change in the proposal — REQ-248 requires one strip under the tracker's banner; build updates the known-gap note only if its mock-mode measurement shows the tracker cleared at both widths |
| 14 | `shared-chrome/README.md:125–139` | ☰ at the left of a banner header flush with the top edge | **Amend** under REQ-207 (Diff 2): add the right-slot and phone-tracker bullet |
| 15 | `shared-chrome/README.md:140–141` | Life Tracker's title stays a plain heading | No change — kept by REQ-248 |
| 16 | `shared-chrome/README.md:579` | Where the header chrome lives | No change |
| 17 | `functional-requirements.md:944` | REQ-045 title: inline step label in the staged header | No change — In-Depth steps |
| 18 | `functional-requirements.md:1591, 1593, 1596` | REQ-067: one ☰ at the left of every destination's banner header, docking through the destination's `PortalSlot` | No change — at `768px`+ now literally true for the tracker; below, the ☰ still docks through the tracker's `PortalSlot`; the phone exception is recorded in REQ-207 |
| 19 | `functional-requirements.md:1936` | REQ-081: day/night always available in the tracker header | No change — still true |
| 20 | `functional-requirements.md:2322` | REQ-096: mobile-first automatic rules for the staged header and others | No change — REQ-248 follows it (CSS media query, no JS detection) |
| 21 | `functional-requirements.md:2607` | REQ-105 scope note: outer shell, header, banner untouched by the chat styling | No change |
| 22 | `functional-requirements.md:2646, 2653` | REQ-107: every destination shows the same ☰ header control; no History rail zone | No change — one ☰ per screen, same control |
| 23 | `functional-requirements.md:2749, 2751, 2755` | REQ-111: day/night control in the tracker header | No change — the banner is the tracker's header at `768px`+ |
| 24 | `functional-requirements.md:2793` | REQ-113: open Menu reads as the full left side of the shell | No change |
| 25 | `functional-requirements.md:2823, 2826` | REQ-114: ☰ box equals its paint; on the tracker, life taps near the header never hit the Menu | No change — REQ-248 restates the tracker check |
| 26 | `functional-requirements.md:2859` | REQ-115: Menu-only destinations keep an opaque tray | No change |
| 27 | `functional-requirements.md:3029, 3031` | REQ-123: no header control intersects the mock strip; one strip mounted | No change — REQ-248 requires it for the tracker's banner |
| 28 | `functional-requirements.md:3364` | REQ-136 amendment: corner rail retired for the banner's ☰ | No change |
| 29 | `functional-requirements.md:3437` | REQ-140: tracker → In-Depth seed on Menu selection only | No change |
| 30 | `functional-requirements.md:3521` | REQ-143: one outside-click implementation | No change |
| 31 | `functional-requirements.md:5114–5160` | REQ-202: tracker inherits shared chrome; no fork, no per-destination override; screenshot pair at 390×844 and 1440×900 | No change — REQ-248 consumes the shared header unforked, and its slices attach the pair |
| 32 | `functional-requirements.md:5213, 5235` | REQ-203: tracker shows the brand but is excluded from the tap count; cat under the banner header | No change — REQ-248 keeps the plain brand |
| 33 | `functional-requirements.md:5393–5400` | REQ-207: the banner; right slot shows the price date at `768px`+; header top at y=0 at every width | **Amend** (REQ-207 block, Diff 1): add the tracker's buttons to the right slot and the phone-tracker exception |
| 34 | `functional-requirements.md:5663` | REQ-215: price date in the staged header's right slot at `768px`+ | No change — the precedent |
| 35 | `functional-requirements.md:5360` | REQ-206: Add in-depth details carry | No change — unrelated hit on "menu" |
| 36 | `non-functional-requirements.md:241` | NFR-014: Life Tracker download size | No change — unrelated |
| 37 | `trade-balancer/README.md:50` | Price date in the staged header's right slot | No change |
| 38 | `in-depth/README.md:534–535` | Cat under the banner header; tracker shows the title but never counts | No change |

## Touched files (build)

- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.tsx`
  — mount `StagedStepHeader` (`plainBrand`, `rightSlot`) for `768px`+, keep the
  inline row for below; re-derive the table column's height.
- `apps/frontend/src/index.css` (or the tracker's own classes) — the `768px`
  show/hide pair and the height fit; no change to `.app-header` itself.
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.test.tsx`
  — the structure tests in REQ-248.
- Possibly `apps/frontend/src/components/PageShell.tsx` only if the single
  mock-strip rule needs it for the full-bleed variant (REQ-123).
- `PRD/sections/` edits from the approved `GATE-QUESTIONS.md`, applied by intent
  at build.

## Acceptance criteria (summary — the binding text is REQ-248 in `GATE-QUESTIONS.md`)

- At 1440×900 and 768×1024 the tracker's header matches Ask a Question's
  banner (0,0,W,68; ☰ 10,7,54,54) with Day/Night then ⚙ in the right slot.
- The brand on the tracker is a plain heading.
- No page scroll at 1440×900, 768×1024 or 390×844, at 2 and 8 players.
- One mock-mode strip in mock builds, clear of every header control.
- At 390×844 the header and table match today's numbers, and the before/after
  screenshots match.
- Resizing across 768px swaps headers with no reload; one ☰ visible.
- PR carries the REQ-202 screenshot pair (390×844 and 1440×900), plus 768×1024.

## Non-goals

- Any change to the phone Life Tracker.
- Any change to the other tools' banner, the Menu tray, or the shared header
  component.
- Any change to life totals, counters, seats, persistence, the In-Depth seed,
  or the Game Setup, Counters and confirm sheets.
- Resizing the Day/Night and ⚙ buttons.

## Follow-ups (offered separately, not in this proposal)

- The Day/Night and ⚙ buttons are 36px tall on every width, under the 44px
  touch floor (NFR-001). A small change could raise them to 44px.

## Prior runs

From `IDEA.md` (receipts not reopened): shared-chrome-spec 2026-08-27,
player-life-tracker 2026-08-03 and its refinement 2026-08-05, life-tracker-spec
2026-08-25, life-tracker-seat-map 2026-09-03, life-tracker-seat-oriented-default
2026-10-04, center-menu-tab-prominence 2026-08-04 and follow-up 2026-08-05,
ui-reimagining 2026-09-24, in-depth-spec 2026-08-28.
