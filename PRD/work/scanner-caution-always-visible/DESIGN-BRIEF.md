status: refined

# Design brief: scanner caution triangle always visible

## What a player experiences

A player opens the card scanner on the Trade Balancer. Before they have scanned
anything, a small yellow caution triangle already sits in the scanner's
top-right corner. Tapping it opens a short note: card scanning is experimental.
Today that triangle is invisible until the player's first card is recognised and
held — so a player whose scans never lock (bad light, an unreadable card, a
camera that cannot find a match) never learns the feature is experimental, which
is exactly the player who most needs the warning.

The fix: the caution triangle is present from the moment the scanner opens, and
the warning note still opens only when the triangle is tapped. Nothing else
about the scanner changes.

## Root cause (verified in code)

`apps/frontend/src/components/ScanReviewBubble.tsx` renders the top-right block —
the caution triangle and the scanned-count pill together inside one
`.vf-top-right` wrapper. Near the top of the component:

```tsx
if (entries.length === 0) {
  return null;
}
```

That early return unmounts the whole top-right block until at least one card is
held. The caution triangle is collateral damage: it is a sibling of the count
pill inside the same wrapper, so it disappears with the pill when the holding
list is empty. The mockup (`docs/design/ui-reimagining/direction-1/card-scan.html`,
`.vf-top-right`) draws the caution triangle from the start; the build regressed
it by gating the whole block on the holding list.

## Design direction

Split the two concerns the `entries.length === 0` guard currently conflates:

- The **caution triangle** (and its tap-to-open note) renders whenever the
  scanner is open, independent of the holding list.
- The **count pill** keeps its current behaviour: it appears once the first card
  is held and shows the running count. Whenever both are present, the triangle
  and the count pill sit alongside each other in the scanner's top-right (owner
  verdict on B2, 2026-10-04). (Assumption A1 below.)

In practice: the component stops returning `null` on an empty holding list; it
always renders the caution triangle, and renders the count pill only when
`entries.length > 0`. The warning note stays tap-to-open.

Because `ScanReviewBubble` is one shared component, fixing it here fixes the
caution on every surface that renders it at once. See Blocker/gate question B1
for the scope decision the owner owns.

## Scope

In scope:
- The scanner's experimental-caution triangle is visible from scanner open, with
  its note opening on tap, in `ScanReviewBubble.tsx`.
- Product truth for the caution control's visibility (REQ-214 and its three
  reconciling spots), proposed in `GATE-QUESTIONS.md`.

Non-goals (from the request and IDEA.md):
- Scan accuracy, detection, lock, or the ding — unchanged.
- The warning wording — unchanged (the existing copy stays).
- The count pill's own appearance timing — preserved (A1).
- The Trade Balancer's **price** caution-triangle (the $0 missing-price flag,
  REQ-065) — a different indicator entirely; untouched.
- The `ui-pass-2` observations items 1-4 that share the intake file — a
  different, already-built package.

## Material assumptions and evidence

- **A1 — the count pill keeps its show-on-first-hold behaviour; only the caution
  triangle becomes always-on.** Evidence: the request names only the caution
  triangle ("the triangle sits in the scanner's top-right from the moment the
  scanner opens"); it says nothing about the count pill. Preparation-contract
  assumption ladder rule 5 (preserve user-visible behaviour unless the request
  changes it) and rule 4 (smallest reversible scope). A "0" count pill would be
  new noise the request did not ask for. Owner verdict on B2 (2026-10-04): keep
  the pill as-is (appears on first hold), and the triangle and count pill sit next
  to each other whenever both are present.
- **A2 — the always-on caution is written as a property of the shared scanner
  chrome (every host), because the component is shared and the PRD bars forking
  it.** Evidence: `ScanReviewBubble` is rendered identically by Trade Balancer
  (`trade/TradeSide.tsx:270`), the In-Depth zone picker (`ZoneCardPicker.tsx:289`),
  and Ask a Question / Quick Lookup (`portal/quick-lookup/QuickLookupApp.tsx:575`);
  `PRD/sections/screen-layout.md` (scan Notes row) says "never fork the shared
  component"; REQ-214 already defines the caution control on "every host that
  scans." The experimental-scanner rationale is surface-independent. Owner verdict on
  B1 (2026-10-04): all surfaces — the same scanner component serves every flow,
  so fix the shared component once.
- **A3 — the existing warning copy and the tap-to-open interaction are
  unchanged.** Evidence: the request says "the warning text appearing only when
  the player taps the triangle"; the copy already matches the mockup
  (`card-scan.html` caution panel) and IDEA.md lists wording as a non-goal.

## Durable-truth impact

One stable id is amended: **REQ-214** (the scanner's holding-list / count-pill /
caution-control chrome). Its home is `PRD/sections/functional-requirements.md`;
its truth is also stated in `PRD/sections/scan/README.md`, `PRD/sections/user-flows.md`
(scan main flow), and `PRD/sections/screen-layout.md` (scan Chrome row). All four
currently frame the caution as "beside the count pill," which inherits the pill's
hidden-until-first-hold behaviour. The amendment, carried in full in
`GATE-QUESTIONS.md`, specifies the caution control renders from scanner open,
independent of the holding list. No new REQ, FLOW, or DEC is minted.

## Sequencing consideration (not product truth)

Open PR #254 (the `ui-pass-2` package) also edits `ScanReviewBubble.tsx` and
moved the Exit ✕ control per REQ-214. The eventual build of this package should
land after #254 merges, to avoid a conflict in the same component. This is a
build-ordering note only; it decides nothing about product truth here.

## References

- Request (intake, evidence not authority): `intake/request.md`
- `intake/observations.md` — `ui-pass-2` feedback; only the scanner-caution item
  applies, items 1-4 are out of scope
- Code: `apps/frontend/src/components/ScanReviewBubble.tsx`,
  `trade/TradeSide.tsx`, `ZoneCardPicker.tsx`,
  `portal/quick-lookup/QuickLookupApp.tsx`
- Mockup: `docs/design/ui-reimagining/direction-1/card-scan.html` (`.vf-top-right`)
- Product truth: REQ-214 (functional-requirements.md), scan/README.md,
  user-flows.md (scan main flow), screen-layout.md (scan Chrome row)
- Prior receipts (citations only, not opened): see `IDEA.md`
