# Gate questions — remove-dead-card-back-detector

Run one paused here. Answer each block by filling its `Verdict:` slot with
`accept`, `edit`, or `reject` (add a `Reason:` for edit or reject), then resume
with `/graph-run PRD/work/remove-dead-card-back-detector/`.

---

## DEC-055 — remove the dormant card-back detector

- **What this decides:** whether to delete `isCardBack()` — the card-back
  detection method that ships in the scan engine but is never called — and record
  that removal as current product truth.
- **In plain terms:** When you scan a card, nothing you see changes: this method
  runs on no path today. The scan engine was locked in (DEC-055) with the
  "Flip the card over" card-back prompt descoped for want of a reference image,
  but the detection method was **deliberately left in the code as the cheap way
  to turn the feature back on later** — add one reference asset and it works
  again. Deleting the method now means re-enabling card-back detection later
  costs more: someone has to **rewrite the detector as well** as supply the
  asset. The separate filter that keeps the card back out of the card-matching
  set stays exactly as it is either way.
- **What happens if you say no:** the dead method stays in the engine, the
  `PRD/sections/` text keeps describing card-back detection as a dormant,
  cheap-to-re-enable capability, and no code changes. The tree stays as it is on
  `main` today.

### Complete diff (PRD/sections/)

```diff
diff --git a/PRD/sections/functional-requirements.md b/PRD/sections/functional-requirements.md
@@ REQ-034 acceptance criteria @@
-  ... match threshold 120, card-back rejection threshold 100, and `__back` suffix stripping
+  ... match threshold 120, and `__back` suffix stripping (the card-back rejection threshold and its `isCardBack()` method shipped with this port but were later removed as dead code — DEC-055)

diff --git a/PRD/sections/integrations-and-data.md b/PRD/sections/integrations-and-data.md
@@ query-side processing @@
-... the engine retains a dormant card-back detection method (`isCardBack()`) but back-face detection is inactive until a `_card_back` reference is added to the bin (DEC-055)
+... the engine has no card-back detector — the previously-dormant `isCardBack()` method was removed as dead code — while the constructor still excludes the `_card_back` id from the searchable set; re-enabling card-back detection now requires reimplementing the detector in addition to supplying a `_card_back` reference asset (DEC-055)

diff --git a/PRD/sections/scan/README.md b/PRD/sections/scan/README.md
@@ Card-back "Flip the card over" prompt — closed door @@
-  detection is descoped for want of a canonical reference asset; the engine
-  method and build support remain dormant, re-enable by supplying the asset.
-  (DEC-055)
+  detection is descoped for want of a canonical reference asset. The dormant
+  engine detector (`isCardBack()`) was removed as dead code; the `_card_back`
+  id is still excluded from the searchable set. Re-enable now requires
+  reimplementing the detector as well as supplying the asset. (DEC-055)
@@ Deferred, not cut @@
-  cards (`FLOW-002`), and re-enabling card-back detection once a reference asset
-  exists (DEC-055).
+  cards (`FLOW-002`), and re-enabling card-back detection, which now needs a
+  reimplemented engine detector as well as a reference asset (DEC-055).

diff --git a/PRD/sections/scan/data/cardhashes.md b/PRD/sections/scan/data/cardhashes.md
@@ manifest / skiplist @@
-- The card-back reference (`_card_back`) support is present but dormant: no
-  canonical reference asset ships, so card-back detection is inactive (DEC-055).
+- No canonical `_card_back` reference asset ships, and the engine carries no
+  card-back detector — the dormant `isCardBack()` method was removed as dead
+  code. The `_card_back` id remains a distinct, DB-excluded entry; re-enabling
+  detection needs both a reference asset and a reimplemented detector (DEC-055).

diff --git a/PRD/sections/system-map.md b/PRD/sections/system-map.md
@@ Identification core @@
-- Summary: ... Retains a dormant card-back rejection method (inactive until a `_card_back` reference is added — DEC-055).
+- Summary: ... Card-back rejection is not implemented: the previously-dormant `isCardBack()` method was removed as dead code, while the `_card_back` id stays excluded from the searchable set (DEC-055).
```

- Verdict: <accept | edit | reject>
- Reason:
