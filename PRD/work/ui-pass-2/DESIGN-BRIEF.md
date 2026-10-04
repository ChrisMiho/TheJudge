# Design brief — ui-pass-2

One polish pass over four owner findings from the latest UI refactoring. Nothing
new is added; each item makes a surface match the mockup or the pattern it should
already mirror, on phone and desktop, with no behaviour change. Pricing, totals,
the price route, delete behaviour, flow logic, and the ephemeral trade posture are
all untouched.

This brief was shaped under `graph is controlling`. Each finding was reproduced
**live** in a browser against the worktree's own dev server (desktop 1440x900 for
items 1-2, phone 390x844 for items 3-4) and, for item 1, against the direction-1
mockup served locally. Before-state screenshots live in
`PRD/work/ui-pass-2/.playwright-mcp/`. Material assumptions are recorded per item.

## Non-goals (whole pass)

- No new features, no other screens, no backend/data/contract changes.
- No redesign: this is polish. The card-identity ring stays each card's own edge;
  the theme owns the glow behind a card, never its edge. The shared sheet
  (REQ-208) and the single direction-1 visual system (REQ-207) still govern.
- No change to trade pricing/totals/price route (REQ-064/REQ-065/REQ-175), to the
  tier logic or verdict bands (REQ-215), to delete behaviour (REQ-118/FLOW-018),
  or to the confirm sheet's words and buttons (ConfirmSheet, REQ-208).
- No new on-screen text, tooltips, or onboarding.

---

## Item 1 — Trade Balancer gold piles use different art than the mockup

**What a player sees.** On Trade Balancer, each side's value shows as a growing
pile of gold. Today the app draws plain flat disc-coins, a sharp pointed triangle
mound, a single flat diamond gem, and a simple cup. The direction-1 mockup draws
the same concept with richer art: coins are **stacked cylinders with a rim edge**,
mounds are **rounded hills** (curved), the gem is a **two-tone faceted cut**, and
the tier-5 hoard is crowned with a **goblet**. Same concept, different art — the
owner's finding.

**Live evidence.** Added one card per side (mocked prices so the piles render):
Side A $50 -> tier 5, Side B $18 -> tier 2. App capture
`item1-app-piles-desktop.png` vs mockup capture `item1-mockup-piles-desktop.png`
(mockup's "Leans" demo, tier 5 vs tier 4). The divergence is clear in both the
tier-5 crown (flat cup + flat gem + straight triangle, vs goblet + faceted gem +
rounded mound) and the coins (flat ellipses vs rimmed stacks).

**Root of the drift (from code).** `apps/frontend/src/components/trade/TradePile.tsx`
re-draws the pile in its own SVG primitives and palette
(`GOLD #f2c14e / GOLD_DARK #d4a017 / BRONZE #8b5a2b / GEM #9b59b6`, plain `Coin`
ellipses, straight-`points` triangle mounds, a one-polygon `Gem`, a simple chalice
path, viewBox `0 0 80 100`). The mockup
(`docs/design/ui-reimagining/direction-1/trade-balancer.html`, lines ~430-458)
uses a warmer palette (`coin #e2b13c / rim #c9962c / edge #7a4f12 / mound #d9a63a /
gem #a855f7 + gemL #d8b4fe + gemD #7e22ce`), coin **stacks with a rect rim** under
each coin, curved Bézier `mound()` paths, a **two-polygon faceted** `gem()`, a
richer `chalice()` (bowl + stem + foot + gem), viewBox `0 0 180 100`. The prior
look-translation build explicitly left this SVG drawing out of scope (its
TradePile comment: "the tier artwork itself ... is unchanged; LOOK-GAPS.md's own
gap here is the scale band's layout, not this SVG's drawing").

**Intended look.** Redraw `TradePile.tsx`'s tier art to follow the mockup's own
drawing — rimmed coin stacks, curved mounds, the two-tone faceted gem, the goblet,
and the mockup's gold/bronze/gem palette — keeping the five relative tiers, the
richer-glows / lighter-dims cue, and the drop-in / lift-fade transitions exactly as
they are (REQ-215). Still flat-shaded (no gradients or 3D lighting), still a single
gem per tier 4-5, still bronze-edged.

**Surfaces to change.** `apps/frontend/src/components/trade/TradePile.tsx` (the
tier `<g>`/primitive drawing and its colour constants; the component's props,
tiers, transitions, and `aria-label` stay). The `.pile` sizing/animation in
`index.css` (`.trade-pile-*`) is already matched and stays.

**Product truth.** This item proposes **one amendment** — see
`GATE-QUESTIONS.md` `## REQ-215`. REQ-215 today describes the piles as "flat
gold/amber with a bronze outline and one purple gem on tiers 4-5" and the prior
build recorded the internal SVG drawing as out of scope; the amendment records
that the tier artwork now follows the direction-1 mockup's drawing, closing that
drift (the same drift REQ-215 was written to stop). Owner ratifies at the gate.

---

## Item 2 — the Add-card search box has a different shape than the question box

**What a player sees.** On a Trade Balancer side, tapping **Add card** opens a card
search box. It is a plain near-rectangular input (slightly rounded corners, a `⌕`
glyph), so it reads as a different family from the **Ask a Question** composer — a
large fully-rounded pill with its controls inside a softly-glowing frame. The
owner: it "looks out of place."

**Live evidence.** Opened the Side A search (`item2-trade-search-box-desktop.png`)
beside the Ask a Question composer (`item2-ask-composer-desktop.png`). The search
input is the shared `.field` style (`border-radius: 0.65rem`, `--surface-ground`
fill); the composer is `.q-box` (`border-radius: 1.6rem`, `--surface-panel` fill,
a soft accent double box-shadow). Different radius, fill, and silhouette — confirmed.

**Intended look.** Give the Add-card search input the composer's pill silhouette and
surface treatment (the rounded-pill radius, the panel fill, the soft accent frame),
so it reads as the same family as the question box (REQ-206). Keep the `⌕` glyph,
the placeholder, the Escape-to-close behaviour, the suggestion list and the
printing picker exactly as they are. The 44px touch floor (REQ-205) still holds.

**Surfaces to change.** `.search-row .field` / `.search-pop` in
`apps/frontend/src/styles/flow.css` (and, if the trade side needs a tighter scope,
`.side .search-pop` in `index.css`). `TradeSide.tsx` markup needs no change.

**Shared-component note.** `.search-row` / `.field` are shared: the same card search
opens on Ask a Question. Applying the pill treatment to the shared class improves
both and is not a regression; scoping it to the trade side is also valid. This is an
implementation choice for map-out — the owner's finding is the trade side, and
"other screens" are a non-goal, so neither reading changes behaviour.

**Product truth.** None. No requirement describes the search field's silhouette;
the composer shape is already product truth (REQ-206) and the single-visual-system
intent (REQ-207) already wants surfaces to share one look. This is cosmetic
alignment to an existing reference the owner asked for — assumption-ladder rungs 1
(active requirements) and 5 (no behaviour change). No new/amended stable ID.

---

## Item 3 — the mobile Delete button on Question History rows looks broken

**What a player sees.** On a phone, each Question History row carries a **Delete**
control. Today it is tiny muted text absolutely pinned to the row's bottom-right,
with no button chrome, floating **over** the row's own answer line and `›` chevron.
On the first row the word "Delete" visually collides with the answer text — it reads
as stray text pasted on top, not a control. The owner: "ugly and looks broken."

**Live evidence.** Phone 390x844, Question History open with three seeded entries
(`item3-history-delete-mobile.png`). The "Delete" label sits on the row content and
overlaps the answer/chevron.

**Root (from code).** `.history-item-delete` in `index.css` is
`position: absolute; right: .6rem; bottom: .35rem; border: 0; background:
transparent; color: var(--text-muted); font-size: .68rem`, laid over a
`position: relative` `.history-item` whose `.history-row` grid already reserves the
right edge for the chevron (`ConversationHistoryDrawer.tsx`, rendered `!isWide`).

**Intended look.** Give the mobile delete control real, intentional chrome and a
place of its own so it never overlaps the row content — a clearly tappable control
(bordered/background affordance, or an icon control) sitting in its own slot within
the shared visual system, still meeting the 44px touch floor (REQ-205). No mockup
exists for Question History (direction-1 has no `question-history.html`), so the
target is "reads as a deliberate control in the suite's look," not a pixel match.
Delete behaviour and the confirm step are unchanged (REQ-118/FLOW-018).

**Surfaces to change.** `.history-item-delete` (and, if needed, `.history-item` /
the `.history-row` grid and its `.h-chev` on the phone path) in `index.css` /
`shell.css`. `ConversationHistoryDrawer.tsx` markup may gain a wrapper/slot but no
behaviour change.

**Product truth.** None. REQ-118 already requires each row to expose a delete
affordance distinct from select-to-resume; this only fixes how that affordance
looks. Bug/polish fix — assumption-ladder rungs 1 and 5. No new/amended stable ID.

---

## Item 4 — the mobile delete-confirm sheet clips its text

**What a player sees.** Tapping Delete opens the "Delete …?" confirm sheet — a nice
bottom sheet on a phone. But its heading runs hard to both screen edges and a long
question's first line is cut off at the right edge. The owner: the menu is nice,
"some of the text is cut off, let's fix that."

**Live evidence.** Phone 390x844, delete-confirm on the long seeded question
(`item4-delete-confirm-mobile.png`). Measured in-page: the panel
(`history-delete-confirm`, classes `drawer-panel confirm-panel`) computes
`padding: 0px` on all sides; the `<h2>` sits at left 0, right 390 (full viewport
width), so the heading text touches both edges and overflows under the panel's
`overflow-x: hidden`.

**Root (from code, confirmed live).** `.confirm-panel` sets `padding: 1.4rem 1.1rem
1.1rem` (shell.css:687), but the later, same-specificity `.drawer-panel { padding:
0 }` (shell.css:872) wins the cascade, so the shared confirm sheet renders with no
horizontal padding. On the full-width phone sheet this lets a long heading run edge
to edge and clip. (The same zero-padding applies to every ConfirmSheet — Trade
Balancer New trade, Life Tracker reset — but the narrow centred desktop card hides
it; the phone sheet is where it shows.)

**Intended look.** Restore the confirm sheet's intended horizontal padding so its
heading and body sit inside the panel with breathing room and never clip — make
`.confirm-panel`'s padding win over the base `.drawer-panel` reset (raise its
selector specificity, e.g. `.confirm-panel.drawer-panel`, rather than weakening the
shared sheet). Long headings wrap within the padded width. The sheet's words,
buttons, grab handle, and animation are unchanged (REQ-208).

**Surfaces to change.** `.confirm-panel` padding rules in
`apps/frontend/src/styles/shell.css` (687 and the 695 phone block). No component
change.

**Product truth.** None. REQ-208 already defines the shared sheet with a scrolling,
padded body; NFR-001 / DEC-117 / REQ-096 already require copy readable across all
widths. This restores intended behaviour — assumption-ladder rungs 1 and 5. No
new/amended stable ID.

---

## Summary of product-truth decisions

| Item | Change | Needs product truth? | Stable ID |
| --- | --- | --- | --- |
| 1 Pile art | Match mockup drawing | **Yes** — amends REQ-215's described art; reverses a prior out-of-scope note | `REQ-215` (amended) — `GATE-QUESTIONS.md` |
| 2 Search shape | Mirror composer pill | No — cosmetic alignment to REQ-206; REQ-207 intent | none |
| 3 Delete button | Real chrome, no overlap | No — REQ-118 affordance unchanged, styling bug | none |
| 4 Confirm clip | Restore sheet padding | No — REQ-208/NFR-001 restore, CSS bug | none |

## Live-verification note

All four reproduced live (not code-only), per the repo lesson that code-reading
alone produced wrong UI premises. Item 4's cause was confirmed by reading computed
styles in the live page, not inferred. Screenshots in
`PRD/work/ui-pass-2/.playwright-mcp/`.
