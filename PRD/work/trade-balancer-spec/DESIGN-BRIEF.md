# Design brief — trade-balancer-spec

## Outcome

Two traders can build a two-sided card list and read whether a trade is balanced
at a glance; the owner can read what the Trade Balancer does today from one page
instead of replaying a decision chain across seven sources. This package writes
that page: a current-state feature spec at `PRD/sections/trade-balancer/README.md`,
on the DEC-168 template that `sections/life-tracker/README.md` (Phase A #1) and
`sections/user-feedback/README.md` (Phase A #2) already established.

This is Phase A #3 of the docs-refactor gameplan. It is documentation-only, and
it is the first Phase A feature to carry a **corpus**, so it is the first to
exercise the corpus/behavior split.

## Scope

- **In scope:** one derived, non-authoritative current-state spec consolidating
  existing product truth for the Trade Balancer; one companion corpus doc for
  the price artifact; two navigation-only Section Inventory rows in
  `PRD/README.md`.
- **Consolidated sources:** DEC-087 (Card Trade Balancer feature), DEC-088
  (printing-level price artifact), REQ-064 / REQ-065 / REQ-066 / REQ-145,
  FLOW-009, NFR-013, the `system-map.md` `## Trade balancer` and
  `### Printing-price artifact build` entries, the `screen-layout.md`
  `#### Trade Balancer` row, and the `CardPrintingPrice` shape in
  `integrations-and-data.md`. NFR-001 (mobile-first, touch) is cited because
  REQ-064 and NFR-013 name it for the trade layout.
- **Out of scope:** any new or changed trade-balancer behavior; any edit to a
  DEC / REQ / FLOW / NFR body; any new stable ID; any `apps/` code change; any
  Scryfall network refresh or artifact rebuild.

## Corpus / behavior split (authoring decision)

DEC-088's price artifact `apps/frontend/public/data/cardPrintingPrices.json`
passes all four `data/`-bucket clauses (external upstream source, a
build/refresh command, a committed artifact, describes Magic not TheJudge), so
its contents are kept out of the behavior doc.

**Decision:** the behavior README describes the feature and points to a
companion corpus doc at `PRD/sections/trade-balancer/data/cardPrintingPrices.md`
(a `data/` subfile nested under the feature directory) for the artifact's
source, build, shape, and measured figures. The README's `Backed by` line and a
`Corpus:` header line name the split; the artifact's fields, indexes, size, and
price-coverage counts appear only in the corpus doc.

- **Evidence (ladder step 1):** DEC-168 states a feature-spec directory "may
  gain further files later without a rename" — a nested `data/` subfile is
  exactly that, and keeps the corpus co-located with the only feature that
  consumes it. The task also framed the expected shape as "a `data/` subfile."
- **Rejected alternative — a top-level `PRD/sections/data/` bucket.** The
  gameplan's eventual end-state lists `data/` as a top-level bucket beside the
  feature dirs and `system-map/`. That is the Phase-C architecture for the whole
  refactor; standing it up now, from a single-feature draft consolidation and
  ahead of a landed decision authorizing the bucket, over-reaches. The gameplan
  is intake (evidence, not authority); DEC-168 is landed authority and points to
  the nested, smaller, reversible shape (ladder step 4). If a later shared corpus
  (scan artifacts) warrants a top-level bucket, this file moves there with no
  content change.
- The corpus doc is **documented from the committed artifact**, never rebuilt —
  the graph-run boundary and DEC-088's human-approved network gate forbid
  running `data:build` / `data:refresh` / any Scryfall refresh. Its figures are
  labelled to the committed 2026-06-05 snapshot.

## Template followed (DEC-168)

The spec uses the fixed template: a `Status:` draft/precedence marker, a
`Backed by:` line, **What it is** (one paragraph in player terms), **How it
works** (behavior grouped by surface, each carrying a `Built:` marker),
**Measured bounds**, **Rejected alternatives and deferred scope**, and **Where
it lives** (coarse location, deferring to `system-map.md`). A behavior enters
only in its current form; superseded shapes are recorded as closed doors under
**Rejected alternatives** when load-bearing.

## Material assumptions and evidence

Resolved by the assumption ladder in `preparation-contract.md`; none met the
three-condition genuine-decision-blocker test.

1. **Reusing the DEC-168 template for a third feature needs no new decision.**
   Evidence: DEC-168 — "later features may reuse this template; this decision
   requires no other feature to adopt it." (Ladder step 1.)
2. **Portal chrome and routing are cited, not consolidated.** DEC-089 / DEC-095
   / REQ-067 / FLOW-010 / DEC-157 / REQ-140 / DEC-145 own the navigation and URL
   for the `trade-balancer` destination. The IDEA scoped them to the later
   feature-portal spec; the README cites them as the way in but does not
   consolidate their bodies. (Ladder step 1.)
3. **`NFR-001` is on the `Backed by` line; `NFR-006` is not.** Evidence: REQ-064
   and NFR-013 cite NFR-001 (mobile-first, touch) for the trade layout, so it is
   load-bearing here. NFR-006 (CSS-only reduced-motion) is cited only by the
   portal chrome (DEC-089), which this spec does not own, so it is left off.
   (Ladder step 1.)
4. **`Measured bounds` carries the feature's fixed constraints and the one
   surviving pixel bound.** The USD-only scope, quantity rule, and the REQ-145
   freshness-line bound (one line at 390×844, `scrollWidth` 299) are current
   constraints; the artifact's byte/entry counts live in the corpus doc, not
   here. Per DEC-168, a bound travels with the surface it constrains. (Ladder
   step 5.)
5. **Two navigation-only `PRD/README.md` rows.** DEC-168 authorized one Section
   Inventory row per new spec directory; the `trade-balancer/` row follows that
   pattern, and the nested `data/` subfile needs no row of its own. A second row
   is added only if the reviewer prefers the corpus doc surfaced separately —
   the default here is one feature row, matching the life-tracker/user-feedback
   precedent. (Ladder step 3.)

## Decisions (recorded, not new product decisions)

- No new `DEC`/`REQ`/`FLOW`/`NFR`/`Q` IDs. No existing body edited. Precedence is
  unchanged: `decisions.md` stays #1 and Read-First #1, and each spec file's
  marker names the cited sources as the winner on any conflict.
- The spec and corpus doc are corrected against their sources, never the reverse.

## Non-goals

- No decision about new trade-balancer behavior; DEC-087 / DEC-088 are untouched.
- No edit to `decisions/trade-balancer.md`, `functional-requirements.md`,
  `user-flows.md`, `non-functional-requirements.md`, `system-map.md`,
  `screen-layout.md`, or `integrations-and-data.md`.
- No `apps/` code change; no artifact rebuild or Scryfall refresh; no GAMEPLAN or
  slice docs (those are map-out).

## Intake

- `intake/refactor-gameplan.md` — staged docs-refactor gameplan, evidence only,
  not authority. The documents it cites (`workflow.md`,
  `workflow-decomposition.md`, `answers.md`) were not opened, per the intake
  rule; only their paths are recorded there.

## References

- Spec written: `PRD/sections/trade-balancer/README.md`
- Corpus doc written: `PRD/sections/trade-balancer/data/cardPrintingPrices.md`
- Navigation rows: `PRD/README.md` Section Inventory
- Template decision: DEC-168 (`PRD/sections/decisions/doc-process.md`)
- Precedent: `PRD/sections/life-tracker/README.md`,
  `PRD/sections/user-feedback/README.md`
- Consolidated: DEC-087, DEC-088, REQ-064, REQ-065, REQ-066, REQ-145, FLOW-009,
  NFR-013, NFR-001
