# Gate questions — the desktop Life Tracker gets the same top bar as every other tool

**Decide:** three slots below. One new requirement (REQ-248, reserved here)
and two amendments to existing ones (REQ-207, the shared banner header; REQ-067,
the Menu button's home). No blocker questions.

Every diff is against `PRD/sections/` at `731e1bc0`. Line numbers are where the
hunk starts today. Evidence: `evidence/measurements.md`. The full reasoning and
the amendment-set grep are in `DESIGN-BRIEF.md`.

## REQ-248 — from 768px up, the Life Tracker shows the shared banner, with Day/Night and Game Setup on its right

**What this decides:** whether, on a screen 768px wide or wider, the Life
Tracker drops its own small header row and shows the same top banner as Ask a
Question and the Trade Balancer, with its Day/Night button and its ⚙ Game Setup
button moved into the right-hand side of that banner.

**In plain terms:** every other tool opens under one shared banner: full width,
touching the top of the screen, 68px tall on desktop, the ☰ Menu in the far-left
corner drawn as three wide glowing bars, and the TheJudge brand centred on a
band lit in your colour (REQ-207). The Life Tracker instead draws its own row:
a 1024px-wide strip starting 24px down, 45px tall, a smaller 44px ☰, no
coloured band (measured at 1440×900). With this change, from 768px up the Life
Tracker shows that same banner. Its two own buttons keep their look and job:
Day/Night still flips day and night for the whole game (REQ-111), and ⚙ still
opens Game Setup. They sit at the banner's right, where the Trade Balancer
shows its price date (REQ-215). The brand stays a plain title on this screen,
so tapping it never counts toward the hidden cat-wizard picture (REQ-203). The
life table sits under the banner at today's width and still fits one screen
with no scrolling at every player count (DEC-136). Below 768px, the phone, the
Life Tracker keeps its own row exactly as today, as you asked. 768px is where
the app already switches the banner and the Menu from phone form to desktop
form. So the ☰ never goes missing when a window is resized across 768px, the
Menu's rule for where to put its button changes on every screen: it goes in
the header that is actually showing. Every other screen has one header, so
nothing moves there.

**What happens if you say no:** the desktop Life Tracker keeps its own smaller
header row, and switching to it from another tool still changes the top bar.

### Diff 1 — `PRD/sections/functional-requirements.md` (new REQ-248, appended after REQ-247, line 6605)

```diff
+
+### REQ-248
+- Title: Life Tracker shows the shared banner header from 768px up
+- Priority: medium
+- Description: From `768px` wide (tablet and desktop), Player Life Tracker shows the same banner header as every other destination (REQ-207), with its Day/Night flip and its Game Setup button in the banner's right-hand slot, so the top bar no longer changes when a player switches to the tracker. Below `768px` (phone) the tracker keeps its own compact header row unchanged.
+- Acceptance Criteria:
+  - at `768px`+ the tracker renders exactly one header: the shared banner, through the same shared header component and stylesheet every other destination uses (`.app-header`), not a tracker copy of it. It spans the full viewport width with its top at y=0, and its height, ☰ box, ☰ bars and glow, centred brand, lit band and the colour's element match Ask a Question's banner at the same width — measured at 1440×900 and 768×1024 (on 2026-10-16 Ask a Question's banner was 0,0,W,68 with the ☰ at 10,7,54,54)
+  - the banner's right-hand slot holds, in today's order, the Day/Night flip and then the ⚙ Game Setup button, with today's look, size, visible text and accessible names ("Day and night: currently day. Flip designation." / "Open game setup"); Day/Night still flips the game-wide designation (REQ-111) and ⚙ still opens the Game Setup sheet (REQ-202); the slot's right edge follows the banner's own padding
+  - the brand in the tracker's banner is a plain heading: it counts no taps and never reveals the cat wizard on this screen (REQ-203)
+  - the life table sits below the banner at its current width (centred, up to 64rem) and spacing, and fits one screen at every player count 2–8 with no page scroll: at 1440×900 and 768×1024 the document is exactly the viewport's height (DEC-136; the desktop table scrolled the page by 16px at 1440×900 before this change)
+  - in mock provider mode the mock-mode strip sits directly under the tracker's banner, exactly one strip is mounted, and no header control intersects it (REQ-123)
+  - the ☰ in the tracker's banner opens the same Menu tray as on every other destination, and is hidden and not hit-testable while the tray is open (REQ-127); a life-adjust tap near the banner never opens the Menu (REQ-114)
+  - below `768px` nothing changes: the tracker keeps its compact header row (the ☰, the brand, Day/Night and ⚙ in one row inside the page padding, no lit band), measured at 390×844 on 2026-10-16 as header 12,12,366,45, ☰ 12,13,44,44, Day/Night 265,17,69,36, ⚙ 342,17,36,36 and the table 12,65,366,759, with no page scroll; the 390×844 before/after screenshots match
+  - resizing across `768px`, in either direction, swaps between the two headers with no reload and no change to the game; at any width exactly one ☰ is visible and focusable, and it sits in the header on screen
+  - tests cover: at `768px`+ the shared banner renders with both controls in its right-hand slot and the compact row does not; below `768px` the reverse; the brand is not a tap target on the tracker; one mock-mode strip in mock mode; the controls still flip day/night and open Game Setup; with two slots registered, the Menu docks the ☰ in the slot the stylesheet draws, moves it when the other slot is drawn, and keeps its earlier choice when no layout is available (unit-test DOM). Live checks attached to the PR: the width switch at 390×844, 768×1024 and 1440×900 with the REQ-202 before/after screenshot pair; and a resize-across-`768px` check in one window with no reload (1440 → 767 → 768 → 390 → 1440 wide), recording at each step the ☰'s rect, that it takes keyboard focus, and that exactly one ☰ is visible
+- Constraints:
+  - presentation only: no change to `lib/lifeTracker/` state, persistence, the commander-damage matrix, counters, the one-way In-Depth seed, the table's seat layout, or the Game Setup, Counters and confirm sheets
+  - the switch is a CSS media query at `768px` (the header's existing phone/desktop boundary): both headers stay mounted at every width and the stylesheet shows one, as Trade Balancer's price date already does (REQ-215); no JavaScript viewport detection (REQ-096)
+  - the shared header is consumed through its existing right-hand-slot and plain-brand options; no tracker-specific fork or override of shared chrome (REQ-202)
+  - one shared rule changes, for every destination alike: the Menu docks its ☰ into the registered `PortalSlot` the stylesheet is drawing (a slot inside a header hidden by a media query no longer counts as visible) and re-checks whenever a registered slot appears on or leaves the screen; it never reads the viewport width, a media query or a resize event in JavaScript, so CSS alone decides the layout (REQ-096); destinations with one slot see no change
+  - the Day/Night and ⚙ controls keep today's size; raising them to the 44px touch floor (NFR-001) is a separate change
+- Dependencies:
+  - REQ-207
+  - REQ-202
+  - REQ-203
+  - REQ-111
+  - REQ-123
+  - REQ-215
+  - REQ-096
+  - REQ-067
+  - DEC-136
+- Notes:
+  - reserved and proposed by the `life-tracker-desktop-nav` package (2026-10-16). Owner request, verbatim: "the desktop life tracker has a different navigation bar then the rest of the app, id like to align it for desktop like the rest of the app, the mobile verion is its own unique thing"
+  - measured 2026-10-16 at 1440×900: the tracker's own header was a static 1024px-wide row at 208,24 and 45px tall with a 44px ☰, against the shared banner's 0,0,1440,68 with a 54px ☰ on Ask a Question and Trade Balancer
```

### Diff 2 — `PRD/sections/life-tracker/README.md` (Backed by, line 9; What it is, line 15; Day/night header control, line 74)

```diff
 - Backed by: DEC-101, DEC-102, DEC-103, DEC-132, DEC-136, DEC-139, DEC-170,
   REQ-081, REQ-082, REQ-083, REQ-084, REQ-085, REQ-111, REQ-112, REQ-173,
-  REQ-217, FLOW-013, NFR-001, NFR-006
+  REQ-217, REQ-248, FLOW-013, NFR-001, NFR-006
```

```diff
 to MTG Assistant with one tap. Each player gets a large, seat-rotated life
 card; a per-player counter panel holds commander damage and the rest of the
 counter palette; a header control tracks game-wide day/night; and the whole
 game survives a phone lock or reload because it saves itself as you play.
+
+From `768px` up the tracker sits under the same banner header as every other
+tool, its Day/Night and Game Setup buttons on the banner's right; on a phone
+it keeps its own compact header row.
```

```diff
 ### Day/night header control
 
 - Built: a compact header control always shows the current game-wide
   designation (`day` / `night`); tapping it flips the designation. There is
   no Game Setup toggle and no enable/disable setting — tracking is always
   on. (DEC-132)
+- Built: where the header controls sit. From `768px` up the tracker shows
+  the shared banner header (REQ-207) — full width, flush to the top, the ☰
+  at its far left, the brand centred as a plain heading (no tap count,
+  REQ-203) — and the Day/Night control and the ⚙ Game Setup button sit in the
+  banner's right-hand slot, in that order, at today's size. Below `768px` the
+  tracker keeps its own compact header row: the ☰, the brand, then Day/Night
+  and ⚙, inside the page padding with no lit band. The life table fits one
+  screen under either header (DEC-136). (REQ-248)
```

### Diff 3 — `PRD/sections/screen-layout.md` (Player Life Tracker row, line 216)

```diff
 | Purpose | Live table life/counters |
 | Phone / Desktop | **One-screen fit** for the life table at every player count (DEC-136); full-bleed destination chrome |
+| Header | From `768px`: the shared banner header (REQ-207) at full viewport width, top at y=0, matching Ask a Question's banner, with Day/Night and ⚙ Game Setup in its right-hand slot; the table sits below it at its current width (centred, up to 64rem). Below `768px`: the tracker's own compact header row, unchanged (measured 2026-10-16 at 390×844: header 12,12,366,45; table from y=65). No page scroll at 390×844, 768×1024 or 1440×900 (REQ-248) |
 | Fit | No page scroll for the life table; the counter panel is the content-sized shared sheet (REQ-082, REQ-208) |
 | Sheets | Game Setup fits one phone screen, with names behind an Edit names ▾ collapse and a Done › foot bar; a player's Counters panel is the content-sized shared sheet (REQ-082, REQ-208) with two tabs; Reset / New game confirm in the shared sheet (REQ-208). The table itself is pixel-untouched; every touching slice attaches the 390x844 and 1440x900 before/after pair (REQ-202) |
-| Notes | DEC-101, DEC-136, DEC-139 (retired by REQ-082 as amended), REQ-082 |
+| Notes | DEC-101, DEC-136, DEC-139 (retired by REQ-082 as amended), REQ-082, REQ-248 |
```

- Verdict:
- Reason:

## REQ-207 — the shared banner's right-hand slot also carries the Life Tracker's buttons, and the phone Life Tracker keeps its own row

**What this decides:** whether the shared banner rule (REQ-207) is updated to
say two things: from 768px up its right-hand side also holds the Life
Tracker's Day/Night and Game Setup buttons, and below 768px the Life Tracker is
the one screen that keeps its own header row instead of the banner.

**In plain terms:** REQ-207 is the rule for the top banner on every screen: ☰
on the left, brand centred on a lit band, an optional slot on the right, and
the banner touching the top edge of the screen at every width. Today it says
the right slot shows only the Trade Balancer's price date from 768px up. This
amendment adds the Life Tracker's two buttons to that slot (REQ-248), and
writes down the phone exception you asked for: below 768px the Life Tracker
keeps its own compact row, so the "touches the top edge" rule does not apply
to the phone Life Tracker. Nothing changes for any other screen. This keeps the
shared rule and the Life Tracker rule from contradicting each other.

**What happens if you say no:** REQ-207 keeps saying the right slot is the
price date only and that every screen at every width shows the banner, which
contradicts REQ-248 if you accept it and the phone Life Tracker as it is today.
If you reject REQ-248 too, reject this one.

### Diff 1 — `PRD/sections/functional-requirements.md` (REQ-207, line 5399)

```diff
-  - the header is a banner: ☰ at the left (at least 44px; about a quarter larger than today's trigger on a phone and a third on desktop; at `768px`+ its three bars are drawn 45px wide and thin, with no box or outline at rest, and it stays in the far-left corner at the same box size, so the header's height is unchanged; at every width the bars carry a soft glow tinted by the colour's light, and below `768px` the ☰ keeps its size), the brand centred (a breathing orb holding the colour's badge, the wordmark, "MTG Assistant") on a lit band with a hairline of the colour's light along its foot, and each profile's element drawn across the band (White low-sun rays at half strength; Blue a scatter of arcane shapes; Black fog pooling at the ends; Red a hot band with embers; Green a scatter of leaf and tree shapes; Colorless small triangles, rings, arcs, dots and crosses); the right-hand slot shows Trade Balancer's price date at `768px`+; the brand keeps the cat-wizard Easter egg (REQ-203)
+  - the header is a banner: ☰ at the left (at least 44px; about a quarter larger than today's trigger on a phone and a third on desktop; at `768px`+ its three bars are drawn 45px wide and thin, with no box or outline at rest, and it stays in the far-left corner at the same box size, so the header's height is unchanged; at every width the bars carry a soft glow tinted by the colour's light, and below `768px` the ☰ keeps its size), the brand centred (a breathing orb holding the colour's badge, the wordmark, "MTG Assistant") on a lit band with a hairline of the colour's light along its foot, and each profile's element drawn across the band (White low-sun rays at half strength; Blue a scatter of arcane shapes; Black fog pooling at the ends; Red a hot band with embers; Green a scatter of leaf and tree shapes; Colorless small triangles, rings, arcs, dots and crosses); the right-hand slot shows Trade Balancer's price date at `768px`+, and Life Tracker's Day/Night flip and Game Setup button at `768px`+ (REQ-248); the brand keeps the cat-wizard Easter egg (REQ-203)
+  - one exception, by owner decision: below `768px` Player Life Tracker keeps its own compact header row (the ☰, the brand, Day/Night and Game Setup in one row inside the page padding, no lit band) instead of the banner, so the criteria on the banner's look and top edge do not apply to the phone tracker (REQ-248)
```

```diff
   - REQ-213
   - NFR-006
   - NFR-013
   - FLOW-007
+  - REQ-248
 - Notes:
```

```diff
   - amended by `small-fixes-cats-menu-white` (2026-10-14): the owner found the desktop ☰ "almost invisible" at normal zoom. Measured live at 1440×900, 100% zoom: the glyph painted 14×12px of light (84 lit pixels) inside a 54px box with a transparent fill and edge; contrast was 12.3:1–15.1:1 across the six profiles, so size was the cause. A first proposal (an `.icon-chip`-style box around a 2.1rem glyph) was previewed and declined by the owner ("not the vibe"); from live previews of 30/34/40px bars with glow, then 40/45/50px, the owner chose 45px bars, 2.5px thick and 7px apart, with a soft glow (about 6px, the colour's `--accent` mixed about half with white) on the bars only, and the same glow at today's size on a phone. 50px was not chosen: it nearly filled the 54px box
+  - amended by `life-tracker-desktop-nav` (2026-10-16): the owner asked for the desktop Life Tracker's top bar to match the rest of the app and for the phone tracker to stay its own thing. The right-hand slot now also carries the tracker's Day/Night and Game Setup buttons at `768px`+, and the phone tracker's own header row is recorded as the one exception to the banner. Measured live 2026-10-16: at 1440×900 the tracker's own row was 208,24,1024,45 against the banner's 0,0,1440,68
```

### Diff 2 — `PRD/sections/shared-chrome/README.md` (The Menu corner rail and tray, line 128)

```diff
 - Built: the suite's single navigation affordance is the **☰ Menu button** at the
   left of a banner header flush with the top edge of the screen (outside the page
   padding) — at least 44px, about a quarter larger than the former
   corner rail on a phone and a third on desktop, its bars drawn 45px wide at
   `768px`+ and carrying a soft colour-tinted glow at every width — with the
   brand centred (a
   breathing orb with the colour's badge, the wordmark, "MTG Assistant") on a lit
   band carrying a hairline of the colour's light and the profile's own element.
   Selecting ☰ opens the Menu tray, which slides in from the left: full height of
   the visible shell side below `768px`, a floating inset rounded card sized to its
   content at `768px`+. The step-name text renders as an in-flow eyebrow above each
   step's own content, not in header chrome. (REQ-207, DEC-109, DEC-133)
+- Built: the banner's right-hand slot is empty except on two destinations at
+  `768px`+: Trade Balancer's price date (REQ-215) and Life Tracker's Day/Night
+  and Game Setup buttons (REQ-248). Below `768px` Life Tracker is the one
+  destination without the banner: it keeps its own compact header row — the ☰,
+  the brand as a plain heading, Day/Night and Game Setup — inside the page
+  padding. (REQ-207, REQ-248)
```

### Diff 3 — `PRD/sections/screen-layout.md` (Feature-portal Menu rail + tray row, line 89)

```diff
-| Phone | ☰ Menu button (≥44px) at the left of the banner header. Open tray: slides in from the left, full height of the **visible shell side**; opaque over destination content |
+| Phone | ☰ Menu button (≥44px) at the left of the banner header (on Life Tracker, at the left of its own compact header row, REQ-248). Open tray: slides in from the left, full height of the **visible shell side**; opaque over destination content |
```

- Verdict:
- Reason:

## REQ-067 — the Menu button's home rule names the phone Life Tracker's own row

**What this decides:** whether the Menu rule (REQ-067) gets a short pointer
saying that on the phone Life Tracker the ☰ sits in the tracker's own row, and
that on a screen with one header per width the ☰ goes in the header showing.

**In plain terms:** REQ-067 is the rule for the ☰ Menu button itself: one ☰
"at the left of every destination's banner header", placed through that
screen's slot for it (a `PortalSlot`, the spot in a header the ☰ moves into).
Below 768px the Life Tracker has no banner, it has its own compact row, and
that stays true under REQ-207's phone exception. Someone reading REQ-067 on
its own would expect a banner there. This adds one pointer in two places: on
the phone Life Tracker the ☰ is at the left of its own row, and where a screen
has a different header at each width (only Life Tracker, REQ-248), the ☰ goes
in the header that is showing. Nothing changes for the player beyond REQ-248.

**What happens if you say no:** REQ-067 keeps saying every screen's ☰ sits in
a banner. REQ-207's exception still records the phone tracker, so nothing
breaks; the Menu rule just reads wrong on the phone Life Tracker for anyone
who reads it alone. If you reject REQ-248, reject this one too.

### Diff 1 — `PRD/sections/functional-requirements.md` (REQ-067, Description line 1591, criterion line 1593, Dependencies and Notes lines 1613–1621)

```diff
-- Description: The app must provide a first-class **feature portal** that owns top-level navigation chrome — one ☰ Menu button at the left of every destination's banner header (REQ-207) — opening the registered destinations, action entries, and palette-only Theme band. Destinations come from an extensible registry rather than shipping their own entry chrome; the Menu lists **Ask a Question** (`quick-lookup`, also current while `in-depth` is open), **Question History**, **Life Tracker** (`player-life-tracker`), and **Trade Balancer** (`trade-balancer`) (REQ-206, REQ-213).
+- Description: The app must provide a first-class **feature portal** that owns top-level navigation chrome — one ☰ Menu button at the left of every destination's banner header (REQ-207; below `768px` on Player Life Tracker, at the left of its own compact header row, REQ-248) — opening the registered destinations, action entries, and palette-only Theme band. Destinations come from an extensible registry rather than shipping their own entry chrome; the Menu lists **Ask a Question** (`quick-lookup`, also current while `in-depth` is open), **Question History**, **Life Tracker** (`player-life-tracker`), and **Trade Balancer** (`trade-balancer`) (REQ-206, REQ-213).
 - Acceptance Criteria:
-  - an icon-only ☰ Menu button sits at the left of every destination's banner header (REQ-207), docks through the destination's inline `PortalSlot`, and scrolls with that header; the viewport-fixed path remains only a defensive fallback for a future headerless destination
+  - an icon-only ☰ Menu button sits at the left of every destination's banner header (REQ-207; below `768px` on Player Life Tracker, at the left of its own compact header row, REQ-248), docks through the destination's inline `PortalSlot` — where a destination mounts one header per width band, through the slot in the header the stylesheet is showing, so exactly one ☰ is visible at every width — and scrolls with that header; the viewport-fixed path remains only a defensive fallback for a future headerless destination
```

```diff
   - NFR-001
   - NFR-006
   - FLOW-010
+  - REQ-248
 - Notes:
   - owned by the `feature-portal` package; hidden placeholders do not count as registered destinations
```

```diff
   - amended for the `ui-reimagining-build` pass (2026-09-30): one question door (REQ-206), Question History as a Menu row (REQ-213), and the ☰ banner trigger (REQ-207); registry, action entries, state preservation and reload persistence unchanged
+  - amended by `life-tracker-desktop-nav` (2026-10-16): a pointer to the phone Life Tracker's own header row (REQ-207's exception, REQ-248), and the ☰ docks into the slot the stylesheet is showing when a destination mounts one header per width band; registry, action entries, Theme, state preservation and reload persistence unchanged
```

- Verdict:
- Reason:

## Blocker questions

None. The one open choice — whether "desktop" starts at 768px or at 1024px —
is answered by the app's own rules: `screen-layout.md` names everything under
768px the phone band, and the shared banner, the ☰, the Menu tray and the
banner's right-hand slot all switch from phone form to desktop form at 768px.
The reasoning is in `DESIGN-BRIEF.md`, under Assumptions. If you want tablets
(768–1023px) to keep the phone row instead, say so on REQ-248 with an `edit`.

How the ☰ stays in the header on screen is not a question for you either:
every way that meets REQ-248 gives the player the same result, one ☰ in the
visible header, and the app's rules leave one way that fits (the Menu follows
what the stylesheet draws, with no JavaScript reading the screen width). It is
recorded in `DESIGN-BRIEF.md`, Design item 3 and assumption 8, with a live
check in `evidence/measurements.md`.
