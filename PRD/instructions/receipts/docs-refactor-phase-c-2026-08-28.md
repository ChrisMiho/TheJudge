# Receipt — docs-refactor Phase C (retire the decision log)

- **Date:** 2026-08-28
- **Slug:** `docs-refactor-phase-c` (Package 1, Phase C of the docs-refactor gameplan)
- **Status:** shipped
- **Type:** documentation only — retires the decision log behind the seven
  current-state feature specs. No `apps/` code change, no backend route change,
  no UI behavior change. The one irreversible step of the refactor: it deletes
  decision bodies and edits the `thejudge-*` skills, so it ran as an ordinary
  interactive plan-first session, not a graph run or a sweep.

## What shipped

The decision log stops being product truth. The seven feature specs under
`PRD/sections/<feature>/README.md` are now precedence #1 and read-first; the
`PRD/sections/decisions.md` index is demoted to precedence #2, a historical
resolver that keeps every `DEC-ID` resolvable so no citation dangles and no ID
is renumbered.

## Actions taken

- [x] **Flip precedence.** Rewrote the identical status header in all 7 specs
      (life-tracker, user-feedback, trade-balancer, scan, quick-lookup,
      shared-chrome, in-depth): draft/non-authoritative → current-state truth,
      precedence #1. Rewrote the `decisions.md` router preamble to precedence #2 /
      historical index / "no new decisions written."
- [x] **Delete the bodies.** Removed all decision bodies by deleting the 17
      per-domain files under `sections/decisions/` (154 audited-retired decisions
      plus the already-superseded tombstones). Kept `sections/decisions/deployment.md`,
      which holds the only two survivors — **DEC-084** and **DEC-169** — because
      their Lambda/serverless content is not yet captured in any durable spec.
- [x] **Keep every ID resolvable.** The router index retains all 169 rows; the
      middle column now reads `retired` for a deleted body and
      `live → decisions/deployment.md` for the two survivors. The ~1,522 durable
      `DEC-ID` citations across the specs, functional-requirements, system-map,
      user-flows, etc. resolve through this index and were left untouched.
- [x] **Rewrite the decision-writing step.** Retargeted the write-a-DEC rule at
      the feature specs across the process layer: `requirement-format.md` (Decision
      Template replaced), `doc-lifecycle.md`, `agent-working-rules.md`,
      `writing-rules.md`, `technical-design-rules.md`, `graph-workflow-contract.md`,
      and the skills `thejudge-refinement`, `thejudge-cleanup`,
      `thejudge-quality-check`, `thejudge-kickoff`, `thejudge-implement(-all)`.
      Mirrored to `.agents/skills/` via `npm run skills:ai-sync`.
- [x] **Point the define gate at REQ IDs.** The gate is already ID-agnostic;
      reframed the `DEC-166` example in `graph-gate-review` as a REQ and updated the
      `graph-run` leak illustration so neither implies new DECs are written.
- [x] **Repoint broken path citations.** Four live references named a now-deleted
      per-domain file path (`functional-requirements.md`, `screen-layout.md` ×2,
      `PRD/README.md`); repointed each at the feature specs and the `decisions.md`
      index. Reworked `PRD/README.md` read-orders and precedence to lead with the
      specs.
- [x] **Consumed the Phase B audit.** `PRD/work/sweep-decision-audit/`
      (`DISPOSITION.md` + `ROLLUP.md` + per-domain verdicts) was the deletion map
      for this phase; deleted after this receipt.

## Verification

- Router index still holds 169 rows (167 `retired` + 2 `live`); every `DEC-ID`
  resolves. Grep-confirmed: no non-`deployment` `decisions/<domain>.md` path is
  referenced anywhere in the live corpus (skills, instructions, sections,
  READMEs); no spec header says "non-authoritative"; no live file still tells an
  agent to author a new `DEC-###` or treats `decisions.md` as read-first #1.
- `DEC-084` and `DEC-169` bodies intact in `sections/decisions/deployment.md`.
- Remaining `decisions.md` mentions are all the intentional demoted-index framing
  or valid cited-`DEC-ID` resolvers; receipts and `PRD/work/` history are left
  as-is by design.

## Guardrails honored

- No ID renumbered; every ID stays resolvable via the kept index.
- Measured-bounds and rejected-alternatives content already lived in the specs
  (Phase A/B); Phase C touched neither.
- PR to `main`; owner merges. No push.

## Owner follow-up (unresolved)

- **The two Lambda survivors (DEC-084, DEC-169)** still carry full bodies in
  `decisions/deployment.md`. When their content lands in a durable deployment doc
  (e.g. `docs/aws/`), they retire too and `deployment.md` can be deleted.
- `PRD/README.md` still describes the fresh-run kickoff as
  "`/graph-preflight` then `/graph-run`" — the doc bug the gameplan assigned to
  **Package 3 (operator manual)**, deliberately out of Phase C scope.
