# Gate questions — tab-personality-color-sync

Proposed product truth for the `define` gate. One `## <STABLE-ID>` block per new
stable id, each with its plain-language block, the complete proposed
`PRD/sections/` diff, and an accept/edit/reject slot. Blocker questions follow.

Nothing here is written to `PRD/sections/` — implementation applies the accepted
proposal later.

---

## REQ-219 — give the Menu tabs personality and keep them in the chosen colour

**What this decides:** whether the rows in the ☰ Menu — Ask a Question, Question
History, Life Tracker, Trade Balancer, Send feedback — get a bolder, more
characterful look that visibly wears whichever Magic colour the player has chosen
in Theme.

**In plain terms:** today every Menu row is the same flat grey text line with a
small symbol in front (a card for Ask a Question, a heart for Life Tracker,
scales for Trade Balancer, a clock for History, a pen for feedback). They all
already tint faintly to the one active Theme colour, and the current screen shows
a lit bar — but the owner finds them "plain and boring." This change keeps the
same rows, same order, and same thing-each-does, and gives each row a stronger
identity mark plus a livelier hover/press feel, all drawn in the active colour
profile's light — so switching Theme to Red makes the tabs glow red, Green shifts
them green, and so on. It reuses the colour tokens and motion the app already
ships (the same restrained accent treatment the View Context button and the chat
composer already use, DEC-081; the app's existing CSS-only hover/press motion,
DEC-079) — no new colours, no animation library, and it honours reduced-motion
and keeps every row tappable at 44px. It refines the "all rows look identical"
rule (DEC-104) so rows keep their shared shape and order but carry per-row
identity. (This is reading **A** in the brief — the tabs reflect the *one active*
Theme colour. If instead each tab should wear its *own fixed* Magic colour, see
Blocker question Q-219 — that reshapes this requirement.)

**What happens if you say no:** the Menu rows stay a flat single-colour list with
small generic symbols; the colour-sync and personality the owner asked for are
not built.

### Proposed diff

**1. `PRD/sections/functional-requirements.md` — new entry (append after REQ-217):**

```diff
+### REQ-219
+- Title: The Menu tabs carry per-destination personality and stay synced to the active colour profile
+- Priority: medium
+- Description: The rows of the ☰ Menu tray — the app's "tabs" — must read as
+  characterful and must visibly wear the active MTG colour profile, without
+  changing what any row does. Each destination/action row (Ask a Question,
+  Question History, Life Tracker, Trade Balancer, Send feedback) keeps its
+  existing per-destination glyph (the card silhouette, ♥, ⚖, ◷, ✎) but presents
+  it as a bolder, consistently-sized identity mark, and the row carries the
+  shipped restrained ambient-accent treatment (a low-intensity accent at rest, a
+  strengthened accent on hover/`focus-visible`, a sustained-but-restrained
+  treatment on the current row) drawn from the active palette's four accent
+  tokens, plus the app-wide CSS-only decorative hover/press micro-interaction.
+  Because the colour comes from the single active profile applied app-wide
+  (`data-profile`/`--accent*`), switching the Theme colour re-skins every tab to
+  match — Red glows red, Green shifts green, and so on. The rows keep their shared
+  structure, array order, grid, and ≥44px height; this refines the "rows render
+  identically" rule (DEC-104) to allow per-destination identity and profile-synced
+  accent within that shared frame. Presentation only: no change to navigation
+  order, routing, labels, the `PortalEntry`/registry contract, state preservation,
+  In-Depth's lack of its own Menu row (REQ-067/REQ-206), or the Theme band.
+- Acceptance Criteria:
+  - each of the five Menu rows shows its existing per-destination glyph as a
+    bolder, consistently-sized identity mark; no row loses or swaps its glyph
+  - every tab's accent (glyph, hover, current-row fill and lit bar) is driven by
+    the active palette tokens, so selecting each of the six Theme profiles
+    re-skins all tabs to that profile's colour with no per-tab hard-coded colour
+  - the current screen still reads unambiguously as current (its mark and fill
+    persist), and hover/`focus-visible` state is reachable by touch and keyboard,
+    never by hover alone
+  - decorative motion is CSS-only (no library) and becomes `auto`/none under
+    `prefers-reduced-motion`; no flow requires motion to complete (NFR-006)
+  - every row keeps a ≥44px touch target (the current 48px rows satisfy this) and
+    body text stays at or above the `text-sm`/`text-xs` floor (NFR-001)
+  - navigation order, routing, labels, selection, reload persistence, and the
+    Theme band are unchanged
+- Constraints:
+  - pure frontend/presentation; no backend, no `AskAiRequest`/`GameContext`, no
+    routing or `PortalEntry`/registry contract change
+  - reuse the existing four palette tokens only — no new token roles (DEC-081),
+    no palette-tinted page background beyond REQ-200's existing allowance
+  - no per-destination hard-coded colour (that is Q-219's fork B, not this
+    requirement); all tab colour derives from the one active profile
+  - adds no user-visible screen or major overlay, so no new `screen-layout.md`
+    row is required (DEC-149/REQ-126)
+- Dependencies:
+  - REQ-067
+  - REQ-206
+  - REQ-207
+  - REQ-213
+  - DEC-079
+  - DEC-081
+  - DEC-104
+  - NFR-006
+- Notes:
+  - the "tabs" are the Menu tray's `.tray-nav-list` rows
+    (`apps/frontend/src/components/portal/FeaturePortalMenu.tsx`), styled in
+    `apps/frontend/src/styles/shell.css` (`.tray-nav-list`); the per-destination
+    glyphs live in `ROW_GLYPHS`. The six profiles and their accent tokens are in
+    `apps/frontend/src/lib/theme/palettes.ts`
+  - reserved and proposed by the `tab-personality-color-sync` package; written for
+    reading A (tabs reflect the one active profile). If the owner chooses reading B
+    at Q-219 (each tab wears its own fixed Magic colour), this requirement is
+    reshaped before build
```

**2. `PRD/sections/shared-chrome/README.md` — amend "The Menu corner rail and tray" (add one bullet after the "Built: the tray lists …" bullet, which currently ends "The no-stored-preference default is still `quick-lookup`. (REQ-067, REQ-206, REQ-213, DEC-135, DEC-104, DEC-095)"):**

```diff
   Question History is a fixed row, not a registry entry, opening the active
   destination's own history trigger (REQ-213). Rows render full-bleed, separated
   by rules that meet the tray's left wall; the active entry keeps a check mark and
   quiet fill. The no-stored-preference default is still `quick-lookup`. (REQ-067,
   REQ-206, REQ-213, DEC-135, DEC-104, DEC-095)
+- Built: each tray row carries per-destination personality and stays synced to the
+  active colour profile — its existing glyph (card / ♥ / ⚖ / ◷ / ✎) rendered as a
+  bolder, consistently-sized identity mark, with the shipped restrained
+  ambient-accent treatment (rest → hover/`focus-visible` → current) and the
+  app-wide CSS-only hover/press micro-interaction, all drawn from the single active
+  palette's accent tokens so switching Theme re-skins every tab. Rows keep their
+  shared structure, array order, grid, and ≥44px height; this refines DEC-104's
+  "rendered identically" to per-destination identity within a shared frame. Reuses
+  the existing four palette tokens — no new token roles (DEC-081) — honours
+  reduced motion (NFR-006), and gives no tab a hard-coded per-destination colour.
+  (REQ-219, DEC-081, DEC-079, DEC-104, NFR-006)
```

- Verdict:
- Reason:

---

## Blocker questions

### Q-219 — does each tab wear its own fixed colour, or all share the chosen colour?

**What this decides:** the whole character of the feature — whether "sync up with
its respective colour profile" means (A) every tab reflects the *one* Magic colour
the player picks in Theme, or (B) each tab wears its *own fixed* Magic colour,
different from the others, no matter which Theme is chosen.

**In plain terms:** the app wears exactly one Magic colour at a time — pick Blue
and the whole app (background, accents, the drifting element behind the page) is
Blue. The tabs already follow that one colour faintly. Reading **A** keeps that:
give the tabs more personality and let them keep glowing in whichever single
colour is active — low risk, consistent with the rest of the app, but the
colour-sync part is already most of the way there, so A mainly delivers the
"personality" half. Reading **B** is new: each tab gets its own permanent colour
(for example Life Tracker always green, Trade Balancer always its own colour), so
you'd see several colours in the Menu at once. B matches the literal word
"respective" and gives the strongest per-tab personality, but it is a brand-new
idea for this app — nothing today gives a feature its own colour — it would put
five different colours against the app's "one quiet colour" look, and it needs a
made-up tab→colour map the owner should approve.

**Recommendation:** start with **A** (proposed as REQ-219) — it is coherent with
the whole app, reuses what is shipped, and ships safely; if the owner wants the
bolder per-tab-colour look, answer **B** here and REQ-219 is reshaped into a
per-destination colour mapping (and the owner picks, or approves, each tab's
colour).

**Why it meets the genuine-blocker test (all three):** (1) A and B are materially
different features and different code; (2) the PRD describes the current
one-active-profile model but cannot say which the owner intends for a new request,
and the owner's own word "respective" points at B while the architecture points at
A; (3) building A silently forecloses B, and vice versa.

- Answer (A / B, and if B, any tab→colour preferences):
