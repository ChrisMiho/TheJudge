# Gate questions — ui-pass-2

One decision for the owner. Items 2, 3 and 4 in the brief are cosmetic alignment
and bug fixes against requirements that already exist (REQ-206 composer shape,
REQ-118 delete affordance, REQ-208 shared sheet, NFR-001 responsive copy), change
no behaviour, and need no product-truth change — so they carry no gate question.
Only the pile-art change touches recorded truth.

---

## REQ-215 — the trade gold piles match the mockup's art, not just its idea

**What this decides:** whether the Trade Balancer's two piles of gold are redrawn
to look like the approved mockup — rounded gold hills, stacked coins with a rim,
a faceted gem, a goblet on the top tier — or keep today's plainer art (flat disc
coins, a sharp triangle mound, a single flat gem, a simple cup).

**In plain terms:** each trade side shows its value as a growing pile of gold
(REQ-215). The piles already do the right thing — five relative tiers, the richer
side glows, tiers drop in and lift out — but the app draws the gold in its own
simpler shapes, so it looks different from the mockup the look was signed off from
(`docs/design/ui-reimagining/direction-1/trade-balancer.html`). The last build that
matched the screen to the mockup deliberately left this one SVG drawing alone (it
only resized the pile's box), which is why the art drifted. This change redraws the
pile art to follow the mockup exactly — rimmed coin stacks instead of flat discs,
rounded mounds instead of pointed triangles, a two-tone faceted gem, and a goblet
crowning the top pile — in the mockup's warmer gold/bronze/purple palette. Nothing
else moves: same tiers, same glow-vs-dim cue, same drop-in / lift-fade motion, same
totals and verdict, still flat-shaded with a bronze outline and one gem on tiers
4-5. The pile's fixed gold/bronze/gem colours still live in code
(`components/trade/TradePile.tsx`), which REQ-216 already allows as a named
exemption, so this does not break the one-token-layer rule.

**What happens if you say no:** the piles keep today's plainer art and stay visibly
off from the mockup you approved; the drift the look-translation work was meant to
remove stays on this one screen.

### Proposed change — `PRD/sections/functional-requirements.md`, REQ-215

Amend the pile-art acceptance bullet:

```diff
   - two piles of gold sit on a glass panel (REQ-207); each pile has five relative
-    tiers, drawn in flat gold/amber with a bronze outline and one purple gem on tiers 4-5
+    tiers, drawn in flat gold/amber with a bronze outline and one purple gem on tiers 4-5.
+    The tier artwork follows the direction-1 mockup's own drawing
+    (`docs/design/ui-reimagining/direction-1/trade-balancer.html`): coins are stacked
+    cylinders with a rim edge (not plain discs), mounds are rounded (not sharp triangles),
+    the gem is a two-tone faceted cut, and tier 5 crowns the hoard with a goblet — in the
+    mockup's gold/bronze/gem palette, rather than a re-drawn approximation. The fixed
+    pile materials still live in `components/trade/TradePile.tsx` (REQ-216's named
+    exemption); the tiers, the relative-share logic, the glow/dim cue and the
+    drop-in / lift-fade motion are unchanged
```

Add one Notes line under REQ-215:

```diff
   - amended by `ui-look-translation` (2026-10-02): a repeat add of the same printing
     and finish merges into one row's quantity, matching the mockup (the first build's
     owner question 4); totals are unchanged
+  - amended by the `ui-pass-2` polish pass (2026-10-04): the tier artwork follows the
+    direction-1 mockup's drawing (rimmed coin stacks, rounded mounds, two-tone faceted
+    gem, goblet), closing the pile-art drift the first look-translation build left out
+    of scope (its TradePile note recorded the SVG drawing as not the gap it was fixing);
+    concept, tiers, transitions, the REQ-216 palette-in-code exemption and behaviour are
+    unchanged
```

- Verdict: accept
- Reason: Owner accepted as proposed (2026-10-04) — redraw the pile art to match the direction-1 mockup; behaviour, tiers, transitions and the REQ-216 palette-in-code exemption unchanged.
