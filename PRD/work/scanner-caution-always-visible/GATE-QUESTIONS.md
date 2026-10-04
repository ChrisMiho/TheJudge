# Gate questions: scanner-caution-always-visible

Refinement proposes product truth; it never edits `PRD/sections/`. Each block
below is the exact edit to apply at build if accepted. Answer each with a
verdict (`accept` / `edit` / `reject`) and a reason.

---

## REQ-214 — the "experimental" caution triangle shows from the moment the scanner opens

**What this decides:** whether the yellow caution triangle in the card
scanner's top-right is there from the instant the scanner opens, or stays
hidden (as it is today) until the player's first card is successfully scanned
and held.

**In plain terms:** the scanner has a small yellow warning triangle in its
top-right corner; tapping it says "card scanning is experimental." Today that
triangle is drawn in the same block as the scanned-count pill, and that whole
block is hidden until at least one card is held. So a player whose scans never
work — bad light, an unreadable card, a camera that never finds a match — never
sees the warning at all, even though they are the player who most needs it. This
change makes the caution triangle appear from the moment the scanner opens,
before any card is scanned, while the warning note still opens only when the
triangle is tapped. The scanned-count pill is unchanged: it still appears once
the first card is held (assumption A1 in the brief). Nothing about scanning,
detection, the lock, the ding, or the warning wording changes. (amends REQ-214,
the scanner's holding-list / count-pill / caution chrome; the warning copy is
the mockup's, `card-scan.html`)

**What happens if you say no:** the triangle keeps appearing only after a
successful scan, so players whose scans fail are never warned the feature is
experimental — the bug the request was raised to fix stays.

### Proposed diff

**1. `PRD/sections/functional-requirements.md` — REQ-214 Description (~line 5486)**

```diff
-- Description: The shared camera scanner (FLOW-006) keeps its detection, lock and ding unchanged. A recognised card now waits in the scanner's own holding list instead of joining the destination the instant it is recognised; the list is shown by a top-right count pill, with Remove on each entry and a caution note that scanning is experimental. Closing the scanner (the "Exit scan" control, now a square box with an X above the camera's top-right corner) commits every held card to the zone or trade side it was opened from, in one step. The count pill, previously built only for In-Depth's zones, now appears on every host that scans: In-Depth's Cards station, Ask a Question, and Trade Balancer.
++ Description: The shared camera scanner (FLOW-006) keeps its detection, lock and ding unchanged. A recognised card now waits in the scanner's own holding list instead of joining the destination the instant it is recognised; the list is shown by a top-right count pill, with Remove on each entry. A caution control naming scanning as experimental sits in the top-right from the moment the scanner opens — present before any card is held, independent of the holding list and the count pill — with its note opening only on tap. Closing the scanner (the "Exit scan" control, now a square box with an X above the camera's top-right corner) commits every held card to the zone or trade side it was opened from, in one step. The count pill, previously built only for In-Depth's zones, now appears on every host that scans: In-Depth's Cards station, Ask a Question, and Trade Balancer.
```

**2. `PRD/sections/functional-requirements.md` — REQ-214 Acceptance Criteria (~line 5493)**

```diff
-  - a caution control beside the count pill opens a one-line note that card scanning is experimental, dismissed with "Got it"
+  - a caution control — a yellow triangle in the scanner's top-right — is visible from the moment the scanner opens, before any card is held, independent of the holding list and whether the count pill is shown; it opens a one-line note that card scanning is experimental only when tapped, dismissed with "Got it"
```

**3. `PRD/sections/scan/README.md` — the count-pill Built bullet (~lines 108-111)**

```diff
-- Built: a top-right **count pill** holds this scanning session's own list of
-  recognised-but-not-yet-added cards — a scan-local holding list, not the
-  destination's own card list — and expands to a viewport-capped 320px panel
-  listing each held card with a single-tap, no-confirmation **Remove** plus a
-  caution control explaining that scanning is experimental. Each entry shows the card's
+- Built: a top-right **count pill** holds this scanning session's own list of
+  recognised-but-not-yet-added cards — a scan-local holding list, not the
+  destination's own card list — and expands to a viewport-capped 320px panel
+  listing each held card with a single-tap, no-confirmation **Remove**. Beside
+  the count pill, a caution control (a yellow triangle) sits in the scanner's
+  top-right from the moment the scanner opens — present before any card is held,
+  independent of the holding list, so a player whose scans never lock still sees
+  it — and opens a one-line note that scanning is experimental only on tap. Each entry shows the card's
```

**4. `PRD/sections/user-flows.md` — scan Main Flow step 1 (~line 131) and step 5 (~line 136)**

Step 1 — add the always-on caution:

```diff
-  1. Camera opens as its own screen with a card-shaped guide overlay and stays open for the session.
+  1. Camera opens as its own screen with a card-shaped guide overlay and stays open for the session. From this moment, before any card is scanned, a caution control — a yellow triangle in the top-right — is visible; tapping it opens a one-line note that scanning is experimental (REQ-214).
```

Step 5 — drop the trailing caution sentence (now stated at step 1); the rest of step 5 is unchanged:

```diff
-  5. To drop a wrongly held card before it joins the zone, the user taps the count pill in the top-right. [...] The user drops the card from the holding list in one tap (no confirmation) without leaving the camera — nothing is added to the zone for it (DEC-058, DEC-078, DEC-151, REQ-214). A caution control beside the pill opens a one-line note that scanning is experimental.
+  5. To drop a wrongly held card before it joins the zone, the user taps the count pill in the top-right. [...] The user drops the card from the holding list in one tap (no confirmation) without leaving the camera — nothing is added to the zone for it (DEC-058, DEC-078, DEC-151, REQ-214).
```

(The `[...]` is the unchanged middle of step 5; only the final caution sentence is removed.)

**5. `PRD/sections/screen-layout.md` — scan Chrome row (~line 213)**

```diff
-| Chrome | A square ✕ exit box sits above the camera's top-right corner on every host (accessible name "Exit scan"); the count pill (and, when open, its caution note) sits beneath it, non-overlapping; the opt-in Debug panel keeps its own bottom-left placement with a themed accent border (REQ-214); when the mockup's scanner page carries the hint line, one line of static text sits under the camera frame in the mockup's position — text, not a control, never overlapping the camera frame, the count pill or the review list (REQ-214, REQ-070) |
+| Chrome | A square ✕ exit box sits above the camera's top-right corner on every host (accessible name "Exit scan"); a caution control (a yellow triangle) sits in the top-right from the moment the scanner opens, independent of the holding list, with its caution note opening only on tap; the count pill sits beside/beneath it, non-overlapping, and appears once the first card is held; the opt-in Debug panel keeps its own bottom-left placement with a themed accent border (REQ-214); when the mockup's scanner page carries the hint line, one line of static text sits under the camera frame in the mockup's position — text, not a control, never overlapping the camera frame, the count pill or the review list (REQ-214, REQ-070) |
```

- Verdict: accept
- Reason: Owner (2026-10-04): yes — the triangle always displays and brings up the pop-up warning when clicked on.

---

## Blocker questions

### B1 — does the always-visible caution apply to every scanner, or only the Trade Balancer?

**What this decides:** whether the always-from-open caution triangle shows on
every surface that opens the card scanner (Trade Balancer, the In-Depth zone
card picker, and Ask a Question / Quick Lookup), or only on the Trade Balancer
scanner the request named.

**In plain terms:** the caution triangle lives in one shared piece of code
(`ScanReviewBubble`) that all three scanners render exactly the same way. The
same bug — the triangle hidden until the first card is held — is on all three
today. The request named the Trade Balancer because that is where the owner hit
it, but the warning is about the scanner itself, which is the same experimental
engine everywhere. Fixing the shared code once makes the caution always-on on
all three at once. Scoping it to only the Trade Balancer would instead mean
forking the shared component or threading a per-surface flag through it — which
the product truth explicitly bars ("never fork the shared component",
screen-layout.md scan Notes). So the smaller, cleaner, PRD-aligned change is the
all-surfaces one.

**Recommendation:** apply to all three scanner surfaces (the REQ-214 amendment
above is written that way, as a property of the shared scanner chrome on every
host). This is a recommendation, not a decision taken — the scope is yours.

**What happens if you say "Trade Balancer only":** the build must fork the
shared component or add a surface prop (against the no-fork rule), the In-Depth
and Ask a Question scanners keep the never-warned-on-failed-scan bug, and the
REQ-214 amendment's "every host" wording needs narrowing to the Trade Balancer.

- Verdict (all surfaces / Trade Balancer only): all surfaces
- Reason: Owner (2026-10-04): all scanners get this; the same scanner component should be used for all flows, so there is no reason any flow would differ. Fix the shared component once.

### B2 (secondary) — the count pill stays hidden until the first card is held

**What this decides:** whether making the caution always-on also makes the
scanned-count pill show a "0" from scanner open, or whether the pill keeps its
current behaviour (it appears only once the first card is held).

**In plain terms:** the request asked only for the caution triangle to be always
visible; it said nothing about the count pill. The default taken in the proposal
is to leave the pill exactly as it is — it appears when the first card is held —
and make only the caution triangle always-on (brief assumption A1). If you would
rather the pill also show from open (reading "0"), say so and the proposal and
build widen to that.

**Recommendation:** keep the pill as-is (caution-only change). No product-truth
edit is needed for this default; it is recorded so you can flip it.

- Verdict (keep pill as-is / show pill from open): keep pill as-is
- Reason: Owner (2026-10-04): leave the pill as-is (appears on first hold) — just make sure the triangle and the count pill sit next to each other whenever both are present. (Resolves the scan/README wording nit: triangle always top-right, count pill alongside it once it appears.)
