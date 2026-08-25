# Design brief — user-feedback-spec

## Outcome

A player who hits a bug can report it in one tap without losing their place,
and the owner can read what the Feedback & Bug Report feature does today from a
single page instead of replaying a decision chain across six sources. This
package writes that page: a current-state feature spec at
`PRD/sections/user-feedback/README.md`, on the DEC-168 template that
`sections/life-tracker/README.md` already established (Phase A #1, PR #105/#106).

This is Phase A #2 of the docs-refactor gameplan. It is documentation-only.

## Scope

- **In scope:** one derived, non-authoritative current-state spec consolidating
  existing product truth for the Feedback & Bug Report feature, plus one
  navigation-only Section Inventory row in `PRD/README.md`.
- **Consolidated sources:** DEC-104 (portal action-entry kind), DEC-105
  (Feedback & Bug Report feature body), REQ-086 / REQ-087 / REQ-088, FLOW-014,
  the `system-map.md` `## Feedback & bug report` entry, and the
  `integrations-and-data.md` Feedback Delivery Strategy. NFR-001 (mobile-first,
  touch) and NFR-006 (CSS-only reduced-motion) are cited because DEC-105 and
  REQ-087 name them for the modal's touch and motion behavior.
- **Out of scope:** any new or changed feedback behavior; any edit to a DEC /
  REQ / FLOW / NFR body; any new stable ID; any `apps/` code change.

## Template followed (DEC-168)

The spec uses the fixed template: a `Status:` draft/precedence marker, a
`Backed by:` line, **What it is** (one paragraph in player terms), **How it
works** (behavior grouped by surface, each carrying a `Built:` marker),
**Measured bounds**, **Rejected alternatives and deferred scope**, and **Where
it lives** (coarse location, deferring to `system-map.md`). A behavior enters
only in its current form; the feature has no supersession chain to strip, so no
prior shape is narrated.

## Material assumptions and evidence

Resolved by the assumption ladder in `preparation-contract.md`; none met the
three-condition genuine-decision-blocker test.

1. **Reusing the DEC-168 template for a second feature needs no new decision.**
   Evidence: DEC-168 states "later features may reuse this template; this
   decision requires no other feature to adopt it." Reuse is anticipated by the
   decision itself, so the spec is written under DEC-168 with no new DEC minted.
   (Ladder step 1: active decision answers it.)

2. **NFR-001 and NFR-006 belong on the `Backed by:` line.** The README flagged
   their relevance for confirmation. Evidence: DEC-105's Impact and REQ-086 /
   REQ-087 explicitly cite NFR-001 (touch-friendly, mobile) and NFR-006
   (CSS-only reduced-motion open/close) for the modal and action entry. They
   are load-bearing for current behavior, so both are cited — mirroring the
   life-tracker precedent. (Ladder step 1.)

3. **`PRD/README.md` gains one navigation-only Section Inventory row.**
   Evidence: DEC-168's Impact authorized exactly that row for `life-tracker`
   ("navigation only"); the parallel row for `user-feedback` is the same
   additive, reversible pattern and changes no product truth. (Ladder step 3:
   established local pattern.)

4. **`Measured bounds` carries the feature's fixed constraints, not pixels.**
   Evidence: the feedback feature has no pixel-measured surfaces (unlike the
   life-tracker's ≈53px band); its fixed bounds are the capture set (Bug /
   Suggestion / Other; required message; optional valid email) and the delivery
   shape (`https://formspree.io/f/<id>`, public non-secret id). The section
   states plainly that no pixel bounds exist and lists those constraints, per
   DEC-168's rule that a bound travels with the behavior it constrains.
   (Ladder step 5: preserve existing truth without inventing measurements.)

## Decisions (recorded, not new product decisions)

- No new `DEC`/`REQ`/`FLOW`/`NFR`/`Q` IDs. No existing body edited. Precedence
  is unchanged: `decisions.md` stays #1 and Read-First #1, and the spec's own
  marker names the cited `DEC`/`REQ`/`FLOW` as the winner on any conflict.
- The spec is corrected against its sources, never the reverse — a wrong spec
  is fixed against sources that still exist.

## Non-goals

- No decision about new feedback behavior; DEC-104/DEC-105 are untouched.
- No edit to `decisions/feedback.md`, `functional-requirements.md`,
  `user-flows.md`, `non-functional-requirements.md`, `system-map.md`, or
  `integrations-and-data.md`.
- No `apps/` code change; no GAMEPLAN or slice docs (those are map-out).

## Intake

- `intake/refactor-gameplan.md` — staged docs-refactor gameplan, evidence only,
  not authority. The documents it cites (`workflow.md`,
  `workflow-decomposition.md`, `answers.md`) were not opened, per the intake
  rule; only their paths are recorded there.

## References

- Spec written: `PRD/sections/user-feedback/README.md`
- Navigation row: `PRD/README.md` Section Inventory
- Template decision: DEC-168 (`PRD/sections/decisions/doc-process.md`)
- Precedent: `PRD/sections/life-tracker/README.md`
- Consolidated: DEC-104, DEC-105, REQ-086, REQ-087, REQ-088, FLOW-014,
  NFR-001, NFR-006
