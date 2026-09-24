status: refined

# DESIGN BRIEF — ui-reimagining

**What this is:** the design record for re-imagining every player flow except
Life Tracker — Menu and shared chrome, Quick Question, In-Depth Question,
Trade Balancer — so the app reads as an arcane, premium, enchanting Magic tool
with the player's chosen mana colour carrying the whole surface.

**What you need to do:** answer the verdict slots in `GATE-QUESTIONS.md`, then
merge the docs PR. That merge is the build signal.

**What it changes:** nothing a player sees yet. This package's build draws the
first clickable mockup direction and writes down the rules a redesign must
obey. No `apps/frontend` code changes in this package.

---

## What the player gets

A player opens TheJudge on their phone at the table and every screen reads as
one Magic tool with a point of view. The mana colour they picked in the Menu
is not a button tint any more — it is the background wash, the edge of every
panel, the ring around whatever they are typing in, the pulse of the waiting
panel, and the frame of the card-detail popup. The shapes and textures are
ours, drawn for this app; no Wizards of the Coast artwork ships.

Three concrete annoyances go away. Attaching two cards to a Quick Question no
longer pushes **Send Request** off the bottom of the screen. Filling a zone in
In-Depth Question no longer means a strip that shows barely two cards at a
time. Building both sides of a trade on a phone no longer stacks Side A on top
of Side B — the two sides become tabs the player flips between, while the
desktop keeps its side-by-side layout unchanged.

Life Tracker looks exactly as it does today, down to the pixel.

---

## What this package's build actually delivers

This is the first shaping call the intake left open, so it is stated plainly.

**This package's build delivers one mockup direction and the written rules —
no app code.** Concretely:

1. The approved product truth in `PRD/sections/` (the `GATE-QUESTIONS.md`
   proposal, applied by intent at build).
2. **Direction 1** as clickable HTML: one page per in-scope flow (shared
   chrome and Menu, Quick Question, In-Depth Question's steps, Trade Balancer)
   viewable at phone and desktop width, with real card names, real prices and
   real answer copy, each paired with a "before" screenshot of today's screen.
3. A Life Tracker screenshot pair proving the direction causes no drift.

Directions 2 and 3 are a **follow-on package**, kicked off after the owner has
reacted to direction 1. The app-code redesign is a **third package**, sliced
per flow, kicked off once the owner has picked a direction.

**Why the work is split this way.** The owner asked for the first direction
early so they can correct course before the other two are built (intake F2). A
graph run is unattended between the docs-PR merge and the code PR, and it opens
exactly one code PR per package, so a single run cannot show direction 1, wait,
and then build 2 and 3. Splitting the packages is the only shape that honours
F2 as written. It also means no mockup is ever drawn against unapproved rules.

**Where the owner's direction pick happens:** on the follow-on package's
intake, after directions 2 and 3 exist — not at this gate, where there is
nothing yet to look at.

**If the owner would rather see all three directions in one PR,** say so on
this docs PR and the plan collapses to one mockup package; nothing else in this
brief changes.

---

## Measured evidence (live app, 2026-09-24)

Every number below was measured in the running app in this checkout
(`npm run dev`, mock provider, Chromium, CSS pixels), not reasoned from code or
from proportions. Screenshots are in
`PRD/work/ui-reimagining/.playwright-mcp/` (git-ignored).

### Today's surface

| Thing | Measured value |
| --- | --- |
| Page background | `linear-gradient(135deg, #09090B 0%, #18181B 45%, #09090B 100%)` |
| Shell panel fill | `rgba(24, 24, 27, 0.7)` — effectively `#131316` over the darkest stop |
| Body text | `#E2E8F0`, Inter |
| Body text contrast | 16.14:1 on `#09090B`; 14.37:1 on `#18181B`; 15.04:1 on the shell fill |

The darkest background stop is `#09090B`. The owner's "not pitch black, it must
survive a bright game store" (intake B3) is therefore about how far the new
colour wash may darken, and `#18181B` at 14.37:1 is today's worst measured
text pairing — the floor the wash must not go below.

### Accent-token contrast, today, per palette

`accent-soft` is the accent-text token on dark surfaces. Measured against the
darkest background stop `#09090B`:

| Palette | `accent-soft` on `#09090B` | `accent-contrast` on `accent` |
| --- | --- | --- |
| White | 18.73:1 | 16.11:1 |
| Blue | 12.68:1 | 6.69:1 |
| Black | 7.40:1 | 5.70:1 |
| Red | **6.19:1** (weakest) | 6.33:1 |
| Green | 15.26:1 | **5.42:1** (weakest) |
| Colorless | 15.68:1 | 7.73:1 |

Red's 6.19:1 and Green's 5.42:1 are the measured floors the new colour-driven
surface system must not fall below — not a round number picked in advance.

### Life Tracker screenshot-diff noise floor

| Comparison | Pixels differing |
| --- | --- |
| 390×844, two captures of the same paint | 0 of 329,160 |
| 390×844, capture before vs. after a full reload | 0 of 329,160 |
| 1440×900, capture before vs. after a full reload | 0 of 1,296,000 |

Life Tracker renders **bit-identical** across a reload at both widths. The
screenshot-diff tolerance for "pixel-identical" is therefore **zero differing
pixels**, measured, with no antialiasing allowance needed. This is what makes
the pin in `REQ-202` enforceable rather than aspirational.

### The owner's friction rows, checked live

| Row | Owner's memory | Measured, 2026-09-24 |
| --- | --- | --- |
| A2.1 Quick Question, several cards | "attached card too large; things run off screen on phone" | **Confirmed.** Two cards attached at 390×844: each image 151×211 in a 265px card column; the document is 1159px tall against an 844px viewport (315px of page scroll) and **Send Request sits 179px below the fold** (`top` 1023, `bottom` 1067) |
| A3.1 In-Depth zones, cards too big | "cards get too big once a zone fills; a horizontal scroll strip would tidy it" | **Half already shipped, and the other half confirmed.** The horizontal strip already exists (`REQ-130`, `overflow-x-auto`, clientWidth 265 / scrollWidth 326, no document scroll). But each tile's image renders 146×203 in a 256px-tall region, so a filled zone shows **about 1.8 cards at once** on a phone. The fix is tile density in the strip, not building a strip |
| A3.2 too many options per step | "anything that consolidates controls inside a step is welcome" | Game context at 390×844 carries 9 interactive controls before any player is expanded; zone confirmation carries 7 zone checkboxes plus Back/Continue. Consolidation is a mockup-level judgement, so no numeric target is set here |
| A4.1/A4.2 Trade Balancer phone | "the two sides stack, cluttered, wastes space; tabs would free room" | **Confirmed as the shipped rule**, not a bug: `screen-layout.md` and `trade-balancer/README.md` both record "sides stack on phone". Empty at 390×844, Side A's heading is at y 305 and Side B's at y 529, so an empty board already spends 224px per side before a single card is added |

### A defect the walk found that the owner had not reported

Touch targets below the 44px floor that `NFR-001` / `NFR-011` / `REQ-101`
already require, measured at 390×844:

| Screen | Control | Measured |
| --- | --- | --- |
| Quick Question | Card search input | 299×**38** |
| Quick Question | Scan button | 299×**38** |
| In-Depth game context | `TheJudge` brand-mark button (the Easter-egg target) | 108×**29** |
| In-Depth game context | Turn phase select | 307×**37** |
| In-Depth game context | Active player select | 307×**37** |
| In-Depth game context | Confirm game context | 333×**40** |
| In-Depth zone confirmation | Back / Continue | 160×**42** |
| In-Depth zone confirmation | Zone checkbox input | **16×16** (the row label carries the real hit area) |
| Trade Balancer | Per-side card search input | 299×**38** |
| Trade Balancer | Per-side Scan button | 299×**40** |

In-Depth zone collection's search row already meets the floor (input 223×44,
Scan 67×44, from `REQ-125` / `DEC-050`), which shows the floor is reachable
without a layout fight. `REQ-205` folds the rest in.

---

## Scope

**In scope:** shared chrome (Menu rail and tray, brand mark, theme section,
mock-mode banner, feedback modal, history drawer, View Context overlay, card
detail popup), Quick Question, In-Depth Question and every one of its steps,
Trade Balancer, the colour-token system, and original motif artwork.

**Out of scope:** Life Tracker's screens and `lib/lifeTracker/` state; backend,
Ask AI prompts, scan detection, price data; any new feature; step order and
step count in In-Depth Question (controls may move **within** a step); official
Wizards of the Coast mana glyphs or card art.

---

## Decisions settled at this gate

Each decision names the assumption made, the rung of the assumption ladder it
came from (`PRD/instructions/preparation-contract.md`), and its evidence.

### D1 — Package shape: one direction per package

**Assumption:** this package's build ships direction 1 plus the approved rules
and no app code; directions 2–3 and the app code are later packages.
**Ladder rung:** 4 (smallest reversible scope) and 5 (preserve user-visible
behavior unless the request changes it).
**Evidence:** intake F2 ("first direction early, so the owner can correct
course before the other two are built"); the graph contract's one-code-PR-per-
package shape (`graph-workflow-contract.md`, `## The two runs`, REQ-194).

### D2 — New product truth lands as requirements, not as shipped current state

**Assumption:** build applies `REQ-200`–`REQ-205` to
`PRD/sections/functional-requirements.md` and the amendments to the rules that
currently forbid them, but adds **no** new `Built:` line to any feature
`README.md`, because no code ships in this package.
**Ladder rung:** 1 (active requirements in `PRD/sections/`).
**Evidence:** `functional-requirements.md` is the requirement register (each
entry carries Priority and Acceptance Criteria); the feature
`sections/<feature>/README.md` files are current-state specs whose `Built:`
lines describe shipped behavior. Writing a `Built:` line for unbuilt work would
make the current-state spec lie.

### D3 — The colour becomes the theme, at a measured intensity

**Assumption:** the chosen palette drives background wash, surface fills and
edges, focus rings, the waiting panel, and the card-detail popup, bounded by
the measured contrast floors above (body text ≥ 14.37:1, `accent-soft`
≥ 6.19:1, `accent-contrast` on filled accent ≥ 5.42:1).
**Ladder rung:** 1, then measurement.
**Evidence:** intake D3 ("agree … at a restrained intensity"); measured values
in **Measured evidence**, above. The intensity ceiling is expressed as those
ratios, not as an opacity guess.

### D4 — Dark only this pass, with a token set a light theme can join

**Assumption:** only dark values ship; the token names carry no "dark" in them
and no component hard-codes a zinc value, so a light theme is additive later.
**Ladder rung:** 4.
**Evidence:** intake E5 ("agree … tokens set up so a light theme can be added
later"). `REQ-200` names the token set; it does not define light values, so
nothing here claims a light theme exists.

### D5 — Own motifs only

**Assumption:** no official mana glyph, community Mana icon font, or Wizards
card art ships; per-colour motifs are drawn for this app.
**Ladder rung:** 1 (this is already a standing constraint — `REQ-099` forbids
"Magic mana symbols/logos/card art").
**Evidence:** intake D2 ("own motifs … keeps the commercial option open").
`REQ-201` turns the prohibition into a positive brief.

### D6 — Life Tracker is pinned, and every later slice proves it

**Assumption:** reading (a) from intake E1 — every shared token Life Tracker
consumes is pinned to today's value inside Life Tracker — enforced by a
zero-differing-pixel screenshot diff at 390×844 and 1440×900 on every slice
that touches shared chrome, tokens, or `index.css`.
**Ladder rung:** 1 and measurement.
**Evidence:** intake E1; the measured 0/329,160 and 0/1,296,000 noise floor
above. `REQ-202` carries it.

### D7 — Copy may be rewritten; steps may not be re-sequenced

**Assumption:** labels, button text, empty states and hints are free to change
as long as meaning holds; step order and step count in In-Depth Question stay
as today; controls may be regrouped inside a step; Trade Balancer's phone tabs
count as layout, not re-sequencing.
**Ladder rung:** 1.
**Evidence:** intake E2 and E3.

### D8 — No new numeric ceilings invented

**Assumption:** no bundle-size ceiling, font budget, or tap-size number is
introduced. The 44px touch floor already exists (`NFR-001`, `NFR-011`,
`REQ-101`) and `REQ-205` simply brings the measured offenders up to it; the
contrast numbers are the measured current values, not new targets; the
screenshot tolerance is the measured zero.
**Ladder rung:** 6 (no new contract without authoritative scope).
**Evidence:** intake E6 ("none beyond today's non-functional requirements").

### D9 — The Easter egg spreads, with one session-wide counter

**Assumption:** ten taps on the brand mark on **any** in-scope screen reveal
the cat wizard everywhere for the rest of the session, from one shared count.
Life Tracker keeps its own title and stays out.
**Ladder rung:** 1 (the trigger and session-only scope are already
`REQ-056` / `DEC-076` truth) plus the owner's explicit wish.
**Evidence:** intake A5 ("Protected outright: the cat-wizard Easter egg …
Owner wish, in scope: extend it to every in-scope screen … Recommendation: one
session-wide tap count"). Where the cat appears on screens without a hero slot
is left to the mockup, as the intake says.

### D10 — Reference apps are cited, never opened

**Assumption:** Moxfield, EDHREC, Scryfall (intake C2), TCGplayer (C3) and
`docs/design/tab-icon/` (C5) are recorded as citations only. No claim in this
brief rests on what any of them looks like.
**Ladder rung:** intake-is-evidence rule in `thejudge-refinement`.
**Evidence:** the skill's "never open, read, or otherwise fetch a document
intake cites" rule. The C2/C3 readings the intake asks for are a **mockup-stage
question for the owner**, not settled here.

---

## Proposed product truth

`GATE-QUESTIONS.md` carries one block per stable ID, each with its complete
proposed diff and a verdict slot.

**New, named and reserved (not written live):**

| ID | What it settles |
| --- | --- |
| `REQ-200` | The chosen mana colour drives the whole surface, through a named token set a light theme can join later |
| `REQ-201` | Original arcane motif kit per colour; no Wizards artwork or glyphs |
| `REQ-202` | Life Tracker is visually pinned, proved by a zero-pixel screenshot diff per slice |
| `REQ-203` | The cat-wizard Easter egg reaches every in-scope screen from one session-wide tap count |
| `REQ-204` | Trade Balancer's two sides become tabs on phone; desktop side-by-side unchanged |
| `REQ-205` | Every control on the re-imagined screens meets the 44px touch floor |

**Amended in place:**

| ID | Why it must change |
| --- | --- |
| `REQ-044` | Its constraint bars a "dark/light mode redesign"; the token set must be allowed to be light-ready |
| `REQ-046` | Its criterion and constraints require a palette-agnostic neutral backdrop and forbid new token roles |
| `REQ-060` | Same two rules, restated as its own criteria and constraints |
| `REQ-099` | Its constraints forbid tinting the background, adding token roles, and light mode |
| `REQ-124` | Its constraint says "no theme, typography, or brand redesign" |
| `REQ-129` | Its first-viewport ceiling must bind the multi-card pre-submit page, not each image alone |
| `REQ-130` | The zone strip's tile density must change so a filled zone shows more than 1.8 cards |
| `REQ-167` | The multi-card add strip's accepted page-scroll consequence is the friction the owner reported |
| `REQ-056` | Its Easter-egg criterion is game-context-only and must point at `REQ-203` |
| `NFR-011` | Its constraint requires reusing the four accent tokens rather than adding token roles |
| `FLOW-007` | Choosing a palette must now restyle the whole surface, not only the accent inventory |

No new `DEC-###`: the decision log is retired. No existing `DEC` body is
amended — the only two surviving bodies are the deployment pair
`DEC-084`/`DEC-169`, untouched here.

---

## Amendment set — enumerated by grep, one disposition per hit

The rule this redesign breaks is a cross-cutting invariant: **"the page
background and static chrome stay palette-agnostic neutral slate, and consumers
reuse only the four accent tokens with no new token roles."** Per
`PRD/instructions/writing-rules.md` the set is enumerated by grep, never from
memory, and only invariant **assertions** are folded — a per-feature scope
clause that references the rule is left in place.

A broad discovery grep ran first —
`grep -rniE 'palette|accent|mana colour|mana color|wordmark|brand ?mark|gradient|zinc|dark theme|light theme|\btheme\b' PRD/sections/`
— returning **200 hits across 12 files** (functional-requirements 114,
shared-chrome 33, system-map 11, decisions 11, user-flows 10,
non-functional-requirements 8, scan 4, life-tracker 3, screen-layout 2,
goals-and-non-goals 2, user-feedback 1, in-depth 1). Four narrower greps below
pull the assertions out of it. Every hit of the four narrow greps carries a
row. The broad grep's remaining hits are mechanism descriptions (where the
palette lives, how it persists), per-feature scope clauses ("no theme change in
this requirement"), or the unrelated sense of "palette" — Life Tracker's
**counter** palette (`life-tracker/README.md` 19, 52, 77;
`functional-requirements.md` 1905, 1909, 1928; `user-flows.md` 294) — and are
dispositioned **unchanged** for the reason given in each row below where they
were reachable by a narrow grep.

### Grep A — the invariant itself

`grep -rn -iE 'palette-agnostic|not palette-tinted|palette-tinted|neutral slate|stays neutral|do not add token roles|no new token roles|adding token roles|closed minimum surface inventory|light mode|dark/light|light theme|neutral grey|neutral gray' PRD/ README.md`
(excluding `PRD/work/`, `PRD/ideasForLater/`, `PRD/instructions/`) — **24 hits**.

| # | File:line | Disposition |
| --- | --- | --- |
| A1 | `system-map.md:221` | **Amend** — assertion: "page background end-stop (neutralized to slate, not palette-tinted)" and "static chrome … stay neutral/unchanged". Folded in the `REQ-200` block |
| A2 | `user-flows.md:169` | **Amend** — FLOW-007 step 4 asserts the palette applies only to accents plus REQ-060's inventory. Own block (`FLOW-007`) |
| A3 | `user-flows.md:171` | **Unchanged** — "restores fixed neutral gray" is the Colorless reset behaviour, not the background invariant |
| A4 | `user-flows.md:182` | **Amend** — assertion: "static chrome and the dominant page background remain neutral". In the `FLOW-007` block |
| A5 | `decisions.md:109` (DEC-068) | **Unchanged** — retired historical index row; it records what DEC-068 said, not live truth. The decision log is retired and is not rewritten |
| A6 | `decisions.md:122` (DEC-081) | **Unchanged** — same reason as A5 |
| A7 | `scan/README.md:196` | **Unchanged now, superseded at the code package** — a `Built:` line describing today's shipped scan background. It stays true until the code ships; `REQ-200`'s note names it as the line the code slice must update |
| A8 | `functional-requirements.md:891` (REQ-044 constraint) | **Amend** — assertion: "no … dark/light mode redesign". Own block (`REQ-044`) |
| A9 | `functional-requirements.md:930` (REQ-046 description) | **Amend** — assertion: "the dominant page background is neutralized to a palette-agnostic slate backdrop". Own block (`REQ-046`) |
| A10 | `functional-requirements.md:932` (REQ-046 criterion) | **Amend** — assertion: "is not palette-tinted". In the `REQ-046` block |
| A11 | `functional-requirements.md:940` (REQ-046 constraint) | **Amend** — assertion: "do not add token roles". In the `REQ-046` block |
| A12 | `functional-requirements.md:943` (REQ-046 constraint) | **Amend** — assertion: "palette-tinted backgrounds … dark/light mode redesign" forbidden. In the `REQ-046` block |
| A13 | `functional-requirements.md:944` (REQ-046 constraint) | **Amend** — assertion: "static neutral slate chrome stays neutral by design". In the `REQ-046` block |
| A14 | `functional-requirements.md:1318` (REQ-060 description) | **Amend** — assertion: the palette reaches only the closed inventory. Own block (`REQ-060`) |
| A15 | `functional-requirements.md:1331` (REQ-060 criterion) | **Amend** — assertion: "the dominant page background remains palette-agnostic slate". In the `REQ-060` block |
| A16 | `functional-requirements.md:1337` (REQ-060 constraint) | **Amend** — assertion: "do not add token roles". In the `REQ-060` block |
| A17 | `functional-requirements.md:2380` (REQ-099 constraint) | **Amend** — assertion: "do not add token roles, per-flow palettes". Own block (`REQ-099`) |
| A18 | `functional-requirements.md:2381` (REQ-099 constraint) | **Amend** — assertion: "do not broaden REQ-060's closed ambient-surface inventory, tint the neutral slate page background". In the `REQ-099` block |
| A19 | `functional-requirements.md:2383` (REQ-099 constraint) | **Amend** — assertion: "no … Magic mana symbols/logos/card art … light mode". Keeps the artwork ban (it is exactly `REQ-201`'s rule) and yields only on light-readiness. In the `REQ-099` block |
| A20 | `goals-and-non-goals.md:80` | **Amend** — assertion: "dark/light mode redesign for theme customization" is a non-goal. Folded in the `REQ-200` block |
| A21 | `non-functional-requirements.md:146` (NFR-011) | **Amend** — assertion: "consumers must reuse the existing accent tokens rather than adding token roles". Own block (`NFR-011`) |
| A22 | `non-functional-requirements.md:148` (NFR-011) | **Amend** — assertion: ambient accents apply only to REQ-060's closed inventory. In the `NFR-011` block |
| A23 | `shared-chrome/README.md:211` | **Unchanged now, superseded at the code package** — a `Built:` line about the composer's ambient treatment; true until code ships |
| A24 | `shared-chrome/README.md:277` | **Unchanged now, superseded at the code package** — a `Built:` line: "no palette-tinted page background; static surrounding chrome stays neutral". True until code ships; named in `REQ-200`'s note |

### Grep B — the cat-wizard Easter egg

`grep -rn -iE 'cat-wizard|cat wizard|cats-homescreen|10 clicks|ten taps|Easter egg' PRD/sections/ README.md` — **7 hits**.

| # | File:line | Disposition |
| --- | --- | --- |
| B1 | `user-flows.md:10` (FLOW-001 step 1) | **Amend** — asserts the reveal is tied to "the brand title … on this step". In the `REQ-203` block |
| B2 | `README.md:165` | **Unchanged** — records where the asset file lives; the asset does not move |
| B3 | `functional-requirements.md:924` (REQ-045 note) | **Amend** — asserts "hidden by default on the game-context screen". In the `REQ-203` block |
| B4 | `functional-requirements.md:1177` (REQ-056 criterion) | **Amend** — the canonical assertion: "after 10 clicks on the `TheJudge` brand title **on the game-context step**". Own block (`REQ-056`) |
| B5 | `functional-requirements.md:1182` (REQ-056 criterion) | **Amend** — "tests cover … game-context Easter egg" must cover every in-scope screen. In the `REQ-056` block |
| B6 | `in-depth/README.md:448` | **Unchanged now, superseded at the code package** — `Built:` line, true until the code ships |
| B7 | `in-depth/README.md:449` | **Unchanged now, superseded at the code package** — continuation of B6 |

### Grep C — Trade Balancer's two sides on phone

`grep -rn -iE 'sides stack|two sides|side-by-side|Side A and|paired sides' PRD/sections/` — **31 hits**. Most are the unrelated sense of "side-by-side" (the Menu/History rail zones, and the answer-quality judge's side-by-side ranking).

| # | File:line | Disposition |
| --- | --- | --- |
| C1 | `screen-layout.md:217` (Trade Balancer, Phone) | **Amend** — the canonical layout assertion "sides stack". In the `REQ-204` block |
| C2 | `screen-layout.md:218` (Trade Balancer, Desktop) | **Unchanged** — desktop paired sides are explicitly kept (intake A4) |
| C3 | `user-flows.md:196` (FLOW-009 step 1) | **Unchanged** — describes that two sides exist, not how they lay out on a phone |
| C4 | `user-flows.md:202` | **Unchanged** — totals arithmetic, no layout claim |
| C5 | `system-map.md:388` | **Unchanged** — history drawer; the hit is the unrelated "side-by-side" rail sense |
| C6 | `system-map.md:563` | **Unchanged** — feature-portal summary; unrelated rail sense |
| C7 | `decisions.md:128` (DEC-087) | **Unchanged** — retired index row |
| C8 | `decisions.md:178` (DEC-137) | **Unchanged** — retired index row, rail zones |
| C9 | `decisions.md:182` (DEC-141) | **Unchanged** — retired index row, rail footprint |
| C10 | `trade-balancer/README.md:34` | **Unchanged** — asserts two sides exist; still true with tabs |
| C11 | `trade-balancer/README.md:170` | **Amend** — assertion: "sides stack on phone". In the `REQ-204` block |
| C12 | `functional-requirements.md:1177` | **Amend** — already covered as B4/B5 (the same line carries the merged phase/active-player panel); the phrase "side-by-side on `sm+`" here is In-Depth game context, unrelated to Trade Balancer, and is **not** changed by `REQ-204` |
| C13 | `functional-requirements.md:1456` (REQ-064 description) | **Unchanged** — asserts the feature exists, no phone layout claim |
| C14 | `functional-requirements.md:1458` (REQ-064 criterion) | **Unchanged** — same |
| C15 | `functional-requirements.md:2594` | **Unchanged** — answered-workspace clearance, unrelated rail sense |
| C16 | `functional-requirements.md:2754` (REQ-114) | **Unchanged** — rail hit box, unrelated sense |
| C17 | `functional-requirements.md:2759` (REQ-114) | **Unchanged** — rail zones, unrelated sense |
| C18 | `functional-requirements.md:2782` (REQ-114 note) | **Unchanged** — rail geometry rationale, unrelated sense |
| C19 | `functional-requirements.md:2811` (REQ-116) | **Unchanged** — workspace clearance, unrelated sense |
| C20 | `functional-requirements.md:2814` (REQ-116) | **Unchanged** — same |
| C21 | `functional-requirements.md:3267` | **Unchanged** — rail layout participation, unrelated sense |
| C22 | `functional-requirements.md:4346` (REQ-186) | **Unchanged** — answer-quality judge ranking, unrelated sense |
| C23 | `functional-requirements.md:4352` (REQ-186) | **Unchanged** — same |
| C24 | `functional-requirements.md:4359` (REQ-186) | **Unchanged** — same |
| C25 | `functional-requirements.md:4431` | **Unchanged** — answer-quality cost note, unrelated sense |
| C26 | `functional-requirements.md:4441` | **Unchanged** — answer-quality scorecard, unrelated sense |
| C27 | `functional-requirements.md:4443` | **Unchanged** — answer-quality transcripts, unrelated sense |
| C28 | `shared-chrome/README.md:134` | **Unchanged** — rail zones, unrelated sense |
| C29 | `shared-chrome/README.md:213` | **Unchanged** — rail footprint, unrelated sense |
| C30 | `shared-chrome/README.md:375` | **Unchanged** — rail zones, unrelated sense |
| C31 | `shared-chrome/README.md:427` | **Unchanged** — rail clamp history, unrelated sense |

### Grep D — the brand mark and the "no brand redesign" bar

`grep -rn -iE 'no theme, typography|brand redesign|wordmark|brand mark|BrandMark|brand block|brand title' PRD/sections/ README.md` — **23 hits**.

| # | File:line | Disposition |
| --- | --- | --- |
| D1 | `user-flows.md:10` | **Amend** — same line as B1, for the Easter egg. The brand block's own presentation is not asserted here |
| D2 | `user-flows.md:38` | **Unchanged** — header composition (step name inline beside the brand block) is presentation the redesign may re-express, but this line states the shipped shape, not a rule barring change; the mockup proposes, `REQ-200` does not require the edit |
| D3 | `screen-layout.md:71` | **Unchanged** — the load fallback keeps the brand block mounted; still true |
| D4 | `system-map.md:563` | **Unchanged** — mechanism summary (where the brand block sits in the header row) |
| D5 | `system-map.md:564` | **Unchanged** — file list including `BrandMark.tsx`; unchanged by this package |
| D6 | `decisions.md:108` (DEC-067) | **Unchanged** — retired index row |
| D7 | `decisions.md:163` (DEC-122) | **Unchanged** — retired index row |
| D8 | `decisions.md:174` (DEC-133) | **Unchanged** — retired index row |
| D9 | `functional-requirements.md:908` (REQ-045) | **Unchanged** — step-name placement; the redesign may restyle it but no rule here forbids that, and re-sequencing is out of scope |
| D10 | `functional-requirements.md:910` (REQ-045) | **Unchanged** — same |
| D11 | `functional-requirements.md:914` (REQ-045) | **Unchanged** — same |
| D12 | `functional-requirements.md:1177` (REQ-056) | **Amend** — same line as B4 |
| D13 | `functional-requirements.md:1545` (REQ-067) | **Unchanged** — non-overlap of chrome bounds; a constraint the redesign must keep meeting |
| D14 | `functional-requirements.md:1996` | **Unchanged** — action-entry non-overlap and touch sizing; kept, and reinforced by `REQ-205` |
| D15 | `functional-requirements.md:2733` (REQ-113) | **Unchanged** — the quiet decorative brand mark in the tray stays permitted |
| D16 | `functional-requirements.md:2987` (REQ-124 constraint) | **Amend** — assertion: "no theme, typography, or brand redesign". Own block (`REQ-124`) |
| D17 | `goals-and-non-goals.md:44` | **Unchanged** — lists the shipped chrome as a goal; the redesign restyles it without removing it |
| D18 | `in-depth/README.md:67` | **Unchanged now, superseded at the code package** — `Built:` line describing today's slim brand block |
| D19 | `in-depth/README.md:449` | **Unchanged now, superseded at the code package** — same as B7 |
| D20 | `shared-chrome/README.md:94` | **Unchanged** — load fallback keeps the brand block mounted; still true |
| D21 | `shared-chrome/README.md:116` | **Unchanged now, superseded at the code package** — `Built:` line on brand-block centring |
| D22 | `shared-chrome/README.md:129` | **Unchanged** — the tray's quiet brand mark stays permitted |
| D23 | `shared-chrome/README.md:480` | **Unchanged** — file pointer to `BrandMark.tsx` |

**Layout-catalog rows** (`PRD/sections/screen-layout.md`) that the redesign
tunes rather than bypasses, each carried inside the named block's diff:
`#### Quick Question — pre-submit` (in `REQ-129`), `#### In-Depth — Zone
collection` (in `REQ-130`), `#### Trade Balancer` (in `REQ-204`). No
**new-screen** row is added: the redesign introduces no new screen or major
overlay, and the HTML mockups are deliverables, not app screens.

---

## Life Tracker: how it is pinned, and how every slice proves it

1. **Pin.** Every shared token Life Tracker consumes resolves to today's value
   inside the Life Tracker destination — the pin lives with Life Tracker, not
   as a carve-out inside each shared component (`REQ-202`).
2. **Proof.** Every slice that touches shared chrome, the token set, or
   `index.css` attaches a Life Tracker screenshot diff at 390×844 and
   1440×900, captured the same way as the baselines in this brief, and the
   diff must be **zero differing pixels**. A non-zero diff blocks the slice
   until the drift is pinned or the owner approves it.
3. **Baseline.** The four baseline captures in
   `PRD/work/ui-reimagining/.playwright-mcp/` are the reference; the folder is
   git-ignored, so the code package re-captures them from the merge base before
   it starts and records the counts in its slice docs.
4. **Why zero is fair.** Measured: 0 of 329,160 differing pixels at 390×844 and
   0 of 1,296,000 at 1440×900 across a reload. The renderer is deterministic
   here, so a single differing pixel is a real change, not noise.

---

## Non-goals, restated as guard rails for the mockups

- No Life Tracker change of any kind, including shared-token drift.
- No backend, prompt, scan-detection, or price-data change.
- No new feature, and nothing the app cannot already do.
- No step added, removed, merged, or re-ordered in In-Depth Question.
- No official Wizards of the Coast mana glyph, icon font, or card art.
- No light-theme values this pass — only a token set that could take them.

---

## Open items deliberately left to the owner

- **C2/C3 readings.** The intake asks the probe to name what Moxfield, EDHREC
  and Scryfall have in common, and what is disliked about TCGplayer, and put
  that reading in front of the owner. This brief cites those names and makes no
  claim about them, per the intake-is-evidence rule. The reading belongs with
  direction 1's mockup, where the owner can react to a drawing rather than to a
  sentence.
- **Where the cat wizard appears** on screens with no hero slot — a mockup
  decision, as the intake says.
- **Which of the three `docs/design/tab-icon/` candidates**, if any, informs the
  brand mark — a mockup decision; the file is cited, not opened.

## Material assumptions, in one list

| # | Assumption | Evidence | If wrong |
| --- | --- | --- | --- |
| 1 | Build ships direction 1 only; 2–3 and the code are later packages | intake F2; graph one-code-PR shape | Say so on the docs PR; the plan collapses to one mockup package |
| 2 | New REQs land as requirements, no `Built:` lines | `functional-requirements.md` is the requirement register | The code package would have to re-propose them |
| 3 | Contrast floors are today's measured worst cases (14.37:1 body text, 6.19:1 `accent-soft`, 5.42:1 `accent-contrast`) | measured 2026-09-24 | A higher bar narrows how dark the wash may go |
| 4 | Screenshot-diff tolerance is zero differing pixels | measured 0/329,160 and 0/1,296,000 | A tolerance above zero lets real drift through |
| 5 | One session-wide Easter-egg tap count | intake A5 recommendation | Per-screen counts would make the egg harder to find, not easier |
| 6 | No new bundle, font, or tap-size number | intake E6 | A ceiling would have to be measured before it is written |
| 7 | The In-Depth zone strip already exists; only tile density changes | measured live: `overflow-x-auto`, 146×203 tiles, ~1.8 visible | If the owner wanted a different list shape, the strip row changes further |
| 8 | Reference apps and past design files are citations only | `thejudge-refinement` intake rule | The owner supplies the reading at mockup review |

## Verification notes

- The live walk ran against this checkout's `apps/frontend`, which is
  byte-identical to `main` (`git diff main..HEAD -- apps/frontend` is empty), so
  the measurements describe the app the redesign starts from.
- Playwright screenshots were written to
  `PRD/work/ui-reimagining/.playwright-mcp/`; the browser session was closed and
  the dev server stopped before this brief was committed.
