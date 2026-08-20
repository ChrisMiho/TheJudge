# Quality Check — graph-run-boundary-enforcement

Date: 2026-08-20 (re-check after refinement)
Verdict: **PASS** — all three issues from the 2026-08-20 FAIL are closed.
Package stays at `refined`; map-out owns the move to `active`.

## Checklist

| Check | Result |
| --- | --- |
| No contradiction with active `DEC-###` entries | Pass — DEC-166 is `confirmed` at `decisions/doc-process.md:244`, routed at `decisions.md:195`, extends DEC-163/DEC-164 without removing a boundary |
| Current vocabulary | Pass |
| Stack ordering preserved | N/A — no stack, API, or prompt surface touched |
| `technical-design-rules.md` constraints | Pass — agent workflow and repository configuration only; nothing in Allowed Design Direction, Forbidden Design Drift, or the prompt rules is engaged |
| Scope implementable without hidden assumptions | Pass — see issue closures below |
| Open questions reserved for genuine ambiguity | Pass — `bypassPermissions` is still held as a measurement, not a claim |
| `screen-layout.md` row where user-visible surfaces change | N/A — no screen or overlay; the brief states this explicitly |

## Issue closures

**Issue 1 — NFR-016's unreachable guarantee.** Closed by a new REQ-159 plus a
rewritten NFR-016 constraint. The mechanism is named: `graph-preflight` issues
a canary call the universal tier must deny and ends the run at `BLOCKED` if the
deny does not fire (`functional-requirements.md:3578`), and the driver confirms
between nodes that `.worktrees/.graph-node-calls.json` advanced during the node
just finished. NFR-016 now reads detect-and-refuse rather than fail-open, and
explicitly rules the profile out as a fallback on the same grounds the contract
already states at `graph-workflow-contract.md:293`. The degraded-heartbeat case
— a missing run-state file leaves nothing to advance — is stated as a limit with
the canary as the binding proof, not papered over.

**Issue 2 — the cap's unit against loop-backs.** Closed. REQ-156 now fixes the
cap as a budget for one dispatch, keyed by run id, node, **and attempt**; a
loop-back is a new attempt with a fresh budget; and the criterion "the cap adds
no third loop limit" makes the contract's existing three-FAIL and two-return
caps the only bound on dispatch count. The attempt number written to
`.worktrees/.graph-run-state.json` is now consumed by the counter key rather
than being an unused field. DEC-166's impact list carries the same reasoning.

**Issue 3 — the double-claimed contract deletion.** Closed. DEC-166's impact
list now names the `graph-ui-shape` / `graph-enrich-define` line
(`decisions/doc-process.md:253`) and assigns it here, and
`graph-single-door-workflow/IDEA.md:19` now records that this package deletes
it. One owner, one decision.

## Grounded checks

`graph-workflow-contract.md:23` still carries the stray domain-node-pack line;
lines 293 and 346-348 carry the unverified-profile direction and the two
convention-only boundaries the brief retires. REQ-152..159 are written and
mutually consistent, NFR-016 and FLOW-020 are written, and the reserved
REQ-146..151 / NFR-015 / FLOW-019 block is correctly skipped. Writer ownership
of the three `.worktrees/` records is stated once and consistently across
REQ-156, REQ-159, and DEC-166. `STATUS.refined` marker present, board row under
`## refined` at `PRD/work/STATUS.md:13`.

## Next step

`/thejudge-map-out PRD/work/graph-run-boundary-enforcement/`.
