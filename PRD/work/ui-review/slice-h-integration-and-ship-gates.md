# Slice H — Integrated regression and ship gates

## Status: planned

## Goal

Prove the complete UI correction set works together, align durable truth for
cleanup, and leave the package ready for ship-ready transition.

## Requirements

1. Re-read slices A–G and their verification evidence; resolve any integration
   regressions without weakening an acceptance criterion or adding per-screen
   forks/variants forbidden by DEC-158–160.
2. Run the complete frontend suite/build and root quality gate. Preserve coverage
   thresholds and test naming; do not delete or soften tests to turn the gate
   green.
3. Run one integrated Playwright sweep at 390×844 and 1440×900 through Quick
   Question pre-submit/answered, In-Depth game context/zone/enrichment/answered,
   Scan review, Life Tracker overlays, and Trade Balancer.
4. Record a final runtime ownership/cleanup receipt in this slice's verification
   evidence. Any open browser, owned process, or owned port blocks `done`.
5. Audit durable PRD truth for cleanup promotion and record every required
   correction in the checklist below. In particular, flag stale flow wording
   that still says fixed "compact" images or composed-length counter semantics.
   The actual durable-doc edits and package deletion execute in
   `thejudge-cleanup`, not in this implementation slice.
6. Keep package status `active` until every slice is `done`; the implement skill
   then transitions the package to `ship-ready`.

## Acceptance criteria

- [ ] All A–G acceptance criteria are checked with evidence; no unresolved handoff/blocker remains
- [ ] Integrated 390×844 sweep records: Quick Question large card + raw counter + View Context scrim/close; In-Depth triangle/select/grouped rows + zone Add `top <= 844px` + zone strip; Scan review/camera coexistence; CounterPanel outside-dismiss; Trade freshness one-line copy
- [ ] Integrated 1440×900 sweep records the corresponding desktop geometry: larger shell-column cards, side-panel card detail, grouped player rows, rail/View Context clearance, and unchanged primary destination chrome
- [ ] On both viewports, representative card-detail open/close, Menu↔History, destination switching, missing-image fallback, card Remove/Add, and inside-vs-outside overlay interactions remain functional
- [ ] `npm --workspace apps/frontend run build`, the complete frontend tests, and `npm run quality:check` are green with fresh output recorded
- [ ] Browser/session handle, checkout, ports, started-vs-attached ownership, observations, and capture path are recorded; `browser_close` succeeded, every owned server stopped by its exact handle, and every owned port is released
- [ ] PRD promotion checklist below is complete and identifies any measurement-driven `screen-layout.md` bound added by slice C
- [ ] Package README, slice statuses, marker, and `PRD/work/STATUS.md` are ready for the implement skill's `ship-ready` transition; `PRD/work/ui-review/` remains present until `thejudge-cleanup`

## PRD promotion checklist

Execution/deletion happens in `thejudge-cleanup`; this slice confirms durable
content is correct and receipt-ready.

- [ ] DEC-158, DEC-159, DEC-160 bodies are present in `PRD/sections/decisions/ui-presentation.md` with current router index lines in `PRD/sections/decisions.md`
- [ ] DEC-142, DEC-151, and DEC-156 amendment notes reflect overlay parity, popup rehost, shared close scope, and container-relative sizing
- [ ] REQ-011, REQ-091, REQ-125, REQ-128–130, and REQ-133–145 match the shipped behavior and retain unchanged contract/non-goal language
- [ ] `PRD/sections/screen-layout.md` rows for Card detail popup, View Context, Quick Question pre-submit, In-Depth Zone collection, In-Depth Enrichment, and Scan camera reflect measured final geometry; any authorized host bound is recorded there
- [ ] Cleanup correction is identified for `PRD/sections/user-flows.md`: remove fixed compact-image wording from amended card surfaces and stop saying Quick Question's visible 300-character cap measures the composed pill+textarea string; flow sequencing/payload semantics remain unchanged
- [ ] `PRD/sections/system-map.md` is inspected for affected existing catalog entries; the cleanup checklist names a behavior/Backed-by update only if shipped reality changed, and does not invent a new subsystem for a polish pass
- [ ] Cleanup receipt will include final browser measurements and runtime-cleanup evidence; `PRD/README.md` changes only if navigation/read-order guidance changed

## Verification

```bash
npm --workspace apps/frontend run test
npm --workspace apps/frontend run build
npm run quality:check
```

## Files touched

- Product/test files from slices A–G only as required by integration findings
- `PRD/work/ui-review/slice-h-integration-and-ship-gates.md` (verification evidence)

Durable PRD section edits and package deletion are intentionally deferred to
`thejudge-cleanup` by the lifecycle contract.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/ui-review/` ready to delete
